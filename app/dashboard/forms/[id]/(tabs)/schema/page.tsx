import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { DocumentCard } from "@/app/dashboard/[section]/[id]/Detail";
import { getI18n } from "@/app/i18n/server";
import { fetchFormSchema } from "@/app/lib/forms";

/** The JSON Schema (2020-12) this form's answers meet. */
export default async function SchemaTab({
  params,
}: PageProps<"/dashboard/forms/[id]/schema">) {
  const { id } = await params;
  const [schema, { t }] = await Promise.all([fetchFormSchema(id), getI18n()]);
  const copy = t.dashboard.forms.detail;
  if (!schema)
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{copy.errors.unavailable}</AlertDescription>
      </Alert>
    );
  return (
    <DocumentCard
      title={copy.schemaTitle}
      hint={copy.schemaHint}
      document={schema}
      copy={copy}
    />
  );
}
