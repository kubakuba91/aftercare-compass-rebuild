"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function TransientToast({
  message,
  queryParameter = "reviewMessage"
}: {
  message: string;
  queryParameter?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has(queryParameter)) {
      url.searchParams.delete(queryParameter);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }

    const timer = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [queryParameter]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-4 z-[100] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg sm:max-w-md"
      role="status"
    >
      <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
      <span className="leading-5">{message}</span>
      <button
        aria-label="Dismiss notification"
        className="-mr-1 ml-1 inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-md hover:bg-emerald-100"
        onClick={() => setVisible(false)}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
