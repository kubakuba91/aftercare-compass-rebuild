import { redirect } from "next/navigation";
import { getAuthenticatedLandingPath } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage() {
  redirect(await getAuthenticatedLandingPath());
}
