"use client";

import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "We couldn’t send your message. Please try again.");
      }

      form.reset();
      setSubmissionState("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn’t send your message. Please try again.");
      setSubmissionState("error");
    }
  }

  return (
    <form className="rounded-[1.5rem] border border-border bg-white p-6 shadow-[0_20px_60px_rgba(23,33,43,0.1)] sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[#17212b]">
          Full Name
          <input autoComplete="name" name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#17212b]">
          Email
          <input autoComplete="email" name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#17212b]">
          Organization <span className="font-normal text-muted-foreground">(optional)</span>
          <input autoComplete="organization" name="organization" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#17212b]">
          Role
          <select defaultValue="" name="role" required>
            <option disabled value="">Select your role</option>
            <option>Provider</option>
            <option>Referent</option>
            <option>Partner</option>
            <option>Press</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-semibold text-[#17212b]">
        Message
        <textarea className="min-h-36 resize-y" name="message" required />
      </label>

      <label className="sr-only" aria-hidden="true">
        Company website
        <input autoComplete="off" name="companyWebsite" tabIndex={-1} />
      </label>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button className="focus-ring ac-button ac-button--primary" disabled={submissionState === "submitting"} type="submit">
          {submissionState === "submitting" ? "Sending…" : "Send Message"}
        </button>
        <p className="text-sm text-muted-foreground">We respond within 1 business day.</p>
      </div>

      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {submissionState === "success" ? <p className="font-semibold text-emerald-700">Thanks—your message has been sent.</p> : null}
        {submissionState === "error" ? <p className="font-semibold text-danger">{errorMessage}</p> : null}
      </div>
    </form>
  );
}
