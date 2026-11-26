import { ArrowUpRight } from "lucide-react";
import type { ResourceLink } from "@/lib/recovery-housing/types";

export function ResourceLinkCard({ link }: { link: ResourceLink }) {
  return (
    <a
      className="focus-ring group flex h-full flex-col rounded-xl border border-black/10 bg-white p-5"
      href={link.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{link.source}</span>
      <span className="mt-2 flex items-start justify-between gap-3 text-base font-semibold leading-6 text-[#17212b]">
        {link.title}
        <ArrowUpRight aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" size={18} />
      </span>
      {link.description ? <span className="mt-2 text-sm leading-6 text-muted-foreground">{link.description}</span> : null}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
