"use client";

import { LogOutIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useI18n } from "@/app/i18n/client";
import { logout } from "@/app/lib/auth-actions";

/**
 * The account menu in the header's corner: who is signed in — which opens the
 * account's own screen — and signing out.
 */
export function UserMenu({ account }: { account: string }) {
  const { t } = useI18n();
  const copy = t.header.account;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full p-0.5 transition-shadow outline-none hover:ring-3 hover:ring-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:ring-3 data-[state=open]:ring-accent"
        aria-label={copy.label}
        title={account}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-brand-soft font-bold text-primary">
            {account.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/account"
            className="flex flex-col items-start gap-0"
            aria-label={copy.open}
            title={account}
          >
            <span className="text-xs font-semibold text-muted-foreground">{copy.label}</span>
            <span className="w-full truncate">{account}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOutIcon />
              {copy.signOut}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
