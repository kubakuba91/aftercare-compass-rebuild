import { MobileNavigation } from "@/components/mobile-navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";

const linkClass = "focus-ring rounded-md px-1 py-2 text-sm font-medium text-[#3d4a57] hover:text-[#10195e]";
const menuLinkClass = "rounded-lg px-3 py-2.5 text-sm font-medium text-[#17212b] hover:bg-white hover:text-[#10195e]";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f4f3ef]/90 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link className="focus-ring shrink-0 rounded-md" href={publicAppUrl("/")} aria-label="Aftercare Compass home">
          <Image
            alt="Aftercare Compass"
            className="h-8 w-auto object-contain"
            height={64}
            priority
            src="/brand/logo-aftercare.png"
            width={220}
          />
        </Link>

        <div className="flex items-center gap-5">
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            <details className="group relative">
              <summary className={`${linkClass} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
                Solutions
                <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={14} />
              </summary>
              <div className="absolute left-0 z-40 mt-2 grid w-56 gap-0.5 rounded-xl border border-black/10 bg-[#f7f6f3] p-1.5 shadow-[0_12px_32px_rgb(16_25_94_/_0.06)]">
                <Link className={menuLinkClass} href={publicAppUrl("/for-providers")}>
                  For providers
                </Link>
                <Link className={menuLinkClass} href={publicAppUrl("/for-case-managers")}>
                  For case managers
                </Link>
              </div>
            </details>
            <Link className={linkClass} href={publicAppUrl("/pricing")}>
              Pricing
            </Link>
            <Link className={linkClass} href={publicAppUrl("/resources")}>
              Resources
            </Link>
            <Link className={linkClass} href={publicAppUrl("/library")}>
              Library
            </Link>
            <details className="group relative">
              <summary className={`${linkClass} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
                Company
                <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={14} />
              </summary>
              <div className="absolute right-0 z-40 mt-2 grid w-44 gap-0.5 rounded-xl border border-black/10 bg-[#f7f6f3] p-1.5 shadow-[0_12px_32px_rgb(16_25_94_/_0.06)]">
                <Link className={menuLinkClass} href={publicAppUrl("/about")}>
                  About
                </Link>
                <Link className={menuLinkClass} href={publicAppUrl("/contact")}>
                  Contact
                </Link>
              </div>
            </details>
          </nav>

          <Link className={`${linkClass} hidden sm:inline`} href={dashboardAppUrl("/sign-in")}>
            Join or log in
          </Link>

          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
