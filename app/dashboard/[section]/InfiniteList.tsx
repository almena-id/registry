"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { KeyIcon } from "@/app/components/icons";
import { useI18n } from "@/app/i18n/client";
import { loadMore } from "@/app/lib/directory-actions";
import type { Item, Page, Section } from "@/app/lib/directory-types";
import { formatDateTime } from "@/app/lib/format";

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
      <div className="card list list--empty">
        <p className="alert" role="alert">
          {copy.errors.unavailable}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card list list--empty">
        <p className="list__empty">{t.dashboard.sections[section].empty}</p>
      </div>
    );
  }

  return (
    <div className="card list">
      <ul className="list__rows">
        {items.map((item) => (
          <li key={item.id} className="list__row">
            <div className="list__main">
              <span className="list__name">{item.name}</span>
              {item.description && (
                <span className="list__description">{item.description}</span>
              )}
              {item.identity && (
                <span className="list__tags">
                  <span className="tag tag--identity" title={copy.identity}>
                    <KeyIcon size={12} />
                    {item.identity.name}
                  </span>
                </span>
              )}
              {item.used_by && (
                <span className="list__tags">
                  {item.used_by.length === 0 ? (
                    <span className="tag tag--invited">{copy.unused}</span>
                  ) : (
                    item.used_by.map((use) => (
                      <span key={use.id} className="tag">
                        {copy.usedBy[use.kind]} · {use.name}
                      </span>
                    ))
                  )}
                </span>
              )}
            </div>
            <time
              className="list__date"
              dateTime={item.created_at}
              title={copy.created}
            >
              {formatDateTime(item.created_at, locale, timeZone)}
            </time>
          </li>
        ))}
      </ul>
      <div ref={marker} className="list__foot" aria-live="polite">
        {loading && <span className="list__status">{copy.loading}</span>}
        {failed && cursor && (
          <span className="list__status">
            {copy.loadError}{" "}
            <button type="button" className="link" onClick={() => void next()}>
              {copy.retry}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
