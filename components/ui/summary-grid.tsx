import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type SummaryItem = { label: string; icon: LucideIcon; value: ReactNode; notes?: ReactNode };

/** Shared, semantic fact rows for profile summaries and other overview screens. */
export function SummaryGrid({ items }: { items: SummaryItem[] }) {
  return <dl className="ac-summary-grid">
    {items.map(({ label, icon: Icon, value, notes }) => <div className="ac-summary-item" key={label}>
      <span className="ac-icon-tile"><Icon aria-hidden="true" size={24} /></span>
      <div className="ac-summary-content">
        <dt className="ac-summary-label">{label}</dt>
        <dd className="ac-summary-value">{value}{notes ? <p className="ac-summary-notes">{notes}</p> : null}</dd>
      </div>
    </div>)}
  </dl>;
}
