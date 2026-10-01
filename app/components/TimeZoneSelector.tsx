"use client";

import { CheckIcon, ClockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { useI18n } from "@/app/i18n/client";
import {
  detectTimeZone,
  listTimeZones,
  persistTimeZone,
  timeZoneCity,
  timeZoneLabel,
} from "@/app/lib/timezone";
import { cn } from "cn";

/**
 * Picks the zone every date and time in the portal is rendered in. The full
 * IANA list is only built once the panel opens, so it costs nothing until
 * someone asks for it. The browser's own zone is offered first.
 */
export function TimeZoneSelector({ timeZone }: { timeZone: string }) {
  const { t } = useI18n();
  const copy = t.header.timeZone;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const detected = useMemo(() => (open ? detectTimeZone() : null), [open]);
  // The detected zone appears once, in its own group above.
  const all = useMemo(
    () => (open ? listTimeZones().filter((zone) => zone !== detected) : []),
    [open, detected],
  );

  function select(next: string) {
    setOpen(false);
    if (next === timeZone) return;
    persistTimeZone(next);
    startTransition(() => router.refresh());
  }

  function option(zone: string) {
    return (
      <CommandItem
        key={zone}
        // Searched as words: "new york" finds America/New_York.
        value={zone.replace(/[/_]+/g, " ")}
        onSelect={() => select(zone)}
      >
        <CheckIcon
          className={cn("text-primary", zone === timeZone ? "opacity-100" : "opacity-0")}
        />
        {timeZoneLabel(zone)}
      </CommandItem>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={copy.label}
          title={timeZoneLabel(timeZone)}
          disabled={pending}
        >
          <ClockIcon className="text-muted-foreground" />
          <span className="hidden sm:inline">{timeZoneCity(timeZone)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={copy.searchPlaceholder} aria-label={copy.label} />
          <CommandList>
            <CommandEmpty>{copy.empty}</CommandEmpty>
            {detected && (
              <CommandGroup heading={copy.suggestedHeading}>{option(detected)}</CommandGroup>
            )}
            <CommandGroup heading={copy.allHeading}>{all.map(option)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
