import { prisma } from "@/lib/prisma";
import { isVirtualOnly, virtualPlanCovers, virtualStates } from "@/lib/virtual-care";

export async function virtualOrganizationPlanError(orgId: string, plan: string, replacement?: { id?: string; type: string; telehealthMode: string | null; statesServed: string[] }) {
  const [profiles, managers, invitations] = await Promise.all([
    prisma.aftercareProfile.findMany({ where: { orgId, status: { not: "unpublished" } }, select: { id: true, type: true, telehealthMode: true, statesServed: true, status: true } }),
    prisma.user.count({ where: { orgId } }),
    prisma.organizationInvite.count({ where: { orgId, status: "pending" } })
  ]);
  const next = replacement ? [...profiles.filter((profile) => profile.id !== replacement.id), replacement] : profiles;
  const virtual = next.filter(isVirtualOnly);
  if (!virtual.length) return plan.startsWith("virtual_") ? "Virtual plans require a virtual-only Continued Care profile." : null;
  if (virtual.length !== next.length) return "Mixed in-person and virtual organizations are not supported yet.";
  if (!plan || plan === "claimed_listing") return virtual.length > 1 ? "The free claimed listing includes one virtual profile. Choose a paid virtual tier before adding another." : null;
  if (virtual.some((profile) => !profile.statesServed.length || profile.statesServed.some((state) => !(virtualStates as readonly string[]).includes(state)))) return "Complete valid states served on each virtual profile before subscribing.";
  if (!plan.startsWith("virtual_")) return "Choose a virtual plan for this virtual-only organization.";
  const states = [...new Set(virtual.flatMap((profile) => profile.statesServed))];
  if (!virtualPlanCovers(plan, states, virtual.length, managers + invitations)) return "Choose a higher virtual tier to cover your states, profiles, and managers.";
  return null;
}
