import { suppressClaimOutreachEmail } from "@/lib/profile-claim-outreach";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const outreach = await suppressClaimOutreachEmail(token);
  return new Response(outreach ? "Unsubscribed" : "Invalid or expired link", { status: outreach ? 200 : 404 });
}
