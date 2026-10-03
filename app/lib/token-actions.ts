"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { api, sessionCookie } from "./api";
import type { ApiToken } from "./tokens";

export type TokenState = {
  name?: string;
  days?: string;
  /** The secret, right after it was made: shown this once. */
  secret?: string;
  made?: string;
  errors?: {
    name?: "nameRequired" | "nameLong";
    days?: "daysInvalid";
    form?: "unavailable" | "tooMany";
  };
};

/** Makes an API token; its secret comes back this once. */
export async function createToken(
  _: TokenState,
  form: FormData,
): Promise<TokenState> {
  const name = String(form.get("name") ?? "").trim();
  const days = String(form.get("days") ?? "90").trim();
  const keep = { name, days };
  const errors: TokenState["errors"] = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > 100) errors.name = "nameLong";
  const count = Number(days);
  if (!Number.isInteger(count) || count < 1 || count > 365)
    errors.days = "daysInvalid";
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return { ...keep, errors: { form: "unavailable" } };
  const { data, detail } = await api<ApiToken & { token: string }>(
    "/auth/me/tokens",
    {
      method: "POST",
      body: { name, expires_in_days: count },
      token,
    },
  );
  if (!data) {
    if (detail === "name_required")
      return { ...keep, errors: { name: "nameRequired" } };
    if (detail === "too_many_tokens")
      return { ...keep, errors: { form: "tooMany" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  revalidatePath("/dashboard/account");
  return { secret: data.token, made: data.name };
}

/** Revokes one of the account's tokens: whatever uses it stops at once. */
export async function revokeToken(id: string): Promise<void> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return;
  await api(`/auth/me/tokens/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
  revalidatePath("/dashboard/account");
}
