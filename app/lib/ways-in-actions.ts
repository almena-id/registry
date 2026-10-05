"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Dictionary } from "@/app/i18n/config";
import { getLocale } from "@/app/i18n/server";
import {
  api,
  sessionCookie,
  tenantCookie,
  type LinkResult,
  type SignedIn,
} from "./api";
import { keepMove, keepSession, moveCookie, noMove } from "./session";

type ErrorKey = keyof Dictionary["dashboard"]["account"]["errors"];

/** Linking an email: `email` asks for a code, `code` proves it. */
export type EmailLinkState = {
  step: "email" | "code";
  email?: string;
  resent?: boolean;
  errors?: { email?: ErrorKey; code?: ErrorKey; form?: ErrorKey };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function token(): Promise<string | undefined> {
  return (await cookies()).get(sessionCookie)?.value;
}

function codeError(
  status: number | null,
  detail: string | null,
): EmailLinkState["errors"] {
  if (detail === "invalid_code") return { code: "invalidCode" };
  if (detail === "too_many_attempts") return { code: "tooManyAttempts" };
  if (detail === "mail_unavailable") return { form: "mailUnavailable" };
  if (status === 422) return { email: "emailInvalid" };
  return { form: "unavailable" };
}

export async function linkEmail(
  state: EmailLinkState,
  form: FormData,
): Promise<EmailLinkState> {
  const intent = String(form.get("intent") ?? "");
  const email = String(form.get("email") ?? state.email ?? "").trim();
  if (intent === "change") return { step: "email", email };

  if (intent === "send" || intent === "resend") {
    if (!emailPattern.test(email))
      return { step: "email", email, errors: { email: "emailInvalid" } };
    const { status, detail } = await api("/auth/code", {
      method: "POST",
      body: { email, locale: await getLocale() },
    });
    if (status !== 202) {
      const errors = codeError(status, detail);
      return { step: errors?.email ? "email" : state.step, email, errors };
    }
    return { step: "code", email, resent: intent === "resend" };
  }

  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code))
    return { step: "code", email, errors: { code: "codeFormat" } };
  const { status, data, detail } = await api<LinkResult>("/auth/me/email", {
    method: "POST",
    body: { email, code },
    token: await token(),
  });
  if (!data) return { step: "code", email, errors: codeError(status, detail) };
  if (data.status === "taken") {
    await keepMove(data.move_ticket);
    redirect("/dashboard/account/taken");
  }
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/account?linked=1");
}

/** Unlink the email (`id` empty) or a provider account. */
export async function unlink(id: string): Promise<void> {
  const { status, detail } = await api(
    id ? `/auth/me/accounts/${id}` : "/auth/me/email",
    { method: "DELETE", token: await token() },
  );
  if (status !== 204)
    redirect(`/dashboard/account?error=${detail ?? "unavailable"}`);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/account");
}

/** Leave this empty account for the owner of the way in, and continue there. */
export async function moveAccount(): Promise<void> {
  const store = await cookies();
  const ticket = store.get(moveCookie)?.value;
  if (!ticket || ticket === noMove) redirect("/dashboard/account");
  const { data, detail } = await api<SignedIn>("/auth/me/move", {
    method: "POST",
    body: { ticket },
    token: await token(),
  });
  store.delete(moveCookie);
  if (!data) redirect(`/dashboard/account?error=${detail ?? "unavailable"}`);
  await keepSession(data);
  // The tenant chosen belonged to the account that is gone.
  store.delete(tenantCookie);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/account?moved=1");
}
