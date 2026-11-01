"""The real API on a throwaway SQLite database with one signed-in account,
for the signed-in end-to-end tests (`playwright.config.ts` starts it).

Run from ../api's environment, with ../api on PYTHONPATH (its test helpers
sign in and sign for it):
`PYTHONPATH=../api uv run --project ../api python e2e/demo_api.py .e2e`.
It fills the account "Nova University" — a form, an issuer signed and
published granting a degree with it, and an application a holder sent —,
writes the account's session to `<dir>/demo.token` and serves on
127.0.0.1:8767.
"""

import asyncio
import sys
from pathlib import Path
from urllib.parse import urlparse

import uvicorn
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from registry_api.broker import get_broker
from registry_api.broker.memory import MemoryBroker
from registry_api.db import get_session
from registry_api.mail import get_mailer
from registry_api.main import app
from registry_api.models import Base
from registry_api.root import create_root
from registry_api.trust_anchor import ANCHOR_NAME
from tests.conftest import Outbox
from tests.fake_wallet import FakeWallet
from tests.signing import publish, ready, sign
from tests.test_applications import _ask, _sign_submission
from tests.test_directory import _sign_in

OUT = Path(sys.argv[1]).resolve()
PORT = 8767


async def build(sessions: async_sessionmaker) -> None:  # type: ignore[type-arg]
    async with sessions() as db:
        await create_root(db, ANCHOR_NAME, "anchor@example.net")
    outbox = Outbox()
    app.dependency_overrides[get_mailer] = lambda: outbox
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers, tenant = await _sign_in(client, outbox, "ada@nova.example")
        base = f"/api/v1/tenants/{tenant}"
        named = await client.patch(
            base, json={"name": "Nova University", "languages": ["en", "es"]}, headers=headers
        )
        assert named.status_code == 200, named.text
        wallet = await ready(client, headers, tenant)
        form = await client.post(
            f"{base}/forms",
            json={
                "name": {"en": "Application", "es": "Solicitud"},
                "fields": [{"ref": "given_name"}, {"ref": "family_name"}, {"ref": "email"}],
            },
            headers=headers,
        )
        assert form.status_code == 201, form.text
        issuer = await client.post(
            f"{base}/issuers", json={"name": "Nova Academic Office"}, headers=headers
        )
        assert issuer.status_code == 201, issuer.text
        issuer_id = issuer.json()["id"]
        granted = await client.put(
            f"{base}/issuers/{issuer_id}/credential-types",
            json={"types": ["academic_degree"], "forms": {"academic_degree": form.json()["id"]}},
            headers=headers,
        )
        assert granted.status_code == 200, granted.text
        await sign(client, headers, tenant, issuer.json()["identity"]["id"], wallet)
        await publish(client, headers, tenant, "issuers", issuer_id)

        # A holder applies from a wallet: what the applications inbox shows.
        slug = next(
            item["slug"]
            for item in (await client.get("/api/v1/catalog/issuers")).json()["items"]
            if item["name"] == "Nova Academic Office"
        )
        started = (
            await client.post(
                "/api/v1/applications", json={"issuer": slug, "type": "academic_degree"}
            )
        ).json()
        at = f"/api/v1/applications/{started['id']}"
        secret = {"X-Application-Secret": started["secret"]}
        holder = FakeWallet()
        pairing = await _ask(client, at, secret, "pair")
        await client.post(
            urlparse(pairing["response_uri"]).path, data={"id_token": holder.id_token(pairing)}
        )
        answers = {"given_name": "Amina", "family_name": "Haddad", "email": "amina@example.org"}
        saved = await client.put(f"{at}/answers", json={"answers": answers}, headers=secret)
        assert saved.status_code == 200, saved.text
        submit = await _ask(client, at, secret, "submit")
        sent = await client.post(
            urlparse(submit["response_uri"]).path,
            json={"signature": _sign_submission(holder, submit)},
        )
        assert sent.status_code < 300, sent.text
    (OUT / "demo.token").write_text(headers["Authorization"].split(" ", 1)[1])


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    engine = create_async_engine(f"sqlite+aiosqlite:///{OUT / 'demo.db'}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def session():  # type: ignore[no-untyped-def]
        async with sessions() as db:
            yield db

    app.dependency_overrides[get_session] = session
    broker = MemoryBroker()
    app.dependency_overrides[get_broker] = lambda: broker
    await build(sessions)
    print(f"e2e API on http://127.0.0.1:{PORT}", flush=True)
    await uvicorn.Server(
        uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="warning")
    ).serve()


asyncio.run(main())
