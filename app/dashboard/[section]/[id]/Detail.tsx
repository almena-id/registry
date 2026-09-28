import Link from "next/link";

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
      <Link className="link identity__back" href={back}>
        ← {backLabel}
      </Link>
      {title !== undefined && (
        <header className="page-head page-head--actions page-head--detail">
          <h1 className="page-head__title">{title}</h1>
          {actions}
        </header>
      )}
    </>
  );
}

/** Nothing to show: not in this tenant, or the API did not answer. */
export function NotFound({ message }: { message: string }) {
  return (
    <div className="card list list--empty">
      <p className="alert" role="alert">
        {message}
      </p>
    </div>
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
    <section className="card identity__card">
      <h2 className="identity__title">{title}</h2>
      <p className="identity__hint">{hint}</p>
      <pre className="identity__document">
        <code>{JSON.stringify(document, null, 2)}</code>
      </pre>
    </section>
  );
}
