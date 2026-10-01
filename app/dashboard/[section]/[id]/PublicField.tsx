"use client";

import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { useI18n } from "@/app/i18n/client";

/**
 * Whether a mediator is public: offered to every account once published. The
 * checkbox travels as `public` ("on" when checked), like a native one.
 */
export function PublicField({ defaultChecked }: { defaultChecked: boolean }) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="public"
          name="public"
          defaultChecked={defaultChecked}
          aria-describedby="public-hint"
        />
        <Label htmlFor="public">{copy.public}</Label>
      </div>
      <p className="text-[13px] text-faint" id="public-hint">
        {copy.publicHint}
      </p>
    </div>
  );
}
