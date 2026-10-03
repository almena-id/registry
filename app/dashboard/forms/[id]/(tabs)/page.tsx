import { getI18n } from "@/app/i18n/server";
import { fetchForm } from "@/app/lib/forms";
import { VerifyForm } from "./VerifyForm";

/**
 * Verify: what a wallet presented for this form (an OpenID4VP `vp_token`),
 * checked by the API as it checks any verifier's — each credential's issuer,
 * signature, status, holder binding, and the claims the form asks for.
 */
export default async function VerifyTab({
  params,
}: PageProps<"/dashboard/forms/[id]">) {
  const { id } = await params;
  const [form, { t }] = await Promise.all([fetchForm(id), getI18n()]);
  if (!form) return null;
  if (!form.credentials.length)
    return (
      <p className="rounded-xl border border-dashed px-5 py-10 text-center text-faint">
        {t.dashboard.forms.detail.nothingToVerify}
      </p>
    );
  return <VerifyForm formId={form.id} />;
}
