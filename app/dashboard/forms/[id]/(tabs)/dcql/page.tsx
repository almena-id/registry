import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { DocumentCard } from "@/app/dashboard/[section]/[id]/Detail";
import { getI18n } from "@/app/i18n/server";
import { fetchFormDcql } from "@/app/lib/forms";

/** The DCQL query a wallet is asked with for this form's credentials. */
export default async function DcqlTab({
  params,
}: PageProps<"/dashboard/forms/[id]/dcql">) {
  const { id } = await params;
  const [query, { t }] = await Promise.all([fetchFormDcql(id), getI18n()]);
  const copy = t.dashboard.forms.detail;
  if (!query)
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{copy.errors.unavailable}</AlertDescription>
      </Alert>
    );
  return (
    <DocumentCard
      title={copy.dcqlTitle}
      hint={copy.dcqlHint}
      document={query}
      copy={copy}
    />
  );
}
