import { readFile } from "node:fs/promises";
import path from "node:path";

// The origin's DID configuration (DIF Well Known DID Configuration): a Domain
// Linkage Credential binding this origin to Almena's DID (did:web:almena.id).
// It is signed with that DID's key, which no portal holds, so it is produced
// elsewhere and served as it is from REGISTRY_WEB_WELL_KNOWN_DIR; 404 without it.
export async function GET() {
  const directory = process.env.REGISTRY_WEB_WELL_KNOWN_DIR;
  if (!directory) return new Response(null, { status: 404 });
  try {
    const body = await readFile(path.join(directory, "did-configuration.json"));
    return new Response(body, { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
