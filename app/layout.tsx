import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
  const hasClerkPublishableKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const body = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  if (!hasClerkPublishableKey) {
    return body;
  }

  return (
    <ClerkProvider>
      {body}
    </ClerkProvider>
  );
}
