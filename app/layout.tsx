import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteFooter } from "@/components/site-footer";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aftercare Compass",
  description: "A referral-ready aftercare placement marketplace.",
  icons: {
    icon: [
      {
        url: "/brand/ac-favicon.png",
        type: "image/png",
        sizes: "512x512"
      }
    ],
    apple: [
      {
        url: "/brand/ac-favicon.png",
        type: "image/png",
        sizes: "512x512"
      }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en">
      <body>
        <div className="site-content">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );

  if (!hasValidClerkPublishableKey()) {
    return body;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInForceRedirectUrl="/auth/complete"
      signInFallbackRedirectUrl="/auth/complete"
      signUpForceRedirectUrl="/auth/complete"
      signUpFallbackRedirectUrl="/auth/complete"
    >
      {body}
    </ClerkProvider>
  );
}
