/** The signing flows the registry offers, in the order the portal lists them. */
export const signingFlows = ["any_admin", "single_user"] as const;
export type SigningFlow = (typeof signingFlows)[number];
