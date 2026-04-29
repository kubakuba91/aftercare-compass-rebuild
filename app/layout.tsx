import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aftercare Compass",
  description: "A referral-ready aftercare placement marketplace."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  if (!hasValidClerkPublishableKey()) {
    return body;
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {body}
    </ClerkProvider>
  );
}
