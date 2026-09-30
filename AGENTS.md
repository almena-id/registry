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
- The landing (`/`) leads with "Continue with Almena" (the wallet; "Other
  ways in" is `/login`) and draws the model as it works: you sign for your
  tenant from your wallet, its issuers, verifiers and mediators hang from it;
  three numbered points below.
- The overview opens with "Awaiting you": identities whose DID is pending or
  has changes to sign (`GET /tenants/{id}/signatures`) and — for whoever
  signs as the tenant with no wallet — the way to link one; those who sign
  get the buttons. Who signs is the tenant's signing flow, not the role: the
  API says it per tenant (`Tenant.signs`). Lists tag each row published or
  draft (issuers, verifiers, mediators) and with its DID's signature.
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
  are shown disabled.
- "Continue with Almena" (`/login/almena`) and linking a wallet
  (`/dashboard/account/almena`) share `WalletRequest`: the API's request drawn
  as a QR code (`qrcode`, server side) and an `almena://` link, then a poll
  every two seconds (`app/lib/wallet-actions.ts`); the poll secret stays in the
  HTTP-only `almena.wallet` cookie. A new wallet signs up an account with no
  email.
- Sign-in goes through server actions (`app/lib/auth-actions.ts`): the API's
  bearer token is kept in the HTTP-only `almena.session` cookie on this origin
  and sent by the server (`app/lib/api.ts`); the browser never holds it.
- User-facing text is translatable: English (`en`) is the source and fallback,
  Spanish (`es`) the first translation (`app/i18n/messages/*.json`). No
  hard-coded user-facing strings. The language is the selector's choice
  (`almena.locale` cookie), else the browser's Accept-Language.
- The interface is shadcn/ui (`components.json`, Radix base): its components
  live in `app/components/ui` (add more with `npx shadcn@latest add <name>`),
  everything is styled with Tailwind utilities, and `cn` is in
  `app/lib/utils.ts`. Almena variants were added to them (Button `danger`,
  Badge `brand`/`pending`/`muted`/`danger`, Alert `notice`). Icons are
  `lucide-react`.
- Light/dark/system is the `almena.theme` cookie, rendered as `data-theme` on
  `<html>` by the server; Tailwind's `dark:` follows it. `app/globals.css`
  holds only the theme — shadcn's variables carrying the wallet's palette — and
  is the only place a colour is written.
- Dates and times are always written with `formatDateTime` (`app/lib/format.ts`)
  in the visitor's locale and time zone (`getTimeZone()`: the `almena.timezone`
  cookie, else UTC). Signed in, the header carries the time zone selector;
  the language and theme menus are in the footer of every page
  (`ChoiceMenu`, a shadcn DropdownMenu). Form fields choose with `Select`
  (shadcn's, carrying the value in a hidden input).
- Dashboard sections: `/dashboard/{issuers|verifiers|mediators|identities}` list the
  current tenant's items (the header's tenant) with infinite scroll — the first
  page is rendered on the server, the rest come from the `loadMore` server
  action as the marker under the list nears the viewport (`InfiniteList`).
  "Create" opens `/dashboard/{section}/new`. Issuers and verifiers have a name,
  a description and, optionally, one of the tenant's mediators; mediators a
  name and the address they listen on (https); identities only a name
  until the DID method is decided.
  The tenant has no menu entry: it is chosen in the header, kept by id in the
  HTTP-only `almena.tenant` cookie (the oldest while none is chosen, or the
  chosen one is no longer the account's); choosing one goes back to the
  overview. Code asks for it with `currentTenant()` (`app/lib/api.ts`),
  never `currentTenants()[0]`.
- `/dashboard/users` lists the current tenant's members and pending
  invitations; admins see "Add user", which opens `/dashboard/users/new`
  (email + role, admin or member). The invitee joins the next time they sign
  in with that address. The user's role comes with `/tenants` (`Tenant.role`).
- Naming: the interface calls the tenant an **Account** ("Cuenta") and the
  person's own account a **Profile** ("Perfil"). Only the words changed: routes
  (`/dashboard/tenant`, `/dashboard/account`), code and the API keep "tenant"
  and "account".
- The side menu is two cards: what the tenant works with (overview, issuers,
  verifiers, identities) and the tenant itself (Account and Users). The
  avatar menu's top entry opens `/dashboard/account` (the Profile): the
  alias (editable, `PATCH /auth/me`) and the account's ways in — the email
  (optional: an account may have none, so names fall back to the alias) and
  the linked wallets and provider accounts, each removable but the last. An email is linked at `/dashboard/account/email` (the
  code, as when signing in); a provider through `/auth/{provider}/start?link=1`,
  which marks the flow with the `almena.oauth.link` cookie so the callback
  links instead of signing in. A way in that belongs to another account lands
  on `/dashboard/account/taken` (the API's move ticket, or `none`, in the
  `almena.move` cookie): an empty account may be deleted there to continue in
  the other one.
- Never delete `.next` while a dev server may be running: it breaks it (500s).
  `task check` builds fine alongside `next dev`.
- `/dashboard/tenant` has tabs (the shared `Tabs`, as items have): Data (the
  tenant's name and the mediator its own identity uses; admins edit, members
  read), Billing (`/dashboard/tenant/billing`: "Soon", nothing to bill yet)
  and JSON (`/dashboard/tenant/json`: its DID document, shown as items show
  theirs, `DidDocuments`).
- Under Account, the side menu has two more entries of the tenant's own:
  Signing (`/dashboard/signing`: the signing flow — who signs as
  the account, listed from `app/lib/signing-flows.ts`, a module of its own so
  the client form can import it — in two halves: on the left its
  configuration, the choice and what that flow asks for (`single_user`: the
  member who signs, admin or not); on the right how the flow in the select
  works, drawn by `FlowExplained` with what it gains and costs, redrawn as
  the select changes; admins edit, members read) and
  Domains (`/dashboard/domains`: the domains linked to the
  tenant, each with the DNS TXT record that proves it; admins add, check and
  remove; verified ones go into the tenant's DID document, which then asks to
  be signed; "Add" opens `/dashboard/domains/new`, and the list rows
  open to show each record).
- Mediators are registered, not discovered: the API fetches nothing from the
  address, it gives the mediator an identity of its own whose DID document
  publishes that address; the DID documents of the tenant, issuers and
  verifiers name the chosen mediator's DID. A mediator opens at
  `/dashboard/mediators/{id}`: its name and address (any member edits them) and
  its DID, which never changes.
- DIDs are `did:webvh`, signed by people: every item's Summary shows its DID
  (none while pending) and its signature — pending, signed, or changes to
  sign — and whoever signs as the tenant gets "Sign", which opens `/dashboard/{section}/{id}/sign`
  (outside the tabs, like delete): `WalletRequest` with `purpose: "sign"`
  asks the API to prepare the identity's next log entry and shows the QR for
  the signer's wallet; signed, it comes back to the item. Publishing an item
  whose identity is pending is refused ("Sign its identity first"). The JSON
  tab shows the published document when signed, the one to sign while
  pending, and both when there are changes to sign — saying in which fields
  they differ.
  The Signing tab warns when the chosen signer has no Almena wallet linked:
  without one the DID document has no key for what they sign.
- Identities are the tenant's register of DIDs. The tenant and every issuer,
  verifier and mediator have one of their own, created with them and named like them
  (never shared). Lists show the link both ways (the identity on an issuer or
  verifier; its use on an identity). The tenant's is shown on
  `/dashboard/tenant`.
- Every item opens at `/dashboard/{section}/{id}`, all laid out alike: the
  layout in `[section]/[id]/(tabs)/` draws the way back, the name with the
  operations beside it in one row, and the tabs below — Summary (`/{id}`, the
  facts), Data (`/{id}/data`, the form; not for identities, which have no
  fields), Signing (`/{id}/signing`, issuers and verifiers: the signing system
  — so far one specific member signs; admins set it, members read it) and JSON
  (`/{id}/json`, the DID document). `load.ts` asks the API
  for the item once per request; `Detail.tsx` holds the shared shapes. Issuers,
  verifiers and mediators are edited by any member; the operations are icons
  (`ResourceActions`): publish, for whoever signs as the tenant — which is
  endorsing it: its own screen (`/{id}/publish`), where the signer's wallet
  signs the tenant's membership credential and the item's `whois.vp` in one
  approval — and, for admins, unpublish and delete, which asks on its own screen (`/{id}/delete`). The
  Summary shows the endorsement (its `whois.vp`, until when). A draft's DID does not
  resolve and the API's public catalogue does not list it.
