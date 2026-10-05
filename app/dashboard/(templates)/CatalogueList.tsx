"use client";

import { CopyIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useI18n } from "@/app/i18n/client";

/** One row of a catalogue list, everything already worded. */
export type CatalogueListRow = {
  id: string;
  /** Where clicking it goes to change it; none when the account may not. */
  href?: string;
  title: string;
  /** Its key, as forms, issuers and the API name it. */
  code: string;
  /** A line under it: what it is, where it comes from. */
  line?: string;
  badges?: { text: string; variant?: "muted" | "brand" | "pending" }[];
  /** Facts on the right: counts, kinds. */
  facts?: string[];
  /** Where duplicating it starts: the create screen, filled in. */
  duplicate?: string;
  /** Its published document (a JSON Schema), opened in a new tab. */
  schema?: string;
  /** Whether it may be deleted from here; `blocked` says why it may not now. */
  removable?: boolean;
  blocked?: string;
};

/**
 * A catalogue list, shaped like the dashboard's others (issuers, verifiers…):
 * a card of rows — on the left the name, its key, a line and its tags; on the
 * right its facts, then its actions as icons (duplicate, open the schema,
 * delete, asked first). Clicking a row opens it to be changed. A filter finds
 * rows by any of their words.
 */
export function CatalogueList({
  rows,
  remove,
  errors,
  empty,
}: {
  rows: CatalogueListRow[];
  /** Deletes one, by id; the error key it answers with, if any. */
  remove?: (id: string) => Promise<{ error?: string }>;
  /** The words for the error keys `remove` answers with. */
  errors?: Record<string, string>;
  empty: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue.list;
  const [filter, setFilter] = useState("");
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const shown = useMemo(() => {
    const text = filter.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((row) =>
      [row.title, row.code, row.line, ...(row.badges ?? []).map((b) => b.text)]
        .filter(Boolean)
        .some((word) => word!.toLowerCase().includes(text)),
    );
  }, [rows, filter]);

  const onRemove = (row: CatalogueListRow) => {
    if (
      !remove ||
      !window.confirm(copy.confirmDelete.replace("{name}", row.title))
    )
      return;
    setBusy(row.id);
    start(async () => {
      const { error } = await remove(row.id);
      setFailed((all) => {
        const next = { ...all };
        if (error) next[row.id] = errors?.[error] ?? copy.unavailable;
        else delete next[row.id];
        return next;
      });
      setBusy(null);
    });
  };

  if (rows.length === 0)
    return (
      <Card className="gap-0 px-5 py-10 text-center">
        <p className="text-faint">{empty}</p>
      </Card>
    );

  return (
    <div className="grid min-w-0 gap-2">
      {rows.length > 8 && (
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
          className="max-w-xs"
        />
      )}
      <Card className="min-w-0 gap-0 py-0">
        {shown.length === 0 ? (
          <p className="px-5 py-8 text-center text-faint">{copy.noMatch}</p>
        ) : (
          <ul className="flex flex-col">
            {shown.map((row) => (
              <li
                key={row.id}
                className={`relative border-t first:border-t-0 ${row.href ? "transition-colors hover:bg-accent" : ""}`}
              >
                {row.href && (
                  // The whole row opens it; the actions sit above this link.
                  <Link
                    href={row.href}
                    className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={copy.open.replace("{name}", row.title)}
                  />
                )}
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{row.title}</span>{" "}
                      <span className="font-mono text-[12px] text-faint">
                        {row.code}
                      </span>
                    </span>
                    {row.line && (
                      <span className="truncate text-sm text-muted-foreground">
                        {row.line}
                      </span>
                    )}
                    {row.badges && row.badges.length > 0 && (
                      <span className="mt-0.5 flex flex-wrap gap-1.5">
                        {row.badges.map((badge) => (
                          <Badge
                            key={badge.text}
                            variant={badge.variant ?? "muted"}
                          >
                            {badge.text}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-4">
                    {row.facts && row.facts.length > 0 && (
                      <span className="flex flex-col items-end gap-0.5 text-[13px] text-muted-foreground tabular-nums max-sm:items-start">
                        {row.facts.map((fact) => (
                          <span key={fact}>{fact}</span>
                        ))}
                      </span>
                    )}
                    <span className="relative z-10 flex gap-1">
                      {row.duplicate && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          title={copy.duplicate}
                        >
                          <Link
                            href={row.duplicate}
                            aria-label={`${copy.duplicate}: ${row.title}`}
                          >
                            <CopyIcon />
                          </Link>
                        </Button>
                      )}
                      {row.schema && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          title={copy.schema}
                        >
                          <a
                            href={row.schema}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${copy.schema}: ${row.title}`}
                          >
                            <ExternalLinkIcon />
                          </a>
                        </Button>
                      )}
                      {row.removable && remove && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          disabled={
                            Boolean(row.blocked) || (pending && busy === row.id)
                          }
                          title={row.blocked ?? copy.delete}
                          aria-label={`${copy.delete}: ${row.title}`}
                          onClick={() => onRemove(row)}
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </span>
                  </div>
                </div>
                {failed[row.id] && (
                  <div className="relative z-10 px-5 pb-3">
                    <Alert variant="destructive" role="alert">
                      <AlertDescription>{failed[row.id]}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
