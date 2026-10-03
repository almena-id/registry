"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useI18n } from "@/app/i18n/client";
import {
  searchIssuers,
  type FoundIssuer,
} from "@/app/lib/issuer-search-actions";

/**
 * The issuers a credential is trusted from: searched among those published
 * that grant its type (`grants`), by a part of their name or DID, a page at
 * a time — never all of them at once. The chosen ones stay listed above,
 * named once they have been seen, removable one by one.
 */
export function IssuerPicker({
  type,
  chosen,
  onChange,
  invalid,
}: {
  type: string;
  /** Their DIDs. */
  chosen: string[];
  onChange: (chosen: string[]) => void;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.forms;
  const [text, setText] = useState("");
  const [found, setFound] = useState<FoundIssuer[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // Names of the issuers seen so far, for the chosen ones.
  const [names, setNames] = useState<Record<string, string>>({});
  // Only the latest search lands: an older answer arriving late is dropped.
  const asked = useRef(0);

  const remember = (items: FoundIssuer[]) =>
    setNames((known) => ({
      ...known,
      ...Object.fromEntries(items.map((item) => [item.did, item.name])),
    }));

  useEffect(() => {
    const ticket = ++asked.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const page = await searchIssuers(type, text).catch(() => null);
      if (ticket !== asked.current) return;
      setLoading(false);
      setFailed(page === null);
      setFound(page?.items ?? []);
      setCursor(page?.next_cursor ?? null);
      if (page) remember(page.items);
    }, 250);
    return () => clearTimeout(timer);
  }, [type, text]);

  async function more() {
    if (!cursor) return;
    const ticket = asked.current;
    setLoading(true);
    const page = await searchIssuers(type, text, cursor).catch(() => null);
    if (ticket !== asked.current) return;
    setLoading(false);
    if (!page) {
      setFailed(true);
      return;
    }
    setFound((shown) => [
      ...shown,
      ...page.items.filter((item) => !shown.some((s) => s.did === item.did)),
    ]);
    setCursor(page.next_cursor);
    remember(page.items);
  }

  const toggle = (did: string, on: boolean) =>
    onChange(on ? [...chosen, did] : chosen.filter((d) => d !== did));

  return (
    <div
      className="grid gap-2.5 rounded-lg bg-sunk p-3.5"
      data-invalid={invalid ? true : undefined}
    >
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={copy.trustChosen}>
          {chosen.map((did) => (
            <li
              key={did}
              className="flex max-w-full items-center gap-1 rounded-full border bg-background py-0.5 pr-1 pl-2.5 text-[13px]"
            >
              <span className="truncate">{names[did] ?? did}</span>
              <button
                type="button"
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={copy.trustRemove.replace(
                  "{name}",
                  names[did] ?? did,
                )}
                onClick={() => toggle(did, false)}
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={text}
          maxLength={100}
          onChange={(event) => setText(event.target.value)}
          placeholder={copy.trustSearch}
          aria-label={copy.trustSearch}
          className="pl-8"
        />
      </div>
      {failed ? (
        <p className="text-[13px] text-destructive">{copy.trustUnavailable}</p>
      ) : found.length === 0 && !loading ? (
        <p className="text-[13px] text-muted-foreground">
          {text.trim() ? copy.trustNoMatch : copy.noIssuers}
        </p>
      ) : (
        <div className="grid max-h-64 gap-2 overflow-y-auto">
          {found.map((issuer) => (
            <FieldLabel
              key={issuer.did}
              className="flex cursor-pointer items-center gap-2 font-normal"
            >
              <Checkbox
                checked={chosen.includes(issuer.did)}
                onCheckedChange={(checked) =>
                  toggle(issuer.did, checked === true)
                }
              />
              <span className="min-w-0">
                <span className="font-medium">{issuer.name}</span>{" "}
                <span className="font-mono text-[11px] break-all text-faint">
                  {issuer.did}
                </span>
              </span>
            </FieldLabel>
          ))}
        </div>
      )}
      {cursor && !failed && (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-self-start p-0 text-[13px]"
          onClick={() => void more()}
          disabled={loading}
        >
          {copy.trustMore}
        </Button>
      )}
    </div>
  );
}
