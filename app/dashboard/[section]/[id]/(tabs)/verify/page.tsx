import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { getI18n } from "@/app/i18n/server";
import { label } from "@/app/lib/form-fields";
import { fetchForms } from "@/app/lib/forms";
import { loadItem } from "../../load";
import { VerifyByQr } from "./VerifyByQr";

/**
 * Verify: the verifier asks a wallet, by QR, to present what one of the
 * tenant's forms asks for; the verdict shows here when the wallet answers.
 * Only a published verifier asks: the wallet is shown its DID.
 */
export default async function VerifyTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/verify">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded || loaded.section !== "verifiers") notFound();
  if (!loaded.item) return null;
  const [{ t, locale }, forms] = await Promise.all([getI18n(), fetchForms()]);
  const copy = t.dashboard.verification;
  if (!forms)
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{copy.errors.unavailable}</AlertDescription>
      </Alert>
    );
  const asking = forms
    .filter((form) => form.credentials.length > 0)
    .map((form) => ({ id: form.id, name: label(form.name, locale) }));
  return (
    <VerifyByQr
      verifierId={id}
      published={Boolean(loaded.item.published_at)}
      forms={asking}
    />
  );
}
