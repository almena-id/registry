import type { CredentialType } from "@/app/lib/credential-catalog";
import type { CredentialTypeState } from "@/app/lib/credential-type-actions";

/** A credential type as its form is filled in, to change it. */
export function draftOfType(
  key: string,
  kind: CredentialType,
): CredentialTypeState {
  const external = kind.issuance === "external";
  return {
    key,
    labels: kind.labels,
    descriptions: kind.descriptions,
    category: kind.category,
    source: kind.source,
    claims: kind.claims.map(({ field, required }) => ({ field, required })),
    issuance: kind.issuance,
    vct: external ? kind.formats["dc+sd-jwt"].vct : "",
    w3c_type: kind.formats.jwt_vc_json?.type[1] ?? "",
    mdoc_doctype: kind.formats.mso_mdoc?.doctype ?? "",
  };
}

/**
 * A copy's start: the original's words, category and claims under a key of its
 * own. How formats name it is the original's alone, so it starts without;
 * another account's copy is its issuers', never issued elsewhere.
 */
export function copyOfType(
  kind: CredentialType,
  anchor: boolean,
): CredentialTypeState {
  const draft = draftOfType(
    `${kind.id.replace(/^custom:/, "")}_copy`.slice(0, 64),
    kind,
  );
  const external = anchor && kind.issuance === "external";
  return {
    ...draft,
    issuance: external ? "external" : "almena",
    vct: external ? draft.vct : "",
    w3c_type: "",
    mdoc_doctype: "",
  };
}
