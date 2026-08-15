import { Role } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/current-user";
import { providerTemplateCsv } from "@/lib/provider-csv-import";

export async function GET() {
  const user = await getCurrentAppUser();
  if (user?.role !== Role.system_admin) return new Response("Forbidden", { status: 403 });

  return new Response(providerTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aftercare-provider-import-template.csv"',
      "Cache-Control": "private, no-store"
    }
  });
}
