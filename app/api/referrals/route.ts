import { NextResponse } from "next/server";
import { forbiddenDirectIdentifierFields, referralSchema } from "@/lib/validations/referral";

export async function POST(request: Request) {
  const body = await request.json();
  const forbiddenField = forbiddenDirectIdentifierFields.find((field) => field in body);

  if (forbiddenField) {
    return NextResponse.json(
      { error: `Direct patient identifier is not allowed: ${forbiddenField}` },
      { status: 400 }
    );
  }

  const parsed = referralSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid referral payload" }, { status: 400 });
  }

  // TODO: Require Clerk auth, create Referral with pending status, notify aftercare via Resend.
  return NextResponse.json({
    status: "pending",
    referral: parsed.data,
    next: "Create Referral record and send referral notification"
  });
}

