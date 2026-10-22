"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Mail, X } from "lucide-react";

export function ContactProgramDialog({ profile, contact }: {
  profile: { id: string; slug: string; name: string };
  contact?: { name: string; email: string; phone: string };
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const sending = useRef(false);
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const triggerElement = trigger.current;
    if (!element) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || sent) return;
    const data = new FormData(event.currentTarget);
    sending.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id, slug: profile.slug,
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
          message: String(data.get("message") || "").trim(),
          companyWebsite: String(data.get("companyWebsite") || "")
        })
      });
      if (!response.ok) {
        setError(response.status === 400 ? "Please check your contact details and message." : response.status === 404 ? "This program is no longer available for contact." : "We couldn’t submit your request. Please try again shortly.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn’t confirm your submission. Please check your connection before trying again.");
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" className="ac-contact-button focus-ring" onClick={() => { setHasOpened(true); setOpen(true); }}>
      <Mail aria-hidden="true" size={16} />Contact this program
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-0 text-foreground shadow-xl backdrop:bg-primary/40">
      {hasOpened ? <>
        <div className="relative border-b border-border bg-primary/5 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Aftercare Compass</p>
          <h2 id={titleId} className="mt-2 pr-8 text-xl font-semibold text-heading">Contact this program</h2>
          <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">Send a contact request to {profile.name}.</p>
          <button type="button" aria-label="Close contact form" className="focus-ring absolute right-3 top-3 flex size-11 items-center justify-center rounded-full hover:bg-primary/10" onClick={() => setOpen(false)}><X aria-hidden="true" size={20} /></button>
        </div>
        {sent ? <div className="grid gap-4 p-6" role="status">
          <CheckCircle2 aria-hidden="true" className="text-primary" size={32} />
          <h3 className="text-lg font-semibold">Contact request submitted</h3>
          <p className="text-sm leading-6 text-muted-foreground">Your request for {profile.name} has been recorded. The provider can follow up using the contact details you supplied.</p>
          <button type="button" className="focus-ring ac-button ac-button--primary" onClick={() => setOpen(false)}>Done</button>
        </div> : <form onSubmit={submit} className="grid gap-4 p-6" aria-busy={pending}>
          <input name="companyWebsite" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />
          <label className="grid gap-1.5 text-sm font-medium">Name (required)<input name="name" autoComplete="name" required maxLength={120} defaultValue={contact?.name} className="focus-ring min-h-11 rounded-lg border border-border px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Email (required)<input name="email" type="email" autoComplete="email" required defaultValue={contact?.email} className="focus-ring min-h-11 rounded-lg border border-border px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={contact?.phone} className="focus-ring min-h-11 rounded-lg border border-border px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Message (required)<textarea name="message" required maxLength={2000} rows={4} className="focus-ring rounded-lg border border-border p-3" /></label>
          {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
          <button disabled={pending} type="submit" className="focus-ring ac-button ac-button--primary disabled:opacity-60">{pending ? "Sending…" : "Send contact request"}</button>
        </form>}
      </> : null}
    </dialog>
  </>;
}
