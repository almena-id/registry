import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import type { Signed } from "@/app/lib/directory-types";

/**
 * The shapes every detail screen shares (an identity, an issuer, a verifier, a
 * mediator): the way back, the title with its operations beside it, and the
 * DID document the thing publishes.
 */
export function DetailHead({
  back,
  backLabel,
  title,
  actions,
}: {
  back: string;
  backLabel: string;
  title?: string;
  actions?: React.ReactNode;
}) {
  return (
    <>
      <Button asChild variant="link" className="h-auto justify-self-start p-0">
        <Link href={back}>← {backLabel}</Link>
      </Button>
      {/* The operations stay on the title's line. */}
      {title !== undefined && (
        <header className="flex flex-nowrap items-center justify-between gap-4">
          <h1 className="min-w-0 text-[28px] font-bold tracking-tight break-words">
            {title}
          </h1>
          {actions}
        </header>
      )}
    </>
  );
}

/** Nothing to show: not in this tenant, or the API did not answer. */
export function NotFound({ message }: { message: string }) {
  return (
    <Card className="gap-0 px-5 py-10 text-center">
      <Alert variant="destructive" role="alert">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </Card>
  );
}

export function DocumentCard({
  title,
  hint,
  document,
}: {
  title: string;
  hint: string;
  document: Record<string, unknown>;
}) {
  return (
    // A grid item: without min-w-0 a long line of JSON widens it past the page.
    <Card className="min-w-0 gap-0 p-5">
      <section className="min-w-0">
        <h2 className="mb-1 text-[15px] font-semibold">{title}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
        <pre className="overflow-x-auto rounded-lg bg-sunk px-4 py-3.5 font-mono text-[13px] leading-normal">
          <code>{JSON.stringify(document, null, 2)}</code>
        </pre>
      </section>
    </Card>
  );
}

/** The top-level fields in which two documents differ. */
function differences(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter(
    (key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]),
  );
}

/**
 * An identity's DID document as JSON. Signed, the one its log publishes;
 * pending, the one an admin's signature will publish; with changes to sign,
 * both — the one to sign first, saying in which fields it differs.
 */
export function DidDocuments({
  item,
  copy,
}: {
  item: Signed;
  copy: {
    published: string;
    publishedHint: string;
    toSign: string;
    pendingHint: string;
    outdatedHint: string;
  };
}) {
  if (item.signature === "signed" && item.signed_document)
    return (
      <DocumentCard
        title={copy.published}
        hint={copy.publishedHint}
        document={item.signed_document}
      />
    );
  if (item.signature === "pending" || !item.signed_document)
    return (
      <DocumentCard
        title={copy.toSign}
        hint={copy.pendingHint}
        document={item.document}
      />
    );
  const fields = differences(item.document, item.signed_document);
  return (
    <>
      <DocumentCard
        title={copy.toSign}
        hint={copy.outdatedHint.replace("{fields}", fields.join(", "))}
        document={item.document}
      />
      <DocumentCard
        title={copy.published}
        hint={copy.publishedHint}
        document={item.signed_document}
      />
    </>
  );
}
