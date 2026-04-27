import { NextResponse } from "next/server";
import { publicLeadSchema } from "@/lib/validations/lead";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = publicLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  // TODO: Persist Lead with Prisma and send Resend notification to admissions contact.
  return NextResponse.json({
    status: "accepted",
    lead: parsed.data,
    next: "Create Lead record and send Resend email"
  });
}

