import type { CustomFieldState } from "@/app/lib/custom-field-actions";
import type { CustomField } from "@/app/lib/field-catalog";
import type { Catalogue, CatalogueField } from "@/app/lib/form-fields";

/**
 * One of the account's fields as its form is filled in — to change it, or to
 * start a copy of it. Its category and standard are the trust anchor's only.
 */
export function draftOfOwn(
  item: CustomField,
  catalogue: Catalogue,
  anchor: boolean,
): CustomFieldState {
  const { field, definition } = item;
  return {
    key: item.key,
    type: field.type,
    labels: field.labels,
    max_length: definition.max_length ? String(definition.max_length) : "",
    pattern: definition.pattern ?? "",
    options: definition.options,
    parts: definition.parts?.map((part) => ({
      key: part.key,
      required: part.required ?? true,
      type: part.field.type,
      labels: part.field.labels,
      max_length: part.field.definition?.max_length
        ? String(part.field.definition.max_length)
        : "",
      domain: part.field.definition?.domain,
    })),
    // A file field's formats: its own, or those of the file formats it takes
    // (all of them, unless it names some).
    formats:
      definition.formats ??
      (definition.domain === "file_format"
        ? (definition.values?.map(String) ??
          catalogue.domains.file_format.codes.map((code) => String(code.value)))
        : undefined),
    // A coded field's value list; a file field's formats stay its own.
    domain:
      field.type === "code" || field.type === "codes"
        ? definition.domain
        : undefined,
    category: anchor ? field.category : undefined,
    source: anchor ? field.source : undefined,
  };
}

/**
 * One of Almena's fields as an account's own form starts from it, when the
 * account copies it: what the published catalogue says of it.
 */
export function draftOfPublished(
  field: CatalogueField,
  catalogue: Catalogue,
): CustomFieldState {
  const listed = field.type === "code" || field.type === "codes";
  return {
    key: field.id,
    type: field.type,
    labels: field.labels,
    max_length: field.max_length ? String(field.max_length) : "",
    pattern: field.pattern ?? "",
    options: field.codes?.map((code) => ({
      value: String(code.value),
      labels: code.labels,
    })),
    domain: listed && !field.codes ? field.domain : undefined,
    formats:
      field.type === "file"
        ? (field.values?.map(String) ??
          catalogue.domains.file_format.codes.map((code) => String(code.value)))
        : undefined,
  };
}

/** The key a copy starts with: the original's, marked as a copy. */
export function copyKey(key: string): string {
  return `${key.replace(/^custom:/, "")}_copy`.slice(0, 64);
}
