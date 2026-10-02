"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { fetchPage } from "./directory";
import {
  hasDescription,
  isSection,
  type DescribedDetail,
  type MediatorDetail,
  type Page,
  type Signing,
} from "./directory-types";

/** The next page, for the list as it is scrolled. */
export async function loadMore(
  section: string,
  cursor: string,
): Promise<Page | null> {
  if (!isSection(section)) return null;
  return fetchPage(section, cursor);
}

type ErrorKey = keyof Dictionary["dashboard"]["items"]["errors"];

export type CreateState = {
  name?: string;
  description?: string;
  /** Mediators: where they listen, `https://{subdomain}.{domain}`, the
   * domain one of the tenant's verified ones (its id). */
  subdomain?: string;
  domain?: string;
  mediator?: string;
  /** Mediators: offered to every account once published. */
  public?: boolean;
  errors?: {
    name?: ErrorKey;
    description?: ErrorKey;
    subdomain?: ErrorKey;
    domain?: ErrorKey;
    mediator?: ErrorKey;
    form?: ErrorKey;
  };
};

/** What the API says about a mediator's address, per field. */
function urlError(detail: string | null): ErrorKey | undefined {
  if (detail === "mediator_invalid") return "urlInvalid";
  if (detail === "mediator_insecure") return "urlInsecure";
  return undefined;
}

