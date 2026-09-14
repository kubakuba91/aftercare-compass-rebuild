"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function ClaimProfileDialog({ children, label, showTrigger }: {
  children: ReactNode;
  label: string;
  showTrigger: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchParams = useSearchParams();
  const claim = searchParams.get("claim");
  const token = searchParams.get("claimToken");
  const shouldOpen = Boolean(claim || token);
  const [hasOpened, setHasOpened] = useState(shouldOpen);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!shouldOpen) {
      element.close();
      return;
    }
    setHasOpened(true);
    if (!element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [shouldOpen, claim, token]);

  function close() {
    dialog.current?.close();
    const url = new URL(window.location.href);
    url.searchParams.delete("claim");
    url.searchParams.delete("claimToken");
    if (url.hash === "#claim") url.hash = "";
    window.history.replaceState(null, "", url);
    trigger.current?.focus();
  }

  return (
    <>
      {showTrigger ? (
        <button
          aria-haspopup="dialog"
          className="focus-ring inline-flex min-h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold shadow-sm transition hover:bg-surface-secondary"
          onClick={() => {
            setHasOpened(true);
            const url = new URL(window.location.href);
            url.searchParams.set("claim", "open");
            window.history.replaceState(null, "", url);
          }}
          ref={trigger}
          type="button"
        >
          {label}
        </button>
      ) : null}
      <dialog
        aria-labelledby="claim-dialog-title"
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-0 text-foreground shadow-xl backdrop:bg-black/50"
        onCancel={(event) => { event.preventDefault(); close(); }}
        ref={dialog}
      >
        <button
          aria-label="Close claim dialog"
          className="focus-ring absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border bg-white"
          onClick={close}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
        {hasOpened ? children : null}
      </dialog>
    </>
  );
}
