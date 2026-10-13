"use client";

import { GlobeIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { localeNames, locales, type Locale } from "@/app/i18n/config";
import { onlyIn, type Texts } from "@/app/lib/texts";
import { useTenantLanguages } from "./TenantLanguages";
import { cn } from "cn";

/**
 * A text written in each language the account works in (`TenantLanguages`):
 * the box shows the visitor's, or the account's first when it does not work
 * in it; the globe, after it and outside it, opens a line per other language,
 * each with its own box, and there is none with only one. Text kept in a
 * language the account no longer works in is shown there, read only: it goes
 * when this is saved. The globe is marked while another language has text.
 * With `name`, the texts travel as JSON in a hidden input, in the account's
 * languages only.
 */
export function MultilingualInput({
  id,
  name,
  value,
  onChange,
  multiline = false,
  rows = 3,
  maxLength,
  placeholder,
  autoFocus,
  invalid,
  describedBy,
  label,
}: {
  id: string;
  name?: string;
  value: Texts;
  onChange: (value: Texts) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Its name for assistive technology, where no label points at it (a row of a list). */
  label?: string;
}) {
  const { t, locale } = useI18n();
  const copy = t.texts;
  const [open, setOpen] = useState(false);
  const panel = useId();
  const enabled = useTenantLanguages();
  const first = enabled.includes(locale) ? locale : enabled[0];
  const others = enabled.filter((lang) => lang !== first);
  // Kept from before the account stopped working in them.
  const stale = locales.filter(
    (lang) => !enabled.includes(lang) && value[lang]?.trim(),
  );
  const elsewhere =
    others.some((lang) => value[lang]?.trim()) || stale.length > 0;

  const globe = others.length > 0 || stale.length > 0;
  const box = (
    lang: Locale,
    boxId: string,
    main: boolean,
    readOnly = false,
  ) => {
    const common = {
      // The main one holds the globe inside, at its right edge.
      className: main && globe ? "pr-10" : undefined,
      id: boxId,
      value: value[lang] ?? "",
      maxLength,
      lang,
      readOnly,
      placeholder: main ? placeholder : undefined,
      autoFocus: main ? autoFocus : undefined,
      "aria-invalid": invalid ? true : undefined,
      "aria-describedby": main ? describedBy : undefined,
      "aria-label": main ? label : undefined,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => onChange({ ...value, [lang]: event.target.value }),
    };
    return multiline ? (
      <Textarea rows={rows} {...common} />
    ) : (
      <Input {...common} />
    );
  };

  return (
    <div className="grid gap-2">
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(onlyIn(value, enabled))}
        />
      )}
      <div className="relative">
        {box(first, id, true)}
        {globe && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "absolute right-1",
              multiline ? "top-1" : "top-1/2 -translate-y-1/2",
              elsewhere && "text-primary",
            )}
            aria-expanded={open}
            aria-controls={panel}
            aria-label={copy.otherLanguages}
            title={copy.otherLanguages}
            onClick={() => setOpen((shown) => !shown)}
          >
            <GlobeIcon />
          </Button>
        )}
      </div>
      {open && (
        <div
          id={panel}
          className="grid gap-2 rounded-lg border border-dashed p-2.5"
        >
          {others.map((lang) => (
            <div
              key={lang}
              className={cn(
                "grid gap-1.5 sm:grid-cols-[110px_1fr]",
                multiline ? "sm:items-start" : "sm:items-center",
              )}
            >
              <FieldLabel
                htmlFor={`${id}-${lang}`}
                className="text-[13px] font-normal text-muted-foreground"
              >
                {localeNames[lang]}
              </FieldLabel>
              {box(lang, `${id}-${lang}`, false)}
            </div>
          ))}
          {stale.map((lang) => (
            <div
              key={lang}
              className={cn(
                "grid gap-1.5 sm:grid-cols-[110px_1fr]",
                multiline ? "sm:items-start" : "sm:items-center",
              )}
            >
              <FieldLabel
                htmlFor={`${id}-${lang}`}
                className="text-[13px] font-normal text-muted-foreground"
              >
                {localeNames[lang]}
              </FieldLabel>
              <div className="grid gap-1">
                {box(lang, `${id}-${lang}`, false, true)}
                <p className="text-[12px] text-faint">{copy.notUsed}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
