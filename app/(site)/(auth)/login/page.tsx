import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { socialProviders } from "@/app/lib/api";
import { socialError } from "@/app/lib/auth-errors";
import { AuthForm } from "../AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.auth.title };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <AuthForm
      providers={await socialProviders()}
      initialError={socialError(typeof error === "string" ? error : undefined)}
    />
  );
}
