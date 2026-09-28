<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# registry

The web portal of the Almena Network registry; its data comes from
`../api` (FastAPI). Everything is written in English. Use `task` for
everything (`task --list`); `task check` must pass before finishing.

- The portal is `https://registry.almena.id` (`NEXT_PUBLIC_REGISTRY_WEB_URL`),
  the API `https://api.almena.id`: `process.env.REGISTRY_API_URL`
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
- Dashboard sections: `/dashboard/{issuers|verifiers|mediators|identities}` list the
  current tenant's items (the header's tenant) with infinite scroll — the first
  page is rendered on the server, the rest come from the `loadMore` server
  action as the marker under the list nears the viewport (`InfiniteList`).
  "Create" opens `/dashboard/{section}/new`. Issuers and verifiers have a name,
  a description and, optionally, one of the tenant's mediators; mediators a
  name and the address they listen on (https); identities only a name
  until the DID method is decided.
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
- `/dashboard/tenant`: the tenant's name and the mediator its own identity uses
  (one of its mediators). Admins edit; members see it read-only.
- Mediators are registered, not discovered: the API fetches nothing from the
  address, it gives the mediator an identity of its own whose DID document
  publishes that address; the DID documents of the tenant, issuers and
  verifiers name the chosen mediator's DID. A mediator opens at
  `/dashboard/mediators/{id}`: its name and address (any member edits them) and
  its DID, which never changes.
- Identities are the tenant's register of DIDs. The tenant and every issuer,
  verifier and mediator have one of their own, created with them and named like them
  (never shared). Lists show the link both ways (the identity on an issuer or
  verifier; its use on an identity). The tenant's is shown on
  `/dashboard/tenant`.
- `/dashboard/certification`: the tenant asks Almena to certify it — legal
  name, domain (proved by the DNS TXT record the API gives), logo (PNG, JPEG or
  WebP up to 256 KB, sent to the API as the raw body) — then sends it for
  review. Admins fill it in; members read it. The one in force stays while a
  change is reviewed. A certified tenant carries a mark in the header selector
  (`Tenant.certified`).
- Almena's reviewers (members of the API's root tenant, created by `init-root`;
  `User.reviewer`) get a third menu card, "Review": `/dashboard/review` lists
  the requests waiting, `/dashboard/review/{id}` approves or rejects with a
  reason. Signed credentials for certified tenants come once key custody is
  decided.
- Every item opens at `/dashboard/{section}/{id}`, all laid out alike: the
  layout in `[section]/[id]/(tabs)/` draws the way back, the name with the
  operations beside it in one row, and the tabs below — Summary (`/{id}`, the
  facts), Data (`/{id}/data`, the form; not for identities, which have no
  fields), Signing (`/{id}/signing`, issuers and verifiers: the signing system
  — so far one specific member signs; admins set it, members read it) and JSON
  (`/{id}/json`, the DID document). `load.ts` asks the API
  for the item once per request; `Detail.tsx` holds the shared shapes. Issuers,
  verifiers and mediators are edited by any member; admins get the operations
  as icons (`ResourceActions`): publish or unpublish, and delete, which asks
  on its own screen (`/{id}/delete`, outside the tabs). A draft's DID does not
  resolve and the API's public catalogue does not list it.
