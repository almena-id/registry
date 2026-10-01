"use client";

import { GlobeIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { localeNames, locales, type Locale } from "@/app/i18n/config";
import type { Texts } from "@/app/lib/texts";
import { cn } from "cn";

/**
 * A text written in each of the portal's languages: the box shows the
 * visitor's; the globe, after it and outside it, opens a line per other
 * language, each with its own box. The globe is marked while another
 * language has text. With `name`, the texts travel as JSON in a hidden input.
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
}) {
  const { t, locale } = useI18n();
  const copy = t.texts;
  const [open, setOpen] = useState(false);
  const panel = useId();
  const others = locales.filter((lang) => lang !== locale);
  const elsewhere = others.some((lang) => value[lang]?.trim());

  const box = (lang: Locale, boxId: string, first: boolean) => {
    const common = {
      id: boxId,
      value: value[lang] ?? "",
      maxLength,
      lang,
      placeholder: first ? placeholder : undefined,
      autoFocus: first ? autoFocus : undefined,
      "aria-invalid": invalid ? true : undefined,
      "aria-describedby": first ? describedBy : undefined,
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
        <input type="hidden" name={name} value={JSON.stringify(value)} />
      )}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{box(locale, id, true)}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("flex-none", elsewhere && "text-primary")}
          aria-expanded={open}
          aria-controls={panel}
          aria-label={copy.otherLanguages}
          title={copy.otherLanguages}
          onClick={() => setOpen((shown) => !shown)}
        >
          <GlobeIcon />
        </Button>
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
        </div>
      )}
    </div>
  );
}
