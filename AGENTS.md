<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# registry

The web portal of the Almena Network registry; its data comes from
`../api` (FastAPI). Everything is written in English. Use `task` for
everything (`task --list`); `task check` must pass before finishing.

- The portal is `https://registry.almena.network` (`NEXT_PUBLIC_REGISTRY_WEB_URL`),
  the API `https://api.almena.network`: `process.env.REGISTRY_API_URL`
  on the server, `process.env.NEXT_PUBLIC_REGISTRY_API_URL` in the browser
  (inlined at build).
- `app/health/route.ts` is the Docker health check: keep it dependency-free.
- `output: "standalone"` in `next.config.ts` is what the Dockerfile ships.
- Pages: `/` (landing) and `/login` live in the `(site)` group, which brings
  the public header; `/login` is in `(auth)`, which sends a signed-in
  visitor to the dashboard), `/dashboard` (its layout asks the API
  for the account and sends anyone signed out to `/login`).
- There are no passwords: `/login` is one flow for signing up and in — email,
  then the six-digit code the API mails (Mailpit in development).
- Social sign-in (Google, Microsoft, Apple, GitHub) goes through route handlers:
  `/auth/{provider}/start` asks the API for the provider URL and keeps its
  `state` in the `almena.oauth` cookie; `/auth/{provider}/callback` checks the
  state against that cookie before the API finishes it (Apple's form_post is
  turned into a GET first, since a cross-site POST carries no Lax cookie).
  Failures return to `/login?error=…`. Providers the API has no credentials for
  are shown disabled; "Continue with Almena" is there and does nothing yet.
- Sign-in goes through server actions (`app/lib/auth-actions.ts`): the API's
  bearer token is kept in the HTTP-only `almena.session` cookie on this origin
  and sent by the server (`app/lib/api.ts`); the browser never holds it.
- User-facing text is translatable: English (`en`) is the source and fallback,
  Spanish (`es`) the first translation (`app/i18n/messages/*.json`). No
  hard-coded user-facing strings. The language is the selector's choice
  (`almena.locale` cookie), else the browser's Accept-Language.
- Light/dark/system is the `almena.theme` cookie, rendered as `data-theme` on
  `<html>` by the server. `app/globals.css` is the only place a colour is
  written; the palette is the wallet's.
- Dates and times are always written with `formatDateTime` (`app/lib/format.ts`)
  in the visitor's locale and time zone (`getTimeZone()`: the `almena.timezone`
  cookie, else UTC). Signed in, the header carries the time zone selector;
  the language and theme menus are in the footer of every page
  (`ChoiceMenu`). All follow almena-id/frontend's combos.
- Dashboard sections: `/dashboard/{issuers|verifiers|identities}` list the
  current tenant's items (the header's tenant) with infinite scroll — the first
  page is rendered on the server, the rest come from the `loadMore` server
  action as the marker under the list nears the viewport (`InfiniteList`).
  "Create" opens `/dashboard/{section}/new`. Issuers and verifiers have a name
  and a description; identities only a name until the DID method is decided.
  The tenant has no menu entry: it is chosen in the header.
- `/dashboard/users` lists the current tenant's members and pending
  invitations; admins see "Add user", which opens `/dashboard/users/new`
  (email + role, admin or member). The invitee joins the next time they sign
  in with that address. The user's role comes with `/tenants` (`Tenant.role`).
- The side menu is two cards: what the tenant works with (overview, issuers,
  verifiers, identities) and the tenant itself (Tenant and Billing — "Soon" —
  and Users). The account menu's top entry opens `/dashboard/account`: the
  alias (editable, `PATCH /auth/me`) beside the email (read-only).
- Never delete `.next` while a dev server may be running: it breaks it (500s).
  `task check` builds fine alongside `next dev`.
- `/dashboard/tenant`: the tenant's name and its mediator (the mailbox of all
  its issuers and verifiers). Admins edit; members see it read-only. The API
  checks the mediator by reading its did:web document and keeps its DID.
- Identities are the tenant's register of DIDs. Every issuer and verifier acts
  as one: creating one offers a new identity named like it (the default) or an
  existing one, so one DID can issue and verify. Lists show the link both ways
  (the identity on an issuer or verifier; its uses on an identity).
  The tenant has an identity of its own too (created and renamed with it),
  shown on `/dashboard/tenant`; issuers and verifiers may act as it.
