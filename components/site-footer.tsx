import Link from "next/link";
import { publicAppUrl } from "@/lib/app-urls";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="shell flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Aftercare Compass</p>
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/for-providers")}>
            Providers
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/for-case-managers")}>
            Case Managers
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/pricing")}>
            Pricing
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/about")}>
            About
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/contact")}>
            Contact
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/privacy-policy")}>
            Privacy Policy
          </Link>
          <Link className="font-semibold hover:text-foreground" href={publicAppUrl("/terms-of-service")}>
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
