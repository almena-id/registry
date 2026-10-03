import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Tabs } from "@/app/components/Tabs";
import { DetailHead } from "@/app/dashboard/[section]/[id]/Detail";
import { getI18n } from "@/app/i18n/server";
import { label } from "@/app/lib/form-fields";
import { fetchForm } from "@/app/lib/forms";

export async function generateMetadata({
  params,
}: LayoutProps<"/dashboard/forms/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [form, { locale }] = await Promise.all([fetchForm(id), getI18n()]);
  return form ? { title: label(form.name, locale) } : {};
}

/**
 * One form, opened: the way back, its name, and what a verifier does with
 * it — verify what a wallet presented, the DCQL query a wallet is asked
 * with, and the JSON Schema its answers meet.
 */
export default async function FormLayout({
  params,
  children,
}: LayoutProps<"/dashboard/forms/[id]">) {
  const { id } = await params;
  const [form, { t, locale }] = await Promise.all([fetchForm(id), getI18n()]);
  if (!form) notFound();
  const copy = t.dashboard.forms.detail;
  const base = `/dashboard/forms/${form.id}`;
  return (
    <div className="grid gap-4">
      <DetailHead
        back="/dashboard/forms"
        backLabel={t.dashboard.forms.title}
        title={label(form.name, locale)}
      />
      <Tabs
        label={copy.tabs}
        tabs={[
          { href: base, label: copy.verify },
          { href: `${base}/dcql`, label: copy.dcql },
          { href: `${base}/schema`, label: copy.schema },
        ]}
      />
      {children}
    </div>
  );
}
