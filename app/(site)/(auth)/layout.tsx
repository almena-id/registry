import { redirect } from "next/navigation";

import { currentUser } from "@/app/lib/api";

/**
 * Signing in again while signed in makes no sense: go to the dashboard. The
 * sign-in card sits on the brand's dot grid, faded out around it.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await currentUser()) redirect("/dashboard");
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <div
        className="brand-pattern absolute top-1/2 left-1/2 -z-10 aspect-square w-[min(170%,920px)] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      />
      {children}
    </div>
  );
}
