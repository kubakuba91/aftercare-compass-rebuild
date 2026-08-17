const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

export function hasValidClerkPublishableKey() {
  return Boolean(
    publishableKey &&
      (publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_"))
  );
}

export function hasValidClerkSecretKey() {
  return Boolean(secretKey && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_")));
}

export function hasValidClerkRuntimeConfig() {
  return hasValidClerkPublishableKey() && hasValidClerkSecretKey();
}

export const clerkEnvRequirements = [
  {
    key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    valueHint: "Starts with pk_test_ or pk_live_",
    valid: hasValidClerkPublishableKey()
  },
  {
    key: "CLERK_SECRET_KEY",
    valueHint: "Starts with sk_test_ or sk_live_",
    valid: hasValidClerkSecretKey()
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    valueHint: "Legacy fallback app URL, without a trailing slash",
    valid: Boolean(
      process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NEXT_PUBLIC_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_DASHBOARD_APP_URL)
    )
  },
  {
    key: "NEXT_PUBLIC_PUBLIC_APP_URL",
    valueHint: "Public site origin, for example https://www.aftercarecompass.com",
    valid: Boolean(process.env.NEXT_PUBLIC_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL)
  },
  {
    key: "NEXT_PUBLIC_DASHBOARD_APP_URL",
    valueHint: "Dashboard origin, for example https://dashboard.aftercarecompass.com",
    valid: Boolean(process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || process.env.NEXT_PUBLIC_APP_URL)
  }
] as const;
