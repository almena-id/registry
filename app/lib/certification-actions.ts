"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenants, sessionCookie } from "./api";
import { logoMaxBytes, logoTypes } from "./certification-types";

type ErrorKey = keyof Dictionary["dashboard"]["certification"]["errors"];

/** What a step of the request left to say: an error, or nothing. */
export type StepState = { error?: ErrorKey; field?: "legalName" | "domain" };

const known: Record<string, ErrorKey> = {
  legal_name_required: "legalNameRequired",
  domain_invalid: "domainInvalid",
  domain_required: "domainRequired",
  dns_record_not_found: "dnsNotFound",
  dns_unavailable: "dnsUnavailable",
  logo_invalid: "logoInvalid",
  logo_too_large: "logoTooLarge",
  request_incomplete: "incomplete",
  in_review: "inReview",
  not_reviewer: "notReviewer",
  not_in_review: "decided",
};

function failed(status: number | null, detail: string | null): StepState {
  if (detail && known[detail]) {
    const error = known[detail];
    const field =
      error === "legalNameRequired"
        ? "legalName"
        : error === "domainInvalid"
          ? "domain"
          : undefined;
    return { error, field };
  }
  if (status === 403) return { error: "notAdmin" };
  return { error: "unavailable" };
}

async function tenantCall(
  path: string,
  init: Parameters<typeof api>[1],
): Promise<StepState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return { error: "unavailable" };
  const { status, data, detail } = await api(
    `/tenants/${tenant.id}/certification${path}`,
    { ...init, token },
  );
  if (!data) return failed(status, detail);
  // The page shows what the API now holds; the header shows the mark.
  revalidatePath("/dashboard", "layout");
  return {};
}

export async function saveRequest(
  _: StepState,
  form: FormData,
): Promise<StepState> {
  const legalName = String(form.get("legal_name") ?? "").trim();
  const domain = String(form.get("domain") ?? "").trim();
  if (!legalName) return { error: "legalNameRequired", field: "legalName" };
  if (legalName.length > 200)
    return { error: "legalNameLong", field: "legalName" };
  if (!domain) return { error: "domainRequired", field: "domain" };
  return tenantCall("/request", {
    method: "PUT",
    body: { legal_name: legalName, domain },
  });
}

export async function uploadLogo(
  _: StepState,
  form: FormData,
): Promise<StepState> {
  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0)
    return { error: "logoMissing" };
  if (!logoTypes.includes(file.type)) return { error: "logoInvalid" };
  if (file.size > logoMaxBytes) return { error: "logoTooLarge" };
  return tenantCall("/request/logo", {
    method: "PUT",
    raw: { data: await file.arrayBuffer(), type: file.type },
  });
}

export async function checkDomain(): Promise<StepState> {
  return tenantCall("/request/check-domain", { method: "POST" });
}

export async function submitRequest(): Promise<StepState> {
  return tenantCall("/request/submit", { method: "POST" });
}

/** A reviewer's decision; back to the queue once it is taken. */
export async function decide(
  id: string,
  _: StepState,
  form: FormData,
): Promise<StepState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return { error: "unavailable" };
  const approve = form.get("decision") === "approve";
  const reason = String(form.get("reason") ?? "").trim();
  if (!approve && !reason) return { error: "reasonRequired" };
  if (reason.length > 1000) return { error: "reasonLong" };
  const { status, data, detail } = await api(
    `/review/certifications/${encodeURIComponent(id)}/${approve ? "approve" : "reject"}`,
    { method: "POST", body: approve ? undefined : { reason }, token },
  );
  if (!data) return failed(status, detail);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/review");
}
