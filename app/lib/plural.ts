/** Pick the form the locale uses for `count`, and write the number its way. */
export function formatCount(
  forms: { one: string; other: string },
  count: number,
  locale: string,
): string {
  const form =
    new Intl.PluralRules(locale).select(count) === "one"
      ? forms.one
      : forms.other;
  return form.replace("{count}", new Intl.NumberFormat(locale).format(count));
}
