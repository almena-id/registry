"use client";

import { useState, useTransition } from "react";

import { EllipsisIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useI18n } from "@/app/i18n/client";
import {
  changeRole,
  leave,
  removeMember,
  withdrawInvitation,
  type ManageResult,
} from "@/app/lib/member-actions";
import type { Member } from "@/app/lib/members";

type Asked = "remove" | "leave" | "withdraw";

/**
 * What can be done about one person in the list: an admin changes a member's
 * role, removes them or takes an invitation back; anyone leaves. What cannot
 * be undone is asked about in the row first; the API decides, and a refusal
 * (the last admin, somebody who signs) is said in the row.
 */
export function MemberActions({
  member,
  name,
  isAdmin,
  isMe,
}: {
  member: Member;
  name: string;
  isAdmin: boolean;
  isMe: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.users.manage;
  const [asked, setAsked] = useState<Asked | null>(null);
  const [error, setError] = useState<ManageResult["error"]>();
  const [pending, start] = useTransition();

  const run = (action: () => Promise<ManageResult>) =>
    start(async () => {
      const result = await action();
      setError(result.error);
      setAsked(null);
    });

  const userId = member.user_id;
  const invitationId = member.invitation_id;
  const entries: { key: string; label: string; onSelect: () => void }[] = [];
  if (member.status === "member" && userId) {
    if (isAdmin && !isMe)
      entries.push({
        key: "role",
        label: member.role === "admin" ? copy.makeMember : copy.makeAdmin,
        onSelect: () =>
          run(() =>
            changeRole(userId, member.role === "admin" ? "member" : "admin"),
          ),
      });
    if (isAdmin && isMe && member.role === "admin")
      entries.push({
        key: "role",
        label: copy.makeMember,
        onSelect: () => run(() => changeRole(userId, "member")),
      });
    if (isAdmin && !isMe)
      entries.push({
        key: "remove",
        label: copy.remove,
        onSelect: () => setAsked("remove"),
      });
    if (isMe)
      entries.push({
        key: "leave",
        label: copy.leave,
        onSelect: () => setAsked("leave"),
      });
  }
  if (member.status === "invited" && invitationId && isAdmin)
    entries.push({
      key: "withdraw",
      label: copy.withdraw,
      onSelect: () => setAsked("withdraw"),
    });

  if (entries.length === 0) return <span className="w-8 flex-none" />;
  const roles = entries.filter((entry) => entry.key === "role");
  const others = entries.filter((entry) => entry.key !== "role");

  const confirm = () => {
    if (asked === "remove" && userId) run(() => removeMember(userId));
    if (asked === "leave" && userId) run(() => leave(userId));
    if (asked === "withdraw" && invitationId)
      run(() => withdrawInvitation(invitationId));
  };
  const question =
    asked === "remove"
      ? copy.removeAsk.replace("{name}", name)
      : asked === "withdraw"
        ? copy.withdrawAsk.replace("{name}", name)
        : copy.leaveAsk;

  return (
    <span className="flex flex-none flex-col items-end gap-1">
      {asked ? (
        <span className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {question}
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={confirm}
          >
            {copy.confirm}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAsked(null)}
          >
            {copy.keep}
          </Button>
        </span>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label={copy.actions.replace("{name}", name)}
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {roles.map((entry) => (
              <DropdownMenuItem key={entry.key} onSelect={entry.onSelect}>
                {entry.label}
              </DropdownMenuItem>
            ))}
            {roles.length > 0 && others.length > 0 && <DropdownMenuSeparator />}
            {others.map((entry) => (
              <DropdownMenuItem
                key={entry.key}
                variant="destructive"
                onSelect={entry.onSelect}
              >
                {entry.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {error && (
        <span
          role="alert"
          className="max-w-72 text-right text-[13px] text-destructive"
        >
          {copy.errors[error]}
        </span>
      )}
    </span>
  );
}
