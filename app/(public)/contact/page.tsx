import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { MarketingHeader } from "@/components/marketing-header";

export const metadata: Metadata = {
  title: "Contact Us | Aftercare Compass",
  description:
    "Reach the Aftercare Compass team. We respond within 1 business day. For general inquiries, partnerships, media, or support."
};

export default function ContactPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative min-h-[calc(100vh-5rem)] border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative grid items-start gap-10 py-10 sm:py-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12 lg:py-14">
            <div className="max-w-2xl lg:pt-3">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Contact Aftercare Compass</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">Let’s talk.</h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Whether you’re a provider, a referent, a partner, or just curious—we’d love to hear from you.
              </p>
            <div className="mt-8 flex items-start gap-4 rounded-2xl bg-[#f4f8ff] p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail aria-hidden="true" size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17212b]">Support &amp; questions</p>
                <a className="mt-1 block text-sm text-primary hover:underline" href="mailto:contact@aftercarecompass.com">
                  contact@aftercarecompass.com
                </a>
              </div>
            </div>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
    </>
  );
}
