import { Building2, CircleHelp, Landmark, MapPin, PiggyBank, ShieldCheck } from "lucide-react";
import type { StateResource } from "@/lib/recovery-housing/types";
import { ResourceLinkCard } from "./resource-link-card";

function SubHeading({ icon: Icon, children }: { icon: typeof Building2; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold text-[#17212b]">
      <Icon aria-hidden="true" className="text-primary" size={20} />
      {children}
    </h3>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs font-medium text-muted-foreground">Source: {children}</span>;
}

export function StateResourceSection({ state }: { state: StateResource }) {
  return (
    <article aria-labelledby={`state-${state.code}-heading`} className="mt-10 rounded-[1.5rem] border border-border bg-white p-6 sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{state.oversightLabel}</p>
      <h3 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b]" id={`state-${state.code}-heading`}>
        {state.name}
      </h3>
      <p className="mt-3 text-base text-muted-foreground">
        <span className="font-semibold text-[#17212b]">Oversight: </span>
        {state.body.href ? (
          <a className="focus-ring font-semibold text-primary underline-offset-4 hover:underline" href={state.body.href} rel="noopener noreferrer" target="_blank">
            {state.body.name}
          </a>
        ) : (
          state.body.name
        )}
      </p>

      <div className="mt-6 space-y-4 text-base leading-7 text-muted-foreground">
        {state.summary.map((item) => (
          <p key={item.text}>
            {item.text}
            <Source>{item.source}</Source>
          </p>
        ))}
      </div>

      {state.steps?.length ? (
        <section className="mt-10">
          <SubHeading icon={Landmark}>Basic steps</SubHeading>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {state.steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl border border-border bg-[#f4f8ff] p-4 text-sm leading-6 text-[#17212b]">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#10195e] text-xs font-semibold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-10">
        <SubHeading icon={Building2}>Official links</SubHeading>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {state.links.map((link) => (
            <ResourceLinkCard key={link.href} link={link} />
          ))}
        </div>
      </section>

      {state.local ? (
        <section className="mt-10">
          <SubHeading icon={MapPin}>{state.local.label}</SubHeading>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{state.local.description}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {state.local.links.map((link) => (
              <ResourceLinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>
      ) : null}

      {state.narrAffiliate ? (
        <section className="mt-10">
          <SubHeading icon={ShieldCheck}>NARR state affiliate</SubHeading>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ResourceLinkCard link={state.narrAffiliate} />
          </div>
        </section>
      ) : null}

      {state.funding?.length ? (
        <section className="mt-10">
          <SubHeading icon={PiggyBank}>Funding</SubHeading>
          <div className="mt-3 max-w-3xl space-y-4 text-base leading-7 text-muted-foreground">
            {state.funding.map((item) => (
              <p key={item.text}>
                {item.text}
                <Source>{item.source}</Source>
              </p>
            ))}
          </div>
          {state.fundingLinks?.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {state.fundingLinks.map((link) => (
                <ResourceLinkCard key={link.href} link={link} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {state.faq?.length ? (
        <section className="mt-10">
          <SubHeading icon={CircleHelp}>{state.name} FAQ</SubHeading>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {state.faq.map((item) => (
              <details key={item.question} className="group p-5">
                <summary className="focus-ring cursor-pointer list-none rounded-md text-base font-semibold text-[#17212b] marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                <Source>{item.source}</Source>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-4 text-sm leading-6 text-[#5b4300]">
        Rules change. Confirm current requirements with the agency above before you apply, sign a lease, or open.
      </p>
    </article>
  );
}
