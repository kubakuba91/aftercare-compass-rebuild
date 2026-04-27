export const roles = [
  "system_admin",
  "referent_admin",
  "referent_manager",
  "aftercare_admin",
  "aftercare_manager"
] as const;

export type Role = (typeof roles)[number];

export const protectedRoutePrefixes = [
  "/dashboard",
  "/onboarding",
  "/api/referrals",
  "/api/messages",
  "/api/profiles",
  "/api/admin"
] as const;

export function isAftercareRole(role: Role) {
  return role === "aftercare_admin" || role === "aftercare_manager";
}

export function isReferentRole(role: Role) {
  return role === "referent_admin" || role === "referent_manager";
}

export function canManageTeam(role: Role) {
  return role === "referent_admin" || role === "aftercare_admin" || role === "system_admin";
}

