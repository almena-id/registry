"use client";

import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";

/**
 * Whether a mediator is public: offered to every account once published. The
 * checkbox travels as `public` ("on" when checked), like a native one.
 */
export function PublicField({ defaultChecked }: { defaultChecked: boolean }) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  return (
    <Field orientation="horizontal" className="gap-2.5">
      <Checkbox
        id="public"
        name="public"
        defaultChecked={defaultChecked}
        aria-describedby="public-hint"
      />
      <FieldContent>
        <FieldLabel htmlFor="public">{copy.public}</FieldLabel>
        <FieldDescription className="text-[13px] text-faint" id="public-hint">
          {copy.publicHint}
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
