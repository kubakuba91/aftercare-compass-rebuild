import type { Metadata } from "next";
import { HeartHandshake, Play, Radio, Scale, UsersRound } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { ButtonLink } from "@/components/ui/button-link";
import { dashboardAppUrl } from "@/lib/app-urls";
import { overviewVideoEmbedUrl } from "@/lib/marketing-videos";

export const metadata: Metadata = {
  title: "About Aftercare Compass",
  description:
    "Aftercare Compass is a platform closing the gap between treatment and the next step in recovery. Learn our mission and the story behind why we built it."
};

const values = [
  {
    title: "Warmth first.",
    description: "We serve clients, not patients. People, not cases.",
    icon: HeartHandshake
  },
  {
    title: "Real-time truth.",
    description: "Every listing reflects what’s actually available right now — not last month, not last year.",
    icon: Radio
  },
  {
    title: "No pay-to-rank.",
    description: "The best match wins, not the biggest ad budget. Every provider stands on the same ground.",
    icon: Scale
  },
  {
    title: "Built with, not for.",
    description: "Our roadmap comes from social workers, case managers, and providers doing the work every day.",
    icon: UsersRound
  }
];

export default function AboutPage() {
  const videoUrl = process.env.NEXT_PUBLIC_ABOUT_VIDEO_URL?.trim() || overviewVideoEmbedUrl;

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
        <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">About Aftercare Compass</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
              Every recovery has a next chapter. We help people get there.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Aftercare Compass is a real-time referral platform helping care coordinators connect people leaving treatment
              to available recovery housing, IOP, PHP, MAT, and outpatient care — closing the gap where too many fall through.
            </p>
          </div>

          <figure>
            <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-[#cddcf4] bg-[#10195e] shadow-[0_24px_70px_rgba(23,33,43,0.18)]">
              {videoUrl ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={videoUrl}
                  title="How Aftercare Compass works"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center overflow-hidden px-8 text-center text-white">
                  <div className="absolute -left-12 -top-16 size-64 rounded-full border border-white/15" aria-hidden="true" />
                  <div className="absolute -bottom-24 -right-10 size-80 rounded-full border border-white/15" aria-hidden="true" />
                  <div className="relative">
                    <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-[#10195e] shadow-xl">
                      <Play aria-hidden="true" className="ml-1" fill="currentColor" size={30} />
                    </div>
                    <p className="mt-6 text-xl font-semibold">The next step, made visible.</p>
                    <p className="mt-2 text-sm text-white/70">Aftercare Compass in 90 seconds</p>
                  </div>
                </div>
              )}
            </div>
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              See how Aftercare Compass works — 90 seconds
            </figcaption>
          </figure>
        </div>
        </section>

        <section className="shell grid gap-10 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:py-28">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Why we built it</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Our Story</h2>
        </div>
        <div className="max-w-3xl space-y-6 text-lg leading-8 text-muted-foreground">
          <p className="text-2xl font-semibold leading-9 text-[#17212b]">
            The most dangerous moment in recovery isn’t during treatment. It’s the day someone leaves.
          </p>
          <p>
            For years, we watched the same story repeat itself. A client would leave treatment ready for the next step — and
            lose that momentum on hold, on a waitlist, or in the shuffle between providers who didn’t know each other existed.
          </p>
          <p>The programs are there. The people who need them are there. What’s missing is the connection.</p>
          <p>
            Aftercare Compass exists to change that. We’re building the platform that connects care coordinators to available
            programs in real time — so no one falls through the gap between treatment and recovery.
          </p>
        </div>
        </section>

        <section className="bg-[#10195e] text-white">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8eb8ff]">Our Mission</p>
            <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              To make the handoff from treatment to aftercare seamless.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/70">
              For every client, every case manager, and every community in the country.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Our Values</h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {values.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-white/15 bg-white/[0.07] p-6">
                  <Icon aria-hidden="true" className="text-[#8eb8ff]" size={25} />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
        </section>

        <section className="shell py-20 lg:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="relative mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-[2rem] bg-[#eef5ff]">
            <div className="absolute inset-[12%] rounded-full border border-primary/15" aria-hidden="true" />
            <div className="grid size-40 place-items-center rounded-full bg-[#10195e] text-5xl font-semibold tracking-[-0.04em] text-white shadow-xl">
              MB
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Meet the Founder</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.02em] text-[#17212b]">Michael Bradley</h2>
            <p className="mt-2 font-semibold text-primary">Founder &amp; CEO, Aftercare Compass</p>
            <div className="mt-7 space-y-5 text-lg leading-8 text-muted-foreground">
              <p>
                Michael has spent his career in behavioral health — as a peer recovery coach, discharge coordinator, business
                development officer, and recovery housing leader. He also knows the system from the inside, having personally
                navigated residential treatment, IOP, and recovery housing.
              </p>
              <p>
                Aftercare Compass is what he wishes had existed the day he left treatment — and the day every client he’s ever
                placed did too.
              </p>
            </div>
          </div>
        </div>
        </section>

        <section className="border-t border-border bg-[#f4f8ff]">
        <div className="shell py-16 text-center sm:py-20">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Ready to close the gap?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Whether you refer clients or run a program, Aftercare Compass is built for you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={dashboardAppUrl("/sign-up")}>I Refer Clients</ButtonLink>
            <ButtonLink href={dashboardAppUrl("/sign-up")} variant="secondary">List Your Program</ButtonLink>
          </div>
        </div>
        </section>
      </main>
    </>
  );
}
