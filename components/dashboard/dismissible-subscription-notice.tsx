"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

const storageKey = "aftercare:subscription-notice:seen-sessions";
const seenInMemory = new Set<string>();

export function DismissibleSubscriptionNotice({ sessionKey, children }: {
  sessionKey: string | null;
  children: ReactNode;
}) {
  const initialized = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionKey || initialized.current === sessionKey) return;
    initialized.current = sessionKey;
    let seen = [...seenInMemory];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) seen = [...seen, ...stored.filter((key): key is string => typeof key === "string")];
    } catch { /* In-memory tracking still works when browser storage is unavailable. */ }
    const alreadySeen = seen.includes(sessionKey);
    seenInMemory.add(sessionKey);
    setVisible(!alreadySeen);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...new Set([...seen, sessionKey])].slice(-20)));
    } catch { /* Keep the close button usable with restricted browser storage. */ }
  }, [sessionKey]);

  if (!visible) return null;

  return <aside aria-label="Subscription reminder" className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-2xl md:bottom-6 md:right-6 md:w-[32vw] md:min-w-80 md:max-w-xl">
    <button type="button" aria-label="Dismiss subscription reminder" onClick={() => setVisible(false)}
      className="focus-ring absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-border bg-white hover:bg-surface-secondary">
      <X aria-hidden="true" size={18} />
    </button>
    <div className="grid gap-3 pr-9" role="status">{children}</div>
  </aside>;
}
