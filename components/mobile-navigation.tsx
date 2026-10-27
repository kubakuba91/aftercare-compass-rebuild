import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";
import { cn } from "@/lib/utils";

export function MobileNavigation({ isSignedIn = false, className = "lg:hidden" }: { isSignedIn?: boolean; className?: string }) {
  return (
<details className={cn("group relative", className)}>
            <summary className="focus-ring flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-white shadow-sm [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open navigation</span>
              <Menu aria-hidden="true" size={22} />
            </summary>
            <nav className="absolute right-0 z-30 mt-3 grid w-64 gap-1 rounded-2xl border border-border bg-white p-2 shadow-xl" aria-label="Mobile navigation">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] [&::-webkit-details-marker]:hidden">
                  Solutions
                  <ChevronDown aria-hidden="true" size={16} />
                </summary>
                <div className="ml-4 grid border-l border-border pl-2">
                  <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/for-providers")}>For Providers</Link>
                  <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/for-case-managers")}>For Case Managers</Link>
                </div>
              </details>
              <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/pricing")}>Pricing</Link>
              <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/resources")}>Resources</Link>
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] [&::-webkit-details-marker]:hidden">
                  Company
                  <ChevronDown aria-hidden="true" size={16} />
                </summary>
                <div className="ml-4 grid border-l border-border pl-2">
                  <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/about")}>About</Link>
                  <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff]" href={publicAppUrl("/contact")}>Contact</Link>
                </div>
              </details>
              <Link className="rounded-xl bg-[#f4f8ff] px-4 py-3 text-sm font-semibold text-primary" href={dashboardAppUrl(isSignedIn ? "/auth/complete" : "/sign-in")}>{isSignedIn ? "Account" : "Join or Login"}</Link>
            </nav>
          </details>
  );
}
