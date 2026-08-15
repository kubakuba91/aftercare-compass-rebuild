"use client";

import { useEffect } from "react";

export function ClaimOutreachStartTracker({ token }: { token: string }) {
  useEffect(() => {
    void fetch("/api/profile-claim-outreach/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true
    });
  }, [token]);

  return null;
}
