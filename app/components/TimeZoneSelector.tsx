"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";

import { useI18n } from "@/app/i18n/client";
import {
  detectTimeZone,
  listTimeZones,
  persistTimeZone,
  timeZoneCity,
  timeZoneLabel,
} from "@/app/lib/timezone";
import { CheckIcon, ClockIcon, SearchIcon } from "./icons";
import { usePopover } from "./usePopover";

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
  const { open, setOpen, root, trigger } = usePopover();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const detected = useMemo(() => (open ? detectTimeZone() : null), [open]);
  const matches = useMemo(() => {
    if (!open) return { suggested: [] as string[], all: [] as string[] };
    const needle = query.trim().toLowerCase().replace(/[\s/_]+/g, " ");
    const hit = (zone: string) => zone.toLowerCase().replace(/[/_]+/g, " ").includes(needle);
    return {
      suggested: detected && hit(detected) ? [detected] : [],
      // The detected zone appears once, in its own group above.
      all: listTimeZones().filter((zone) => zone !== detected && hit(zone)),
    };
  }, [open, query, detected]);
  const flat = [...matches.suggested, ...matches.all];

  function toggle() {
    setQuery("");
    setActive(0);
    setOpen(!open);
  }

  function select(next: string) {
    setOpen(false);
    trigger.current?.focus();
    if (next === timeZone) return;
    persistTimeZone(next);
    startTransition(() => router.refresh());
  }

  function onSearchKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = Math.min(Math.max(active + step, 0), flat.length - 1);
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      select(flat[active]);
    }
  }

  function option(zone: string, index: number) {
    return (
      <li
        key={zone}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={zone === timeZone}
        data-active={index === active}
        className="popover__item"
        onPointerMove={() => setActive(index)}
        onClick={() => select(zone)}
      >
        <span className="popover__check" data-on={zone === timeZone}>
          <CheckIcon />
        </span>
        {timeZoneLabel(zone)}
      </li>
    );
  }

  return (
    <div className="popover" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="ghost-trigger"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={copy.label}
        title={timeZoneLabel(timeZone)}
        disabled={pending}
        onClick={toggle}
      >
        <ClockIcon />
        <span className="ghost-trigger__text">{timeZoneCity(timeZone)}</span>
      </button>

      {open && (
        <div className="popover__panel popover__panel--command">
          <div className="command__search">
            <SearchIcon />
            <input
              autoFocus
              value={query}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.label}
              aria-controls={listId}
              aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
            />
          </div>
          <ul className="command__list" id={listId} role="listbox" aria-label={copy.label}>
            {flat.length === 0 && <li className="command__empty">{copy.empty}</li>}
            {matches.suggested.length > 0 && (
              <li role="presentation" className="popover__label">
                {copy.suggestedHeading}
              </li>
            )}
            {matches.suggested.map((zone, index) => option(zone, index))}
            {matches.all.length > 0 && (
              <li role="presentation" className="popover__label">
                {copy.allHeading}
              </li>
            )}
            {matches.all.map((zone, index) => option(zone, index + matches.suggested.length))}
          </ul>
        </div>
      )}
    </div>
  );
}
