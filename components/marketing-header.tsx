import { MobileNavigation } from "@/components/mobile-navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";

export function MarketingHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="shell flex min-h-20 items-center justify-between gap-4 py-3">
        <Link className="focus-ring shrink-0 rounded-lg" href={publicAppUrl("/")} aria-label="Aftercare Compass home">
          <Image
            alt="Aftercare Compass"
            className="h-10 w-auto object-contain sm:h-12"
            height={80}
            priority
            src="/brand/logo-aftercare.png"
            width={280}
          />
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <details className="group relative">
              <summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:text-primary [&::-webkit-details-marker]:hidden">
                Solutions
                <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={16} />
              </summary>
              <div className="absolute left-0 z-40 mt-2 grid w-64 gap-1 rounded-2xl border border-border bg-white p-2 shadow-xl">
                <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] hover:text-primary" href={publicAppUrl("/for-providers")}>
                  For Providers
                </Link>
                <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] hover:text-primary" href={publicAppUrl("/for-case-managers")}>
                  For Case Managers
                </Link>
              </div>
            </details>
            <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold hover:text-primary" href={publicAppUrl("/pricing")}>
              Pricing
            </Link>
            <details className="group relative">
              <summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:text-primary [&::-webkit-details-marker]:hidden">
                Company
                <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={16} />
              </summary>
              <div className="absolute right-0 z-40 mt-2 grid w-52 gap-1 rounded-2xl border border-border bg-white p-2 shadow-xl">
                <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] hover:text-primary" href={publicAppUrl("/about")}>
                  About
                </Link>
                <Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f4f8ff] hover:text-primary" href={publicAppUrl("/contact")}>
                  Contact
                </Link>
              </div>
            </details>
          </nav>

          <div className="hidden sm:block">
            <ButtonLink href={dashboardAppUrl("/sign-in")} variant="secondary">
              Join or Login
            </ButtonLink>
          </div>

          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
