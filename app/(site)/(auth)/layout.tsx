import { redirect } from "next/navigation";

import { currentUser } from "@/app/lib/api";

/** Signing in again while signed in makes no sense: go to the dashboard. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/dashboard");
  return children;
}
