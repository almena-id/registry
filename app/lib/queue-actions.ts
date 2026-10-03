"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { api, currentTenant, sessionCookie } from "./api";
import type { Queue } from "./queues";

export type QueueState = {
  /** The queue as it is after the action. */
  queue?: Queue;
  /** Only right after it was made: the broker keeps it, the registry does not. */
  password?: string;
  error?: "unavailable" | "brokerUnavailable" | "exists" | "missing";
};

const ERRORS: Record<string, QueueState["error"]> = {
  broker_unavailable: "brokerUnavailable",
  queue_exists: "exists",
  queue_not_found: "missing",
};

async function call(
  method: "POST" | "DELETE",
  section: "issuers" | "verifiers",
  id: string,
): Promise<{
  data: (Queue & { password?: string }) | null;
  error?: QueueState["error"];
}> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { data: null, error: "unavailable" };
  const { status, data, detail } = await api<Queue & { password?: string }>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/queue`,
    { method, token },
  );
  if (status === null || status >= 300)
    return { data: null, error: (detail && ERRORS[detail]) || "unavailable" };
  return { data };
}

/** Makes the queue and the user that reads it; its password comes back this once. */
export async function createQueue(
  section: "issuers" | "verifiers",
  id: string,
  previous: QueueState,
): Promise<QueueState> {
  const { data, error } = await call("POST", section, id);
  if (!data) return { queue: previous.queue, error };
  revalidatePath(`/dashboard/${section}/${id}/queue`);
  const { password, ...queue } = data;
  return { queue, password };
}

/** Deletes the queue, with what is in it, and its user. */
export async function deleteQueue(
  section: "issuers" | "verifiers",
  id: string,
  previous: QueueState,
): Promise<QueueState> {
  const { error } = await call("DELETE", section, id);
  if (error) return { queue: previous.queue, error };
  revalidatePath(`/dashboard/${section}/${id}/queue`);
  return previous.queue
    ? { queue: { ...previous.queue, queue: null, created_at: null } }
    : {};
}
