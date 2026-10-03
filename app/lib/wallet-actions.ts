"use server";

import { cookies } from "next/headers";
import QRCode from "qrcode";

import { getLocale } from "@/app/i18n/server";
import { api, currentTenant, sessionCookie, type SignedIn } from "./api";
import { keepMove, keepSession } from "./session";
import { safeBack } from "./status-lists";

/** The request in flight — purpose, id, poll secret, where to go after — for this browser only. */
const walletCookie = "almena.wallet";

export type WalletPurpose = "sign_in" | "link" | "sign";

/**
 * `sign`: what is signed — an identity's next log entry, or an item's
 * endorsement (publishing it) — and where to go back to once it is.
 */
export type SignTarget =
  | { kind: "identity"; id: string; back: string }
  | {
      kind: "endorsement";
      section: "issuers" | "verifiers" | "mediators";
      id: string;
      back: string;
    }
  /** An accepted application's credential, signed by its issuer's signer. */
  | { kind: "credential"; id: string; back: string }
  /** An issuer's status list as it is (`list`; its current one if absent). */
  | { kind: "status_list"; issuer: string; list?: string; back: string }
  /** An issued credential given a new status, in its issuer's status list. */
  | {
      kind: "credential_status";
      id: string;
      status: "valid" | "suspended" | "revoked";
      back: string;
    };

type Kept = { purpose: WalletPurpose; id: string; poll: string; back?: string };

/** Why a request could not be made: the API's code, when it gave one. */
export type WalletStart =
  | { ok: true; deepLink: string; qr: string; expiresAt: string }
  | { ok: false; error: string | null };

/** What the page does next: keep waiting, go somewhere, or start over. */
export type WalletPoll =
  | { status: "pending" }
  | { status: "done"; to: string }
  | { status: "expired" }
  | { status: "failed" };

type Created = {
  id: string;
  deep_link: string;
  poll: string;
  expires_at: string;
};

type Result = {
  status: "pending" | "signed_in" | "linked" | "taken" | "signed";
  session: SignedIn | null;
  move_ticket: string | null;
};

/**
 * Ask the API for a request the wallet can answer, and draw it as a QR code.
 * The poll secret stays in an HTTP-only cookie: the page never sees it.
 */
export async function startWallet(
  purpose: WalletPurpose,
  target?: SignTarget,
): Promise<WalletStart> {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;
  const locale = await getLocale();
  let created: { data: Created | null; detail: string | null };
  if (purpose === "sign") {
    const tenant = await currentTenant();
    if (!target || !tenant) return { ok: false, error: null };
    const base = `/tenants/${tenant.id}`;
    const [path, extra] =
      target.kind === "identity"
        ? [`${base}/identities/${encodeURIComponent(target.id)}/sign`, {}]
        : target.kind === "credential"
          ? [`${base}/applications/${encodeURIComponent(target.id)}/issuance/sign`, {}]
          : target.kind === "status_list"
            ? [
                `${base}/issuers/${encodeURIComponent(target.issuer)}/status-lists/sign`,
                target.list ? { status_list_id: target.list } : {},
              ]
            : target.kind === "credential_status"
              ? [
                  `${base}/applications/${encodeURIComponent(target.id)}/credential-status`,
                  { status: target.status },
                ]
              : [`${base}/${target.section}/${encodeURIComponent(target.id)}/publish`, {}];
    created = await api<Created>(path, {
      method: "POST",
      body: { locale, ...extra },
      token,
    });
  } else {
    created = await api<Created>("/auth/wallet/requests", {
      method: "POST",
      body: { purpose, locale },
      token: purpose === "link" ? token : undefined,
    });
  }
  const data = created.data;
  if (!data) return { ok: false, error: created.detail };
  const kept: Kept = {
    purpose,
    id: data.id,
    poll: data.poll,
    // Where the page goes once signed: the browser says, so only one of the
    // dashboard's own paths is kept.
    back: target ? safeBack(target.back, "/dashboard") : undefined,
  };
  store.set(walletCookie, JSON.stringify(kept), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(data.expires_at),
  });
  const qr = await QRCode.toString(data.deep_link, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return { ok: true, deepLink: data.deep_link, qr, expiresAt: data.expires_at };
}

export async function pollWallet(): Promise<WalletPoll> {
  const store = await cookies();
  let kept: Kept;
  try {
    kept = JSON.parse(store.get(walletCookie)?.value ?? "");
  } catch {
    return { status: "expired" };
  }
  const { status, data } = await api<Result>(
    `/auth/wallet/requests/${encodeURIComponent(kept.id)}/result`,
    {
      method: "POST",
      body: { poll: kept.poll },
      token:
        kept.purpose === "sign_in"
          ? undefined
          : store.get(sessionCookie)?.value,
    },
  );
  if (status === 404 || status === 410) {
    store.delete(walletCookie);
    return { status: "expired" };
  }
  if (!data) return { status: "failed" };
  if (data.status === "pending") return { status: "pending" };

  store.delete(walletCookie);
  if (data.status === "signed")
    return { status: "done", to: `${kept.back ?? "/dashboard"}?signed=1` };
  if (data.status === "signed_in" && data.session) {
    await keepSession(data.session);
    return { status: "done", to: "/dashboard" };
  }
  if (data.status === "linked")
    return { status: "done", to: "/dashboard/account?linked=1" };
  await keepMove(data.move_ticket);
  return { status: "done", to: "/dashboard/account/taken" };
}
