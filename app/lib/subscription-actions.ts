"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";

type ErrorKey = keyof Dictionary["dashboard"]["accounts"]["errors"];

export type SubscriptionState = {
  status?: string;
  plan?: string;
  until?: string;
  note?: string;
  error?: ErrorKey;
  saved?: boolean;
};

const CODES: Record<string, ErrorKey> = {
  plan_invalid: "planInvalid",
  period_end_invalid: "untilPast",
  account_not_found: "notFound",
  anchor_only: "notAllowed",
  not_admin: "notAllowed",
};

/**
 * The trust anchor's admins set an account's subscription — or, with no
 * status, remove it (back to the free use). `until` is a day: paid through
 * the end of it, in UTC.
 */
export async function saveSubscription(
  accountId: string,
  _: SubscriptionState,
  form: FormData,
): Promise<SubscriptionState> {
  const read = (name: string) => String(form.get(name) ?? "").trim();
  const keep: SubscriptionState = {
    status: read("status"),
    plan: read("plan") || "standard",
    until: read("until"),
    note: read("note"),
  };
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant?.anchor) return { ...keep, error: "notAllowed" };
  if (keep.until && !/^\d{4}-\d{2}-\d{2}$/.test(keep.until))
    return { ...keep, error: "untilInvalid" };
  const path = `/tenants/${tenant.id}/accounts/${encodeURIComponent(accountId)}/subscription`;
  const { status, detail } = keep.status
    ? await api(path, {
        method: "PUT",
        token,
        body: {
          plan: keep.plan,
          status: keep.status,
          current_period_end: keep.until ? `${keep.until}T23:59:59Z` : null,
          note: keep.note || null,
        },
      })
    : await api(path, { method: "DELETE", token });
  if (status === null || status >= 300)
    return { ...keep, error: (detail && CODES[detail]) || "unavailable" };
  revalidatePath("/dashboard", "layout");
  return { ...keep, saved: true };
}
