/**
 * How a person reads in lists: "alias · email", or whichever of the two
 * there is — an account may have no email — else `fallback`.
 */
export function personLabel(
  person: { alias: string | null; email: string | null },
  fallback: string,
): string {
  if (person.alias && person.email) return `${person.alias} · ${person.email}`;
  return person.alias ?? person.email ?? fallback;
}
