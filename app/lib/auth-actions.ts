"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { getLocale } from "@/app/i18n/server";
import { api, sessionCookie, type SignedIn } from "./api";

type ErrorKey = keyof Dictionary["auth"]["errors"];

/**
 * One flow for signing up and signing in: `email` asks the API to mail a
 * code, `code` exchanges it for a session (the account is created the first
 * time). `resent` says a new code has just gone out.
 */
export type AuthState = {
  step: "email" | "code";
  email?: string;
  resent?: boolean;
  errors?: { email?: ErrorKey; code?: ErrorKey; form?: ErrorKey };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function apiError(status: number | null, detail: string | null): AuthState["errors"] {
  if (detail === "invalid_code") return { code: "invalidCode" };
  if (detail === "too_many_attempts") return { code: "tooManyAttempts" };
  if (detail === "mail_unavailable") return { form: "mailUnavailable" };
  // The API's email check is stricter than the pattern here (reserved domains).
  if (status === 422) return { email: "emailInvalid" };
  return { form: "unavailable" };
}

export async function authenticate(state: AuthState, form: FormData): Promise<AuthState> {
  const intent = String(form.get("intent") ?? "");
  const email = String(form.get("email") ?? state.email ?? "").trim();

  if (intent === "change") return { step: "email", email };

  if (intent === "send" || intent === "resend") {
    if (!emailPattern.test(email)) return { step: "email", email, errors: { email: "emailInvalid" } };
    const { status, detail } = await api("/auth/code", {
      method: "POST",
      body: { email, locale: await getLocale() },
    });
    if (status !== 202) {
      const errors = apiError(status, detail);
      return { step: errors?.email ? "email" : state.step, email, errors };
    }
    return { step: "code", email, resent: intent === "resend" };
  }

  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { step: "code", email, errors: { code: "codeFormat" } };
  const { status, data, detail } = await api<SignedIn>("/auth/verify", {
    method: "POST",
    body: { email, code },
  });
  if (!data) return { step: "code", email, errors: apiError(status, detail) };

  (await cookies()).set(sessionCookie, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(data.expires_at),
  });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;
  if (token) await api("/auth/logout", { method: "POST", token });
  store.delete(sessionCookie);
  redirect("/");
}
