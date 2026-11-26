import Link from "next/link";
import { homeFaqs } from "@/lib/home-seo";

const guides = [
  { href: "/search", title: "Search listings", text: "Sober living and continued care by city, state, or program name." },
  { href: "/for-case-managers", title: "For case managers", text: "How discharge planners and social workers search and send referrals." },
  { href: "/for-providers", title: "For providers", text: "How a sober living or continued care program publishes its listing." },
  { href: "/about", title: "About Aftercare Compass", text: "Why the platform exists and how listings stay current." }
];

export function HomeAnswerSection() {
  return (
    <section className="border-t border-border bg-white" aria-labelledby="what-aftercare-compass-is">
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Aftercare Compass</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b]" id="what-aftercare-compass-is">
            A directory for sober living and continued care after treatment
          </h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
            <p>
              Aftercare Compass is the place to look when someone is leaving treatment and needs a next step: a sober living home, also called recovery housing, or a continued care program such as intensive outpatient, partial hospitalization, outpatient, or medication-assisted treatment.
            </p>
            <p>
              Case managers, social workers, and discharge planners search published listings and see the availability each program has posted. Programs publish and update their own profiles. Aftercare Compass does not provide treatment and does not reserve beds.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.href}>
                <Link className="focus-ring block rounded-2xl border border-border p-4 hover:border-primary/40" href={guide.href}>
                  <span className="block text-base font-semibold text-[#17212b]">{guide.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{guide.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div id="faq">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#17212b]">Questions people ask</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {homeFaqs.map((item) => (
              <details className="p-5" key={item.question}>
                <summary className="focus-ring cursor-pointer list-none rounded-md text-base font-semibold text-[#17212b]">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
