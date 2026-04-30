import { redirectToDashboardDestination } from "@/lib/protected-routing";

export default async function DashboardRedirectPage() {
  await redirectToDashboardDestination();
}
