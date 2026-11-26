import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";
import { cn } from "@/lib/utils";

const itemClass = "rounded-lg px-3 py-2.5 text-sm font-medium text-[#17212b] hover:bg-[#f4f3ef]";

export function MobileNavigation({ isSignedIn = false, className = "lg:hidden" }: { isSignedIn?: boolean; className?: string }) {
  return (
    <details className={cn("group relative", className)}>
      <summary className="focus-ring flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-[#17212b] [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Open navigation</span>
        <Menu aria-hidden="true" size={22} />
      </summary>
      <nav className="absolute right-0 z-30 mt-2 grid w-60 gap-0.5 rounded-xl border border-black/10 bg-[#f7f6f3] p-1.5 shadow-[0_12px_32px_rgb(16_25_94_/_0.06)]" aria-label="Mobile navigation">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[#17212b] hover:bg-[#f4f3ef] [&::-webkit-details-marker]:hidden">
            Solutions
            <ChevronDown aria-hidden="true" size={14} />
          </summary>
          <div className="grid pb-1 pl-3">
            <Link className={itemClass} href={publicAppUrl("/for-providers")}>For providers</Link>
            <Link className={itemClass} href={publicAppUrl("/for-case-managers")}>For case managers</Link>
          </div>
        </details>
        <Link className={itemClass} href={publicAppUrl("/pricing")}>Pricing</Link>
        <Link className={itemClass} href={publicAppUrl("/resources")}>Resources</Link>
        <Link className={itemClass} href={publicAppUrl("/library")}>Library</Link>
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[#17212b] hover:bg-[#f4f3ef] [&::-webkit-details-marker]:hidden">
            Company
            <ChevronDown aria-hidden="true" size={14} />
          </summary>
          <div className="grid pb-1 pl-3">
            <Link className={itemClass} href={publicAppUrl("/about")}>About</Link>
            <Link className={itemClass} href={publicAppUrl("/contact")}>Contact</Link>
          </div>
        </details>
        <Link className={`${itemClass} text-[#10195e]`} href={dashboardAppUrl(isSignedIn ? "/auth/complete" : "/sign-in")}>{isSignedIn ? "Account" : "Join or log in"}</Link>
      </nav>
    </details>
  );
}
