"use client";

import { LanguagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useI18n } from "@/app/i18n/client";
import { localeNames, locales, type Locale } from "@/app/i18n/config";
import { setLocale } from "@/app/lib/preferences";
import { ChoiceMenu } from "./ChoiceMenu";

/** The language menu. The server renders the new language on refresh. */
export function LanguageSwitcher({
  placement,
}: {
  placement?: "below" | "above";
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <ChoiceMenu<Locale>
      label={t.header.language}
      icon={<LanguagesIcon />}
      value={locale}
      choices={locales.map((code) => ({
        value: code,
        label: localeNames[code],
        lang: code,
      }))}
      disabled={pending}
      placement={placement}
      onSelect={(next) =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
    />
  );
}
