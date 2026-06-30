import { AftercareManagerScope, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AftercareAccessUser = {
  id: string;
  role: Role;
  orgId?: string | null;
  aftercareManagerScope?: AftercareManagerScope | null;
};

export function canBypassAftercareProfileAssignments(user: AftercareAccessUser) {
  return user.role === Role.system_admin || user.role === Role.aftercare_admin;
}

export function aftercareProfileWhereForUser(user: AftercareAccessUser): Prisma.AftercareProfileWhereInput {
  if (user.role === Role.system_admin) {
    return {};
  }

  if (!user.orgId) {
    return { id: "__no_aftercare_profile_access__" };
  }

  if (user.role === Role.aftercare_admin) {
    return { orgId: user.orgId };
  }

  if (user.role === Role.aftercare_manager && user.aftercareManagerScope !== AftercareManagerScope.assigned_profiles) {
    return { orgId: user.orgId };
  }

  if (user.role === Role.aftercare_manager) {
    return {
      orgId: user.orgId,
      managerAssignments: {
        some: { userId: user.id }
      }
    };
  }

  return { id: "__no_aftercare_profile_access__" };
}

export function aftercareProfileIdWhereForUser(
  user: AftercareAccessUser,
  profileId: string
): Prisma.AftercareProfileWhereInput {
  return {
    id: profileId,
    ...aftercareProfileWhereForUser(user)
  };
}

export async function canUserAccessAftercareProfile(user: AftercareAccessUser, profileId: string) {
  const profile = await prisma.aftercareProfile.findFirst({
    where: aftercareProfileIdWhereForUser(user, profileId),
    select: { id: true }
  });

  return Boolean(profile);
}

export async function assignedAftercareProfileIds(user: AftercareAccessUser) {
  const profiles = await prisma.aftercareProfile.findMany({
    where: aftercareProfileWhereForUser(user),
    select: { id: true }
  });

  return profiles.map((profile) => profile.id);
}
