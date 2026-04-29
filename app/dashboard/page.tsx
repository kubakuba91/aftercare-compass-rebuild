import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/current-user";

export default async function DashboardRedirectPage() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/onboarding/account-type");
  }

  if (appUser.role === Role.system_admin) {
    redirect("/dashboard/admin");
  }

  if (appUser.role === Role.referent_admin || appUser.role === Role.referent_manager) {
    redirect("/dashboard/referent");
  }

  redirect("/dashboard/aftercare");
}
