"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { Dictionary } from "@/app/i18n/config";
import { api, sessionCookie, type User } from "./api";

type ErrorKey = keyof Dictionary["dashboard"]["account"]["errors"];

export type AccountState = {
  alias?: string;
  saved?: boolean;
  errors?: { alias?: ErrorKey; form?: ErrorKey };
};

export async function saveAccount(
  _: AccountState,
  form: FormData,
): Promise<AccountState> {
  const alias = String(form.get("alias") ?? "").trim();
  if (alias.length > 100) return { alias, errors: { alias: "aliasLong" } };

  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return { alias, errors: { form: "unavailable" } };
  const { data } = await api<User>("/auth/me", {
    method: "PATCH",
    body: { alias: alias || null },
    token,
  });
  if (!data) return { alias, errors: { form: "unavailable" } };
  // The header and every list that shows the account read it again.
  revalidatePath("/dashboard", "layout");
  return { alias: data.alias ?? "", saved: true };
}
