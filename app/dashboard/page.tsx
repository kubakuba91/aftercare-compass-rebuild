import { redirectToDashboardDestination } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  await redirectToDashboardDestination();
}
