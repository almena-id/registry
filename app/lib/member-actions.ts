"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { getLocale } from "@/app/i18n/server";
import { api, currentTenant, sessionCookie, tenantCookie } from "./api";

type ErrorKey = keyof Dictionary["dashboard"]["users"]["errors"];

export type InviteState = {
  email?: string;
  role?: string;
  errors?: { email?: ErrorKey; form?: ErrorKey };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function invite(
  _: InviteState,
  form: FormData,
): Promise<InviteState> {
  const email = String(form.get("email") ?? "").trim();
  const role = form.get("role") === "admin" ? "admin" : "member";
  if (!emailPattern.test(email))
    return { email, role, errors: { email: "emailInvalid" } };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant)
    return { email, role, errors: { form: "unavailable" } };
  const { status, detail } = await api(`/tenants/${tenant.id}/invitations`, {
    method: "POST",
    body: { email, role, locale: await getLocale() },
    token,
  });
  if (status !== 201) {
    const errors: InviteState["errors"] =
      detail === "already_member"
        ? { email: "alreadyMember" }
        : detail === "not_admin"
          ? { form: "notAdmin" }
          : detail === "mail_unavailable"
            ? { form: "mailUnavailable" }
            : status === 422
              ? { email: "emailInvalid" }
              : { form: "unavailable" };
    return { email, role, errors };
  }
  redirect("/dashboard/users");
}

type ManageKey = keyof Dictionary["dashboard"]["users"]["manage"]["errors"];

/** What came of managing somebody: nothing, or why not. */
export type ManageResult = { error?: ManageKey };

function manageError(status: number | null, detail: string | null): ManageKey {
  if (detail === "last_admin") return "lastAdmin";
  if (detail === "member_signs") return "memberSigns";
  if (detail === "not_admin") return "notAdmin";
  if (status === 404) return "gone";
  return "unavailable";
}

async function manage(
  path: string,
  init: { method: string; body?: unknown },
  ok: number,
): Promise<ManageResult> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable" };
  const { status, detail } = await api(`/tenants/${tenant.id}${path}`, {
    ...init,
    token,
  });
  if (status !== ok) return { error: manageError(status, detail) };
  revalidatePath("/dashboard/users");
  return {};
}

/** An admin makes a member an admin, or a member again. */
export async function changeRole(
  userId: string,
  role: "admin" | "member",
): Promise<ManageResult> {
  return manage(
    `/members/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: { role } },
    200,
  );
}

/** An admin removes a member. */
export async function removeMember(userId: string): Promise<ManageResult> {
  return manage(
    `/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
    204,
  );
}

/** An admin takes an invitation back before it is accepted. */
export async function withdrawInvitation(
  invitationId: string,
): Promise<ManageResult> {
  return manage(
    `/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
    204,
  );
}

/** The signed-in user leaves the current tenant, and works in another. */
export async function leave(userId: string): Promise<ManageResult> {
  const result = await manage(
    `/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
    204,
  );
  if (result.error) return result;
  // The tenant chosen is no longer theirs: the oldest left is taken.
  (await cookies()).delete(tenantCookie);
  redirect("/dashboard");
}
