import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import {
  configuredAppHosts,
  dashboardAppOrigin,
  hasSeparateDashboardOrigin,
  publicAppOrigin
} from "@/lib/app-urls";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";

const dashboardSurfacePrefixes = [
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/auth",
  "/onboarding",
  "/setup"
] as const;

const publicSurfacePrefixes = [
  "/search",
  "/profiles",
  "/privacy-policy",
  "/terms-of-service",
  "/claim-profile"
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToOrigin(req: NextRequest, origin: string, pathname = req.nextUrl.pathname) {
  const destination = new URL(`${pathname}${req.nextUrl.search}`, origin);
  return NextResponse.redirect(destination);
}

function requestHost(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return forwardedHost || req.headers.get("host") || req.nextUrl.host;
}

function canonicalSurfaceRedirect(req: NextRequest) {
  if (!hasSeparateDashboardOrigin()) {
    return null;
  }

  const { publicHost, dashboardHost } = configuredAppHosts();
  const host = requestHost(req);
  const pathname = req.nextUrl.pathname;

  if (host === publicHost && matchesPrefix(pathname, dashboardSurfacePrefixes)) {
    return redirectToOrigin(req, dashboardAppOrigin());
  }

  if (host === dashboardHost && pathname === "/") {
    return redirectToOrigin(req, dashboardAppOrigin(), "/dashboard");
  }

  if (host === dashboardHost && matchesPrefix(pathname, publicSurfacePrefixes)) {
    return redirectToOrigin(req, publicAppOrigin());
  }

  return null;
}

const isProtectedRoute = createRouteMatcher([
  "/auth/complete(.*)",
  "/dashboard(.*)",
  "/onboarding/start(.*)",
  "/onboarding/aftercare(.*)",
  "/api/referrals(.*)",
  "/api/messages(.*)",
  "/api/profiles(.*)",
  "/api/admin(.*)"
]);

const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();

    if (!userId) {
      if (req.nextUrl.pathname.startsWith("/onboarding/start")) {
        const signUpUrl = new URL("/sign-up", req.url);
        return NextResponse.redirect(signUpUrl);
      }

      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up"
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const canonicalRedirect = canonicalSurfaceRedirect(req);

  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  if (!hasValidClerkRuntimeConfig()) {
    const url = new URL(req.url);

    if (isProtectedRoute(req)) {
      url.pathname = "/setup";
      url.searchParams.set("missing", "clerk");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return authMiddleware(req, event);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|woff2?|ttf|map)).*)"]
};
