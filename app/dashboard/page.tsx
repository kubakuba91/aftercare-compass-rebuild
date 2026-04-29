import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireCurrentAppUser } from "@/lib/current-user";

export default async function DashboardRedirectPage() {
  const appUser = await requireCurrentAppUser();

  if (appUser.role === Role.system_admin) {
    redirect("/dashboard/admin");
  }

  if (appUser.role === Role.referent_admin || appUser.role === Role.referent_manager) {
    redirect("/dashboard/referent");
  }

  redirect("/dashboard/aftercare");
}
