/** The spans the overview's Activity block offers, in days; 30 by default. */
export const ACTIVITY_SPANS = [7, 30, 90] as const;
export type ActivitySpan = (typeof ACTIVITY_SPANS)[number];

/** `?days=` as one of the spans offered, else the default. Client-safe. */
export function activitySpan(value: unknown): ActivitySpan {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return (ACTIVITY_SPANS as readonly number[]).includes(days)
    ? (days as ActivitySpan)
    : 30;
}

/** One UTC day of what the tenant's issuers and verifiers did. */
export type ActivityDay = {
  date: string;
  submitted: number;
  accepted: number;
  rejected: number;
  issued: number;
  verified: number;
  failed: number;
};

export type Activity = {
  days: ActivityDay[];
  /** Applications by their status now. */
  applications: {
    submitted: number;
    accepted: number;
    rejected: number;
    issued: number;
  };
  /** Credentials issued, by their status now. */
  credentials: { valid: number; suspended: number; revoked: number };
  verifications: { verified: number; failed: number };
};

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((all, value) => all + value, 0);

/** Whether anything ever happened: the days, or where things stand now. */
export function hasActivity(activity: Activity): boolean {
  return (
    sum(activityTotals(activity.days)) > 0 ||
    sum(activity.applications) > 0 ||
    sum(activity.credentials) > 0 ||
    sum(activity.verifications) > 0
  );
}

/** The span's totals, day by day added up. */
export function activityTotals(days: ActivityDay[]) {
  const totals = {
    submitted: 0,
    accepted: 0,
    rejected: 0,
    issued: 0,
    verified: 0,
    failed: 0,
  };
  for (const day of days)
    for (const key of Object.keys(totals) as (keyof typeof totals)[])
      totals[key] += day[key];
  return totals;
}
