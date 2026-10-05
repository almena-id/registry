"use client";

import { KeyIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { useI18n } from "@/app/i18n/client";
import { label } from "@/app/lib/form-fields";
import { hasText } from "@/app/lib/texts";
import { loadMore } from "@/app/lib/directory-actions";
import {
  opens,
  type Item,
  type Page,
  type Section,
} from "@/app/lib/directory-types";
import { formatDateTime } from "@/app/lib/format";

/** A signature: signed is the brand's, pending waits, outdated warns. */
const SIGNATURE_BADGE = {
  signed: "brand",
  pending: "pending",
  outdated: "danger",
} as const;

/**
 * The list keeps going as it is scrolled: when the marker under the last row
 * comes near the viewport, the next page is asked for with the cursor the
 * previous one ended on, until the API says there is no more.
 */
export function InfiniteList({
  section,
  initial,
  locale,
  timeZone,
}: {
  section: Section;
  initial: Page | null;
  locale: string;
  timeZone: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const publication = t.dashboard.publication;
  const signature = t.dashboard.signature;
  const [items, setItems] = useState<Item[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState<string | null>(
    initial?.next_cursor ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initial === null);
  const marker = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const next = useCallback(async () => {
    if (!cursor || busy.current) return;
    busy.current = true;
    setLoading(true);
    const page = await loadMore(section, cursor).catch(() => null);
    if (page) {
      // A row created meanwhile can shift the pages: never show one twice.
      setItems((shown) => {
        const seen = new Set(shown.map((item) => item.id));
        return [...shown, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(page.next_cursor);
      setFailed(false);
    } else {
      setFailed(true);
    }
    setLoading(false);
    busy.current = false;
  }, [cursor, section]);

  useEffect(() => {
    const node = marker.current;
    if (!node || !cursor || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void next();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, failed, next]);

  if (initial === null) {
    return (
      <Card className="gap-0 px-5 py-10 text-center">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="gap-0 px-5 py-10 text-center">
        <p className="text-faint">{t.dashboard.sections[section].empty}</p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 border-t px-5 py-3.5 first:border-t-0 max-sm:flex-col max-sm:items-start max-sm:gap-1"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              {opens(section) ? (
                // Identities and mediators open: their DID, and what can change.
                <Link
                  className="font-semibold hover:text-primary hover:underline"
                  href={`/dashboard/${section}/${item.id}`}
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-semibold">{item.name}</span>
              )}
              {hasText(item.description) && (
                <span className="truncate text-sm text-muted-foreground">
                  {label(item.description ?? {}, locale)}
                </span>
              )}
              {item.url && (
                <span className="truncate font-mono text-[13px] text-muted-foreground">
                  {item.url}
                </span>
              )}
              {item.identity && (
                <span className="mt-0.5 flex flex-wrap gap-1.5">
                  <Badge variant="muted" title={copy.identity}>
                    <KeyIcon />
                    {item.identity.name}
                  </Badge>
                  {item.public && <Badge variant="muted">{copy.public}</Badge>}
                  {item.mediator && (
                    <Badge variant="muted" title={copy.mediator}>
                      {copy.mediator} · {item.mediator.name}
                    </Badge>
                  )}
                </span>
              )}
              {item.used_by && (
                <span className="mt-0.5 flex flex-wrap gap-1.5">
                  {item.used_by.length === 0 ? (
                    <Badge variant="pending">{copy.unused}</Badge>
                  ) : (
                    item.used_by.map((use) => (
                      <Badge key={use.id} variant="muted">
                        {copy.usedBy[use.kind]} ·{" "}
                        {use.name || t.header.tenant.unnamed}
                      </Badge>
                    ))
                  )}
                </span>
              )}
            </div>
            {/* Where it stands, at a glance: published or not, and its DID's signature. */}
            <div className="flex flex-none flex-col items-end gap-1">
              <span className="flex flex-wrap justify-end gap-1.5">
                {section !== "identities" && (
                  <Badge variant={item.published_at ? "brand" : "muted"}>
                    {item.published_at
                      ? publication.published
                      : publication.draft}
                  </Badge>
                )}
                {item.signature && (
                  <Badge variant={SIGNATURE_BADGE[item.signature]}>
                    {signature.status[item.signature]}
                  </Badge>
                )}
              </span>
              <time
                className="flex-none text-[13px] text-faint tabular-nums"
                dateTime={item.created_at}
                title={copy.created}
              >
                {formatDateTime(item.created_at, locale, timeZone)}
              </time>
            </div>
          </li>
        ))}
      </ul>
      <div ref={marker} className="min-h-px" aria-live="polite">
        {loading && (
          <span className="block border-t px-5 py-3 text-center text-sm text-muted-foreground">
            {copy.loading}
          </span>
        )}
        {failed && cursor && (
          <span className="block border-t px-5 py-3 text-center text-sm text-muted-foreground">
            {copy.loadError}{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => void next()}
            >
              {copy.retry}
            </Button>
          </span>
        )}
      </div>
    </Card>
  );
}
