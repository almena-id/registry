"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { getLocale } from "@/app/i18n/server";
import { api, currentTenant, sessionCookie } from "./api";

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
