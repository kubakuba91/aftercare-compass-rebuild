"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { validateReferentTeamInvitations } from "@/app/(auth)/onboarding/referent/actions";

export function ReferentTeamInvites({ initialEmails }: { initialEmails: string[] }) {
  const [emails, setEmails] = useState(initialEmails);
  const [text, setText] = useState(initialEmails.join("\n"));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (error && !pending) field.current?.focus();
  }, [error, pending]);

  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }

  async function validate() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await validateReferentTeamInvitations(text);
      if (result.error !== undefined) {
        setError(result.error);
        field.current?.focus();
      } else {
        setEmails(result.emails);
        setText(result.emails.join("\n"));
        close();
      }
    } catch {
      setError("We could not check these invitations. Your entries are still here—please try again.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <input type="hidden" name="invitedTeamEmails" value={emails.join("\n")} />
    <p className="text-sm text-muted-foreground">Invite your team now or add members later from your dashboard. Invitations are emailed after you complete onboarding.</p>
    {emails.length ? <div className="rounded-xl border border-border p-4" aria-live="polite">
      <p className="font-semibold">{emails.length} invitation{emails.length === 1 ? "" : "s"} ready</p>
      <ul className="mt-2 space-y-1 text-sm">{emails.map(email => <li key={email} className="break-all">{email}</li>)}</ul>
    </div> : null}
    <div className="flex flex-wrap gap-3">
      <button type="button" ref={trigger} aria-haspopup="dialog" className="focus-ring ac-button ac-button--primary" onClick={() => {
        setOpen(true);
        dialog.current?.showModal();
        field.current?.focus();
      }}>{emails.length ? "Edit invitations" : "Invite team members"}</button>
      <button type="submit" name="skipTeamInvites" value="yes" className="focus-ring ac-button ac-button--secondary">Skip for now</button>
    </div>
    <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-6 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={event => { event.preventDefault(); if (!pending) close(); }}>
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${id}-title`} className="text-xl font-semibold">Invite team members</h2>
        <button type="button" aria-label="Close invitations" disabled={pending} onClick={close} className="focus-ring rounded-full p-1 disabled:opacity-50"><X size={20} /></button>
      </div>
      <p id={`${id}-help`} className="mt-3 text-sm text-muted-foreground">Add one email per line or separate them with commas. We’ll check them before adding your invitations.</p>
      <label htmlFor={`${id}-emails`} className="mt-5 block text-sm font-medium">Team emails</label>
      <textarea ref={field} id={`${id}-emails`} value={text} maxLength={10000} disabled={pending}
        aria-invalid={!!error} aria-describedby={error ? `${id}-error` : `${id}-help`}
        onChange={event => { setText(event.target.value); setError(""); }}
        placeholder={"one@example.com\ntwo@example.com"}
        className="focus-ring mt-2 min-h-36 w-full rounded-md border border-border p-3 text-sm disabled:opacity-60" />
      {error ? <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
      <p className="mt-3 text-sm text-muted-foreground">No emails are sent until you finish onboarding.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={pending} onClick={close} className="focus-ring ac-button ac-button--secondary">Cancel</button>
        <button type="button" disabled={pending} onClick={validate} className="focus-ring ac-button ac-button--primary disabled:opacity-60">{pending ? "Checking emails…" : "Add invitations"}</button>
      </div>
    </dialog>
  </>;
}
