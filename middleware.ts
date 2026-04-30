import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher([
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

      return redirectToSignIn({ returnBackUrl: "/dashboard" });
    }
  }
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up"
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
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
