"use client";

import { useRef, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2, X } from "lucide-react";

export function ShareProfileButton({ slug, programName }: { slug: string; programName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const encodedUrl = encodeURIComponent(url);
  const message = encodeURIComponent(`${programName}: ${url}`);
  const optionClass = "focus-ring flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:bg-surface-secondary";

  function close() {
    dialog.current?.close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied!");
    } catch {
      setStatus("Could not copy automatically. Select and copy the link below.");
    }
  }

  return (
    <>
      <button
        aria-label={`Share ${programName}`}
        aria-haspopup="dialog"
        className="focus-ring flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white transition hover:bg-surface-secondary"
        onClick={() => {
          setUrl(new URL(`/profiles/${encodeURIComponent(slug)}`, window.location.origin).href);
          setStatus("");
          dialog.current?.showModal();
        }}
        ref={trigger}
        title="Share profile"
        type="button"
      >
        <Share2 aria-hidden="true" size={18} />
      </button>
      <dialog
        aria-labelledby="share-profile-title"
        aria-describedby="share-profile-description"
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-6 text-foreground shadow-xl"
        onClick={event => { if (event.target === event.currentTarget) close(); }}
        onClose={() => trigger.current?.focus()}
        ref={dialog}
      >
        <button aria-label="Close share popup" className="focus-ring absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border" onClick={close} type="button">
          <X aria-hidden="true" size={18} />
        </button>
        <h2 className="pr-10 text-2xl font-semibold" id="share-profile-title">Share profile</h2>
        <p className="mt-2 text-sm text-muted-foreground" id="share-profile-description">Share {programName} with someone.</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button className={optionClass} onClick={copyLink} type="button">
            {status === "Link copied!" ? <Check aria-hidden="true" size={20} /> : <Copy aria-hidden="true" size={20} />}Copy link
          </button>
          <a className={optionClass} href={`sms:?body=${message}`}><MessageCircle aria-hidden="true" size={20} />Text message</a>
          <a className={optionClass} href={`mailto:?subject=${encodeURIComponent(programName)}&body=${message}`}><Mail aria-hidden="true" size={20} />Email</a>
          <a className={optionClass} href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} rel="noopener noreferrer" target="_blank"><Share2 aria-hidden="true" size={20} />Facebook</a>
          <a className={optionClass} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} rel="noopener noreferrer" target="_blank"><Share2 aria-hidden="true" size={20} />LinkedIn</a>
          <a className={optionClass} href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(programName)}&url=${encodedUrl}`} rel="noopener noreferrer" target="_blank"><Share2 aria-hidden="true" size={20} />X</a>
        </div>
        <label className="mt-5 block text-sm font-medium" htmlFor="share-profile-link">Profile link</label>
        <input className="focus-ring mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 text-sm" id="share-profile-link" onFocus={event => event.currentTarget.select()} readOnly value={url} />
        <p aria-live="polite" className="mt-3 text-sm" role="status">{status}</p>
      </dialog>
    </>
  );
}
