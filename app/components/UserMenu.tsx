"use client";

import Link from "next/link";

import { useI18n } from "@/app/i18n/client";
import { logout } from "@/app/lib/auth-actions";
import { LogOutIcon } from "./icons";
import { usePopover } from "./usePopover";

/**
 * The account menu in the header's corner: who is signed in — which opens the
 * account's own screen — and signing out.
 */
export function UserMenu({ email }: { email: string }) {
  const { t } = useI18n();
  const copy = t.header.account;
  const { open, setOpen, root, trigger } = usePopover();

  return (
    <div className="popover" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="avatar-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.label}
        title={email}
        onClick={() => setOpen(!open)}
      >
        <span className="avatar" aria-hidden="true">
          {email.slice(0, 1).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="popover__panel popover__panel--account" role="menu">
          <Link
            href="/dashboard/account"
            role="menuitem"
            className="user-menu__account"
            aria-label={copy.open}
            title={email}
            onClick={() => setOpen(false)}
          >
            <span className="popover__label">{copy.label}</span>
            <span className="user-menu__email">{email}</span>
          </Link>
          <div className="popover__separator" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="popover__item"
              autoFocus
            >
              <LogOutIcon />
              {copy.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
