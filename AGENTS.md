<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# registry

The web portal of the Almena ID registry; its data comes from
`../api` (FastAPI). Everything is written in English. Use `task` for
everything (`task --list`); `task check` must pass before finishing.

- The portal is `https://registry.almena.id` (`NEXT_PUBLIC_REGISTRY_WEB_URL`),
  the API `https://api.almena.id`: `process.env.REGISTRY_API_URL`
  on the server, `process.env.NEXT_PUBLIC_REGISTRY_API_URL` in the browser
  (inlined at build).
- `app/health/route.ts` is the Docker health check: keep it dependency-free.
- `app/.well-known/`: `security.txt` (RFC 9116, this repository's advisories)
  and `did-configuration.json`, read as it is from `REGISTRY_WEB_WELL_KNOWN_DIR`:
  the Domain Linkage Credential tying this origin to `did:web:almena.id` is
  signed elsewhere, the portal holds no key.
- `output: "standalone"` in `next.config.ts` is what the Dockerfile ships.
- The landing (`/`) leads with "Continue with Almena" (the wallet; "Other
  ways in" is `/login`) and draws the model as it works: you sign for your
  tenant from your wallet, its issuers, verifiers and mediators hang from it;
  three numbered points below.
- The overview opens with "Awaiting you": identities whose DID is pending or
  has changes to sign (`GET /tenants/{id}/signatures`) and — for whoever
  signs as the tenant with no wallet — the way to link one; those who sign
  get the buttons. Who signs is the tenant's signing flow, not the role: the
  API says it per tenant (`Tenant.signs`). Below it, "Account health"
  (`Health.tsx`): the API's score (`GET /tenants/{id}/health`, a percentage
  and a bar) and its checks in order — name, mediator, signing flow, more to
  come — each done, or pending with the task and a "Set up" link to where it
  is done. The checks and their order are the API's; the portal only words
  them (`dashboard.health.tasks.{check}_{issue}`). Lists tag each row published or
  draft (issuers, verifiers, mediators) and with its DID's signature.
- Verifiers have a Verify tab (`(tabs)/verify`, `VerifyByQr`,
  `app/lib/verification-actions.ts`): pick one of the tenant's forms that asks
  for credentials, show its QR (`POST …/verifiers/{id}/verifications`, the
  code drawn server side), poll every two seconds until the wallet answers,
  and show the verdict (`Verdict`, shared with the form's Verify tab). Only a
  published verifier asks: the wallet is shown its DID.
- Issuers and verifiers have a Queue tab (`(tabs)/queue`, `lib/queues.ts`,
  `lib/queue-actions.ts`): their queue at the broker and how their back office
  connects (AMQP address, virtual host, user). Admins make it — the user's
  password shows that once, the registry never sees it again — and delete it,
  asking first; changing the password is the API's and the CLI's
  (`POST …/queue/access`), not a button here.
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
- Rules checked here (required, lengths, formats, allowed values, what an
  item's state lets you do) are for the person's sake, never the guard: the
  API checks every one of them again and is the one that decides. A rule
  added here goes into the API in the same change; one only here is a bug.
- User-facing text is translatable: English (`en`) is the source and fallback,
  Spanish (`es`) the first translation (`app/i18n/messages/*.json`). No
  hard-coded user-facing strings. The language is the selector's choice
  (`almena.locale` cookie), else the browser's Accept-Language.
- Typefaces, self-hosted with `next/font` in `app/layout.tsx`: Chakra Petch
  (`font-brand`: headings, the wordmark), Inter (`font-sans`: the
  interface), JetBrains Mono (`font-mono`: DIDs, URLs, digests, JSON).
- The interface is shadcn/ui (`components.json`, Radix base): its components
  live in `app/components/ui` (add more with `npx shadcn add <name>`, the CLI
  pinned in devDependencies), everything is styled with Tailwind utilities,
  and `cn` comes from the `cn` package. Every form field is shadcn's `Field`
  (`FieldLabel`, `FieldDescription`, `FieldError`; groups `FieldSet` and
  `FieldLegend`; a checkbox with its text `orientation="horizontal"`), its
  `data-invalid` following the control's `aria-invalid`. Almena variants were added to them (Button `danger`,
  Badge `brand`/`pending`/`muted`/`danger`, Alert `notice`). Icons are
  `lucide-react`.
- Green `#1f9d55` is the registry's identity: `--primary` and `--ring` in
  both themes (`--brand-strong` `#18804a` light, `#34b56c` dark), and the
  Almena mark (`Logo`, `app/icon.svg`).
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
  "Create" opens `/dashboard/{section}/new`. Issuers and verifiers have a name
  (one text: the entity's own, carried in its DIDs and credentials), a
  description by language (`MultilingualInput`, shown in the visitor's
  language) and, optionally, a mediator; mediators a name, the address
  they listen on — a subdomain typed before one of the tenant's verified
  domains, picked from a list (`https://{subdomain}.{domain}`; with none
  verified, the list is empty and a link leads to Domains) — and whether they are public; identities only a name
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
- The side menu is three cards: what the tenant works with (overview,
  issuers, verifiers, mediators, identities), the templates (Forms, Fields,
  Credential types and, for the trust anchor, Value lists, Field categories
  and Credential categories) and the tenant itself (Account and Users). The
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
  Below the ways in, API tokens (`Tokens.tsx`, `app/lib/token*.ts`): for
  scripts, CI and the `almena` CLI, each acting as the account until it
  expires (1–365 days) or is revoked (asked inline first); a new one's secret
  shows once.
- Every create screen (`/dashboard/{issuers|verifiers|mediators|identities|forms|domains|users}/new`)
  opens with `CreateHeader`: the breadcrumb (shadcn's `Breadcrumb`) — the
  overview, the section's list named as the side menu names it, the screen —
  then its title and lead.
- Never delete `.next` while a dev server may be running: it breaks it (500s).
  `task check` builds fine alongside `next dev`.
- `/dashboard/tenant` has tabs (the shared `Tabs`, as items have): Data (the
  tenant's name, the mediator its own identity uses and the languages it works
  in — ticked from the platform's, `locales`, one at least; a new account starts
  with the one it signed up in, the trust anchor has them all, fixed; admins
  edit, members read), Billing (`/dashboard/tenant/billing`, `app/lib/subscriptions.ts`: the
  subscription — plan, where it stands, until when — and each feature it gives,
  included or not; with none, the free use; payments are not open yet, so it
  says to contact Almena; the trust anchor has everything)
  and JSON (`/dashboard/tenant/json`: its DID document, shown as items show
  theirs, `DidDocuments`).
- Subscriptions: what an account may make of its own (fields, credential
  types) comes with one (`Tenant.features`, the API's `entitlements`); without
  it the catalogue offers no "Create" nor "Edit" — what it made stays, works and
  may be deleted. The trust anchor's admins get one more entry under Account,
  Accounts (`/dashboard/accounts`): every other account, searched by name or
  slug, with or without a subscription, a page at a time; each opens
  (`/dashboard/accounts/{id}`, `SubscriptionForm`, `app/lib/subscription-actions.ts`)
  to set its status (none: back to the free use), plan, the day it is paid
  through and a note only the anchor reads — by hand, until payments arrive.
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
- Forms (`/dashboard/forms`, in the middle card): what
  people fill in for the tenant's flows. A form does not depend on who puts
  it: the same form serves an issuer's offer (holders applying for a
  credential, checked by hand or with the issuer's back office) or, later, a
  verifier's. Every field comes from the
  catalogue: Almena's (`GET /catalog/fields`, public) and the tenant's own
  (`GET /tenants/{id}/fields`, `custom:{key}` in forms), merged by
  `fetchTenantCatalogue` (`app/lib/field-catalog.ts`) with the tenant's as one
  more category, "Your fields"; names, formats, value lists and labels are the
  API's — the portal only shows them in the visitor's language.
  "Create" opens `/dashboard/forms/new` (`FormBuilder`): name, description
  and the fields in order, added from a searchable picker by category; each
  says whether it is required, a line of help, a name of its own for a
  repeatable field (a file asked for twice) and, where the field allows it,
  restricts it (values or file formats ticked, a date range, a shorter text).
  `app/lib/form-fields.ts` is shared by the builder, the list and the action,
  which checks each field before the API does. Below the fields,
  `CredentialsSection`: the credentials the form asks to be presented — each
  a type of the credential catalogue (`app/lib/credential-catalog.ts`), with
  its name in the form, required or not, a purpose the wallet shows, the
  claims ticked and whom it is trusted from (any published issuer granting
  it, chosen ones searched in the public catalogue of issuers — `IssuerPicker`: by a part of the name or DID among those granting the type, a page at a time, `GET /catalog/issuers?grants=…&q=…` through `app/lib/issuer-search-actions.ts` —, or — the EU PID — its
  own framework); each says, live, which of the form's fields it fills.
  Any member creates; the list rows open to show each field, a group's parts,
  what is restricted, and the credentials asked for. A form opens at
  `/dashboard/forms/{id}` (tabs in `forms/[id]/(tabs)`): Verify — a
  verifier's `vp_token` (OpenID4VP), with the nonce and audience its key
  binding must carry, checked by the API (`POST …/forms/{id}/verify`,
  `app/lib/verify-actions.ts`) and shown credential by credential, problems
  worded (`dashboard.forms.detail.problems`) —, DCQL (the query a wallet is
  asked with) and JSON Schema (what its answers meet).
- The catalogue's screens are entries of the Templates card, below Forms, in
  the `app/dashboard/(templates)` route group (with the shared `CatalogueList`
  and `field-draft.ts`); old `/dashboard/catalogue…` links redirect
  (`next.config.ts`).
- Fields (`/dashboard/fields`): the tenant's own fields
  first, then Almena's, read only, by category — each row opens to its
  standard, a group's parts, its values (long lists summed up by their
  domain), its bounds and, for Almena's, its published JSON Schema. "Create
  field" opens `/dashboard/fields/new` (`CustomFieldForm`): labels in
  English and Spanish (one at least), a key (never one of Almena's), the type
  (groups only for the trust anchor: their parts in `PartsEditor` — key,
  always present or not, type, label, a length or a value list; moved, added,
  removed) and what it needs — length and pattern, the options with their
  labels — or, for a list, one of the anchor's value lists instead ("Values
  from") —, the file formats. Any member creates, edits and deletes them; a
  field a form asks for is not deleted (`field_in_use`). Rows open to "Edit"
  (`/dashboard/fields/{id}/edit`, the same `CustomFieldForm`, its key
  fixed, filled from the API's `definition`): while something uses the field
  the API only takes changes that turn away nothing it took (a longer text,
  more options or formats; a group keeps its parts, new ones optional). The trust anchor (the root,
  `Tenant.anchor`) keeps Almena's catalogue itself: it has no "Your fields",
  Almena's rows open to "Delete" (refused while any account's form or one of
  its credential types uses the field), and its "Create field" also asks the
  category and the standard (`source`), with labels in every language.
- Every catalogue screen lists as the dashboard's other lists do
  (`CatalogueList`): a card of rows — name, key, a line (source, values,
  description) and tags on the left; facts on the right (type and category,
  claims and formats, codes and uses); then the actions as icons, no text:
  duplicate (the create screen filled from it, `?from={id}`, key
  `{key}_copy`: `field-draft.ts`, `credentials/type-draft.ts`), the published
  schema, delete (asked first; disabled, with why, while in use). Clicking a
  row opens it to edit; there is no Edit button. Over 8 rows, a filter.
- Fields and Credential types are every account's entries; the trust anchor
  has three more: Value lists (`/dashboard/value-lists`, `app/lib/value-domains.ts`,
  `app/lib/value-domain-actions.ts`) — the codes coded fields draw on, each
  with its source, codes and the fields using it; `DomainForm` edits name,
  source, what the values are (texts or whole numbers, fixed once made) and the
  codes in order (value, its name with `MultilingualInput` as every text, a media type for file formats),
  long lists found by a filter; while used it only grows (`domain_in_use`) —,
  and Field categories and Credential categories (`/dashboard/categories/{fields|credentials}`,
  one route by kind, `categories/kinds.ts`; `app/lib/categories.ts`,
  `app/lib/category-actions.ts`), what fields and credential types are
  filed under, each with how much is filed under it,
  created (`…/new`, `CategoryForm`: the screen's kind, key, a name in
  every language), renamed (`…/{id}/edit`; kind and key fixed) and deleted
  while nothing is (`category_in_use`). Whatever the anchor keeps only it
  changes; what an account makes of its own only it sees and uses.
  Credential types (`/dashboard/credential-types`): Almena's types, read
  only, by category — each opens to its claims (fields of the catalogue, the
  always-present ones marked), how each format names it (vct, W3C type, mdoc
  doctype) and its published schema and type metadata; types issued elsewhere
  (the EU PID) are tagged so. Above them, "Your credential types": an
  account's own (`custom:{key}`, `GET …/credential-types`), when its
  subscription allows it (`Tenant.features` has `own_credential_types`; the
  API's `entitlements`) or it has some — its issuers grant them, its forms
  ask for them (`fetchTenantCredentialCatalogue` merges them with Almena's),
  claims of Almena's fields or its own, published under its slug; the same
  create and edit screens, without issuance or vct, one language and no
  standard enough. For the trust anchor Almena's are its own: "Create
  credential type" opens `/dashboard/credential-types/new`
  (`CredentialTypeForm`, `app/lib/credential-type-actions.ts`; 404 for any
  other account) — name and description in every language, key, category,
  standard, the claims ticked from the catalogue's fields (no files), each
  always present or not, who issues it (any account's issuer, or a framework
  of its own with its `vct`) and optional W3C type and mdoc doctype — and each
  row opens to "Edit" (`/dashboard/credential-types/{id}/edit`, the same
  form, its key fixed; while something uses the type only its words,
  category, standard and new optional claims change) and "Delete" (refused
  while an issuer grants it, a form asks for it or an application was made
  for it). Issuers have a Credentials tab
  (`/dashboard/issuers/{id}/credentials`): the types they grant, ticked by any
  member (`PUT …/credential-types`); the public catalogue lists them.
- Applying for a credential is the catalog's (`../catalog`,
  `https://catalog.almena.id`): holders find offers, start, pair, fill in,
  sign and receive there. Old links here (`/credentials…`, `/apply/{id}`)
  redirect to it (`REGISTRY_CATALOG_URL`, `app/lib/catalog.ts`); an
  application started here before kept its secret on this origin and is
  started again there. Issuers' members read what arrives at
  `/dashboard/applications` (a card of its own, Activity, after the overview): the answers, the
  files (downloaded through a route handler with the session), the
  credentials presented, whether the holder's signature holds, and accept or
  reject. Accepted, the credential is issued from the same page: its claims,
  proposed from the application, are settled in `IssuanceForm` (each a
  catalogue field, `FieldInput` — the catalog's, without file uploads:
  credentials carry no files), then
  `/dashboard/applications/{id}/issue` has the issuer's signer's wallet sign it
  (`WalletRequest`, target `credential`); the holder takes it in the catalog
  with a third QR (`receive`), or from the wallet when the issuer's notice
  arrives. A credential names its entry in the issuer's
  status list, so that list is signed first: until it is, the issuance card
  says so and links to `/dashboard/issuers/{id}/sign-status?back=…` (target
  `status_list`; `back` only ever a dashboard path, `safeBack`). Issued, the
  page shows its status (valid, suspended, revoked) and the issuer's signer
  gets Suspend / Reinstate / Revoke, each on its own screen
  (`/dashboard/applications/{id}/status?to=…`, target `credential_status`):
  the change holds once the wallet signs the new list. Revoking is final;
  the list tags suspended and revoked ones, and the holder's application in
  the catalog says so too (`app/lib/status-lists.ts`).
- Texts a tenant writes for people to read in its forms and catalogue — a
  form's name and description, a field's help, a credential's purpose, its
  own fields' and options' labels — are by language (`{en, es}`, the portal's
  locales; `app/lib/texts.ts`) and written with `MultilingualInput`: the box
  in the visitor's language, with a globe inside it at its right edge that opens a
  line per other language (marked while another one has text). Shown, they
  read in the visitor's language, else English, else whichever there is
  (`label`).
- Mediators are registered, not discovered: the API fetches nothing from the
  address, it gives the mediator an identity of its own whose DID document
  publishes that address; the DID documents of the tenant, issuers and
  verifiers name the chosen mediator's DID. A mediator opens at
  `/dashboard/mediators/{id}`: its name, address and "Public" (any member
  edits them) and its DID, which never changes. A public mediator, once
  published, is offered to every tenant: the mediator selects (the tenant's,
  an issuer's, a verifier's) list `GET /tenants/{id}/mediator-choices` — the
  tenant's own, then other tenants' public ones, marked "(public)"; another
  tenant's mediator is shown by name and never linked. The root's (Almena's,
  `https://mediator.almena.id`) is public and every new tenant starts with it.
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
  fields), Credentials (`/{id}/credentials`, issuers: the types they grant), Signing (`/{id}/signing`, issuers and verifiers: the signing system
  — so far one specific member signs; admins set it, members read it), Status
  lists (`/{id}/status`, issuers: each list's address, entries taken, revoked
  and suspended, and whether it must be signed — never yet, or by a key the
  DID no longer lists; the issuer's signer signs it at `/{id}/sign-status`,
  outside the tabs) and JSON
  (`/{id}/json`, the DID document). `load.ts` asks the API
  for the item once per request; `Detail.tsx` holds the shared shapes. Issuers,
  verifiers and mediators are edited by any member; the operations are icons
  (`ResourceActions`): publish, for whoever signs as the tenant — which is
  endorsing it: its own screen (`/{id}/publish`), where the signer's wallet
  signs the tenant's membership credential and the item's `whois.vp` in one
  approval — and, for admins, unpublish and delete, which asks on its own screen (`/{id}/delete`). The
  Summary shows the endorsement (its `whois.vp`, until when). A draft's DID does not
  resolve and the API's public catalogue does not list it.
