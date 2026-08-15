"use server";

import { redirect } from "next/navigation";
import { suppressClaimOutreachEmail } from "@/lib/profile-claim-outreach";

export async function unsubscribeClaimOutreach(formData: FormData) {
  const token = String(formData.get("token") || "");
  const outreach = await suppressClaimOutreachEmail(token);
  if (!outreach) redirect("/claim-profile/unsubscribe/invalid");
  redirect(`/claim-profile/unsubscribe/${token}?done=1`);
}
