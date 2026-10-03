"use server";

import QRCode from "qrcode";
import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { VerifiedCredential } from "./verify-actions";

type VerificationOut = {
  id: string;
  status: "pending" | "answered" | "expired";
  expires_at: string;
  deep_link: string | null;
  result: { verified: boolean; credentials: VerifiedCredential[] } | null;
};

export type Opened =
  | { ok: true; id: string; deepLink: string; qr: string; expiresAt: string }
  | {
      ok: false;
      error: "unavailable" | "unpublished" | "nothingToPresent";
    };

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
) {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { data: null, detail: null };
  return api<T>(`/tenants/${tenant.id}/verifiers${path}`, { ...init, token });
}

/** Asks the API for a verifier's request for a form, drawn as a QR code. */
export async function openVerification(
  verifierId: string,
  formId: string,
): Promise<Opened> {
  const { data, detail } = await call<VerificationOut>(
    `/${encodeURIComponent(verifierId)}/verifications`,
    { method: "POST", body: { form_id: formId } },
  );
  if (!data?.deep_link)
    return {
      ok: false,
      error:
        detail === "verifier_unpublished"
          ? "unpublished"
          : detail === "nothing_to_present"
            ? "nothingToPresent"
            : "unavailable",
    };
  const qr = await QRCode.toString(data.deep_link, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return {
    ok: true,
    id: data.id,
    deepLink: data.deep_link,
    qr,
    expiresAt: data.expires_at,
  };
}

/** Where a verification stands; `null` when the API cannot be reached. */
export async function checkVerification(
  verifierId: string,
  id: string,
): Promise<Pick<VerificationOut, "status" | "result"> | null> {
  const { data } = await call<VerificationOut>(
    `/${encodeURIComponent(verifierId)}/verifications/${encodeURIComponent(id)}`,
  );
  return data ? { status: data.status, result: data.result } : null;
}