export async function createItem(
  section: string,
  _: CreateState,
  form: FormData,
): Promise<CreateState> {
  if (!isSection(section)) return { errors: { form: "unavailable" } };
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const subdomain = String(form.get("subdomain") ?? "").trim();
  const domain = String(form.get("domain") ?? "");
  const mediator = String(form.get("mediator") ?? "");
  const isPublic = form.get("public") === "on";
  const keep = {
    name,
    description,
    subdomain,
    domain,
    mediator,
    public: isPublic,
  };
  const errors: CreateState["errors"] = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > 200) errors.name = "nameLong";
  if (description.length > 2000) errors.description = "descriptionLong";
  if (section === "mediators") {
    if (!subdomain) errors.subdomain = "subdomainRequired";
    if (!domain) errors.domain = "domainRequired";
  }
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  // Issuers, verifiers and mediators get an identity of their own, which the
  // API creates with the same name.
  const body = hasDescription(section)
    ? { name, description: description || null, mediator_id: mediator || null }
    : section === "mediators"
      ? { name, subdomain, domain_id: domain, public: isPublic }
      : { name };
  const { data, detail } = await api(`/tenants/${tenant.id}/${section}`, {
    method: "POST",
    body,
    token,
  });
  if (!data) {
    if (detail === "subdomain_invalid")
      return { ...keep, errors: { subdomain: "subdomainInvalid" } };
    if (detail === "domain_not_found")
      return { ...keep, errors: { domain: "domainNotFound" } };
    if (detail === "domain_unverified")
      return { ...keep, errors: { domain: "domainUnverified" } };
    if (detail === "mediator_not_found")
      return { ...keep, errors: { mediator: "mediatorNotFound" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  redirect(`/dashboard/${section}`);
}

export type MediatorState = {
  name?: string;
  url?: string;
  public?: boolean;
  saved?: boolean;
  errors?: { name?: ErrorKey; url?: ErrorKey; form?: ErrorKey };
};

/** A mediator's name, address and whether it is public; its DID stays. */
export async function saveMediator(
  id: string,
  _: MediatorState,
  form: FormData,
): Promise<MediatorState> {
  const name = String(form.get("name") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const isPublic = form.get("public") === "on";
  const keep = { name, url, public: isPublic };
  const errors: MediatorState["errors"] = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > 200) errors.name = "nameLong";
  if (!url) errors.url = "urlRequired";
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { data, detail } = await api<MediatorDetail>(
    `/tenants/${tenant.id}/mediators/${encodeURIComponent(id)}`,
    { method: "PATCH", body: { name, url, public: isPublic }, token },
  );
  if (!data) {
    const url = urlError(detail);
    if (url) return { ...keep, errors: { url } };
    if (detail === "name_required")
      return { ...keep, errors: { name: "nameRequired" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  revalidatePath(`/dashboard/mediators/${id}`);
  return { name: data.name, url: data.url, public: data.public, saved: true };
}

export type DescribedState = {
  name?: string;
  description?: string;
  mediator?: string;
  saved?: boolean;
  errors?: {
    name?: ErrorKey;
    description?: ErrorKey;
    mediator?: ErrorKey;
    form?: ErrorKey;
  };
};

/** An issuer's or verifier's name, description and mediator; its DID stays. */
export async function saveDescribed(
  section: "issuers" | "verifiers",
  id: string,
  _: DescribedState,
  form: FormData,
): Promise<DescribedState> {
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const mediator = String(form.get("mediator") ?? "");
  const keep = { name, description, mediator };
  const errors: DescribedState["errors"] = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > 200) errors.name = "nameLong";
  if (description.length > 2000) errors.description = "descriptionLong";
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { data, detail } = await api<DescribedDetail>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: {
        name,
        description: description || null,
        mediator_id: mediator || null,
      },
      token,
    },
  );
  if (!data) {
    if (detail === "name_required")
      return { ...keep, errors: { name: "nameRequired" } };
    if (detail === "mediator_not_found")
      return { ...keep, errors: { mediator: "mediatorNotFound" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  revalidatePath(`/dashboard/${section}/${id}`);
  return {
    name: data.name,
    description: data.description ?? "",
    mediator: data.mediator?.id ?? "",
    saved: true,
  };
}

/** `pendingIdentity`: refused because its identity is not signed yet. */
export type PublicationState = {
  published: boolean;
  failed?: boolean;
  pendingIdentity?: boolean;
};

/**
 * Take one back (its DID stops resolving, the catalogue drops it, its
 * `whois.vp` goes). Publishing is endorsing, signed from a wallet: see the
 * publish screen.
 */
export async function setPublished(
  section: "issuers" | "verifiers" | "mediators",
  id: string,
  state: PublicationState,
): Promise<PublicationState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...state, failed: true };
  const verb = state.published ? "unpublish" : "publish";
  const { data, detail } = await api<DescribedDetail>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/${verb}`,
    { method: "POST", token },
  );
  if (detail === "identity_pending")
    return { ...state, pendingIdentity: true };
  if (!data) return { ...state, failed: true };
  revalidatePath(`/dashboard/${section}/${id}`);
  return { published: data.published_at !== null };
}

/** Delete one, and its identity with it; back to its list. */
export async function deleteItem(
  section: "issuers" | "verifiers" | "mediators",
  id: string,
  _: PublicationState,
): Promise<PublicationState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ..._, failed: true };
  const { status } = await api(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}`,
    { method: "DELETE", token },
  );
  if (status !== 204) return { ..._, failed: true };
  revalidatePath(`/dashboard/${section}`);
  redirect(`/dashboard/${section}`);
}

export type SigningState = {
  system: string;
  signer: string;
  saved?: boolean;
  errors?: {
    signer?: "signerRequired" | "signerNotMember";
    form?: "unavailable";
  };
};

/** Set how an issuer or verifier signs; admins only (the API says so too). */
export async function saveSigning(
  section: "issuers" | "verifiers",
  id: string,
  _: SigningState,
  form: FormData,
): Promise<SigningState> {
  const system = String(form.get("system") ?? "");
  const signer = String(form.get("signer") ?? "");
  const keep = { system, signer };
  if (system === "single_user" && !signer)
    return { ...keep, errors: { signer: "signerRequired" } };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const body =
    system === "single_user"
      ? { system, user_id: signer }
      : { system: null, user_id: null };
  const { data, detail } = await api<Signing>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/signing`,
    { method: "PUT", body, token },
  );
  if (!data) {
    if (detail === "signer_required" || detail === "signer_not_member")
      return {
        ...keep,
        errors: {
          signer:
            detail === "signer_required" ? "signerRequired" : "signerNotMember",
        },
      };
    return { ...keep, errors: { form: "unavailable" } };
  }
  revalidatePath(`/dashboard/${section}/${id}/signing`);
  return {
    system: data.system ?? "",
    signer: data.signer?.id ?? "",
    saved: true,
  };
}
