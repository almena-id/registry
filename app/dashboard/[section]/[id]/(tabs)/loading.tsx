import { getI18n } from "@/app/i18n/server";

/**
 * While a tab loads, the head and the tabs stay and the new tab is marked at
 * once; the card below says it is on its way instead of showing the old tab.
 */
export default async function TabLoading() {
  const { t } = await getI18n();
  return (
    <div className="card identity__card" aria-busy="true">
      <p className="facts__empty">{t.dashboard.detail.loading}</p>
    </div>
  );
}
