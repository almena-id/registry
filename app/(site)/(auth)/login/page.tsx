import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { AuthForm } from "../AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.auth.title };
}

export default function LoginPage() {
  return <AuthForm />;
}
