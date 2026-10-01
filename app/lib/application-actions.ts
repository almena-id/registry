"use server";

import QRCode from "qrcode";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, currentTenant, sessionCookie } from "./api";
import {
  applicationCookie,
  applicationSecret,
  type FileMeta,
  type WalletState,
} from "./applications";

const DAY = 24 * 60 * 60 * 1000;

/** Start applying for an offer; this browser keeps the secret for a day. */
export async function startApplication(
  issuer: string,
  type: string,
): Promise<{ error: "unavailable" }> {
  const { data } = await api<{ id: string; secret: string }>("/applications", {
    method: "POST",
    body: { issuer, type },
  });
  if (!data) return { error: "unavailable" };
  (await cookies()).set(applicationCookie(data.id), data.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + DAY),
  });
  redirect(`/apply/${data.id}`);
}

async function holderCall<T>(
  id: string,
  path: string,
  init: { method: string; body?: unknown; form?: FormData },
) {
  const secret = await applicationSecret(id);
  if (!secret)
    return { status: null, data: null, detail: "gone", failure: undefined };
  return api<T>(`/applications/${encodeURIComponent(id)}${path}`, {
    ...init,
    headers: { "X-Application-Secret": secret },
  });
}

export type WalletAsk =
  | { ok: true; deepLink: string; qr: string; expiresAt: string }
  | { ok: false; error: string };

/** A new wallet request for the application: its QR code and deep link. */
export async function askWallet(
  id: string,
  purpose: "pair" | "present" | "submit" | "receive",
): Promise<WalletAsk> {
  const { data, detail } = await holderCall<WalletState>(id, "/wallet", {
    method: "POST",
    body: { purpose },
  });
  if (!data?.deep_link || !data.expires_at)
    return { ok: false, error: detail ?? "unavailable" };
  const qr = await QRCode.toString(data.deep_link, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return { ok: true, deepLink: data.deep_link, qr, expiresAt: data.expires_at };
}

/** Whether the wallet has answered the request in course. */
export async function pollApplicationWallet(
  id: string,
): Promise<"answered" | "waiting" | "expired"> {
  const { data } = await holderCall<WalletState>(id, "/wallet", {
    method: "GET",
  });
  if (!data) return "expired";
  if (data.answered) return "answered";
  return data.live ? "waiting" : "expired";
}

export type AnswersResult =
  { ok: true } | { ok: false; errors: Record<string, string>; error?: string };

/** Save the typed answers; each field that does not hold says why. */
export async function saveApplicationAnswers(
  id: string,
  answers: Record<string, unknown>,
): Promise<AnswersResult> {
  const { status, detail, failure } = await holderCall(id, "/answers", {
    method: "PUT",
    body: { answers },
  });
  if (status !== null && status < 300) return { ok: true };
  const errors =
    failure && typeof failure === "object" && "errors" in failure
      ? ((failure as { errors: Record<string, string> }).errors ?? {})
      : {};
  return {
    ok: false,
    errors,
    error: detail ?? (status ? undefined : "unavailable"),
  };
}

export type UploadResult =
  { ok: true; file: FileMeta } | { ok: false; error: string };

/** Upload a file for one of the form's file fields. */
export async function uploadApplicationFile(
  id: string,
  form: FormData,
): Promise<UploadResult> {
  const { data, detail, status } = await holderCall<FileMeta>(id, "/files", {
    method: "POST",
    form,
  });
  if (data) return { ok: true, file: data };
  return {
    ok: false,
    error: detail ?? (status === 413 ? "file_too_large" : "unavailable"),
  };
}

export async function removeApplicationFile(id: string, key: string) {
  await holderCall(id, `/files/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

export type DecisionState = { error?: "already_decided" | "unavailable" };

/** The issuer's members: accept or reject a received application. */
export async function decideApplication(
  id: string,
  _: DecisionState,
  form: FormData,
): Promise<DecisionState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable" };
  const { status, detail } = await api(
    `/tenants/${tenant.id}/applications/${encodeURIComponent(id)}/decision`,
    {
      method: "POST",
      token,
      body: {
        decision: String(form.get("decision")),
        note: String(form.get("note") ?? "").trim() || null,
      },
    },
  );
  if (status === null || status >= 300)
    return {
      error: detail === "already_decided" ? "already_decided" : "unavailable",
    };
  revalidatePath("/dashboard/applications", "layout");
  return {};
}

export type IssuanceResult =
  { ok: true } | { ok: false; errors: Record<string, string>; error?: string };

/**
 * Settle an accepted application's credential — its claims and until when —
 * then go to sign it.
 */
export async function saveIssuance(
  id: string,
  claims: Record<string, unknown>,
  validUntil: string,
): Promise<IssuanceResult> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ok: false, errors: {}, error: "unavailable" };
  const { status, detail, failure } = await api(
    `/tenants/${tenant.id}/applications/${encodeURIComponent(id)}/issuance`,
    { method: "PUT", token, body: { claims, valid_until: validUntil } },
  );
  if (status === null || status >= 300) {
    const errors =
      failure && typeof failure === "object" && "errors" in failure
        ? ((failure as { errors: Record<string, string> }).errors ?? {})
        : {};
    return {
      ok: false,
      errors,
      error:
        detail ??
        (Object.keys(errors).length ? "claims_invalid" : "unavailable"),
    };
  }
  redirect(`/dashboard/applications/${encodeURIComponent(id)}/issue`);
}
