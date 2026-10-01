/** How each status of an application is tagged in lists and on its page. */
export const statusBadge = {
  submitted: "pending",
  accepted: "brand",
  rejected: "danger",
  issued: "brand",
  open: "muted",
  paired: "muted",
} as const;
