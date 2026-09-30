"use client";

import {
  ArrowRightIcon,
  GlobeIcon,
  SignatureIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { useI18n } from "@/app/i18n/client";
import type { SigningFlow } from "@/app/lib/signing-flows";
import { cn } from "@/app/lib/utils";

/**
 * Each flow's drawing: the account's people, then the signature, then what is
 * published. Orange has one job here — who can sign. `any_admin` lights every
 * admin (any one of them will do); `single_user` lights one person among the
 * members and leaves the rest dim.
 */
const PEOPLE: Record<SigningFlow, boolean[]> = {
  any_admin: [true, true, true],
  single_user: [false, true, false],
};

/**
 * The drawing grows with the room its column gives it (container queries, not
 * the screen): the column is narrow beside the form at laptop widths and wide
 * on a large monitor. One size ladder for every node, icon and word.
 */
const NODE = "size-11 @sm:size-14 @lg:size-18 @2xl:size-22";
const ICON = "size-5 @sm:size-6 @lg:size-8 @2xl:size-10";
const WORD = "text-[12px] @lg:text-sm @2xl:text-base";

function Node({ icon: Icon, lit }: { icon: LucideIcon; lit?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid flex-none place-items-center rounded-full border @lg:border-2",
        NODE,
        lit
          ? "border-primary bg-brand-soft text-primary"
          : "bg-sunk text-faint",
      )}
    >
      <Icon className={ICON} />
    </span>
  );
}

function Arrow() {
  return (
    <ArrowRightIcon
      aria-hidden
      className="size-4 flex-none text-faint @lg:size-6 @2xl:size-8"
    />
  );
}

/**
 * People, signature, publication: the nodes on one row and their words on the
 * next, in a grid, so the arrows sit level with the nodes whatever the words'
 * size.
 */
function Drawing({ flow, people }: { flow: SigningFlow; people: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant.signing;
  const word = cn("text-center text-faint", WORD);
  return (
    // The container is the wrapper: an element cannot query its own width.
    <div className="@container">
      <div className="rounded-xl bg-sunk/60 px-4 py-6 @lg:py-10 @2xl:py-14">
        <div className="mx-auto grid w-fit grid-cols-[repeat(5,auto)] items-center justify-items-center gap-x-3 gap-y-2 @lg:gap-x-8 @lg:gap-y-3 @2xl:gap-x-12">
          <div className="flex -space-x-2.5 @lg:-space-x-4 @2xl:-space-x-5">
            {PEOPLE[flow].map((lit, index) => (
              <Node key={index} icon={UserIcon} lit={lit} />
            ))}
          </div>
          <Arrow />
          <Node icon={SignatureIcon} lit />
          <Arrow />
          <Node icon={GlobeIcon} />
          <span className={word}>{people}</span>
          <span />
          <span className={word}>{copy.signs}</span>
          <span />
          <span className={word}>{copy.published}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The flow chosen in the form, explained: who signs, drawn; then what it
 * gains and what it costs, a line each. It follows the select as it changes,
 * saved or not; "In force" marks the flow the account has now.
 */
export function FlowExplained({
  flow,
  saved,
}: {
  flow: SigningFlow;
  /** The flow in force, told apart from one picked and not saved yet. */
  saved: SigningFlow;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant;
  const text = copy.signingFlows[flow];
  return (
    <div className="grid gap-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{text.label}</span>
        {flow === saved && (
          <Badge variant="muted">{copy.signing.inForce}</Badge>
        )}
      </div>
      <Drawing flow={flow} people={text.people} />
      <p className="text-sm text-muted-foreground">{text.hint}</p>
      <div className="grid gap-1.5 text-sm">
        <p className="flex gap-2">
          <span aria-hidden className="text-primary">
            +
          </span>
          <span>{text.gains}</span>
        </p>
        <p className="flex gap-2">
          <span aria-hidden className="text-faint">
            −
          </span>
          <span className="text-muted-foreground">{text.costs}</span>
        </p>
      </div>
    </div>
  );
}
