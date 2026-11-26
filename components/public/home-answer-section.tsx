import { homeFaqs } from "@/lib/home-seo";

export function HomeAnswerSection() {
  return (
    <section className="bg-white" aria-labelledby="what-aftercare-compass-is">
      <div className="shell grid gap-16 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17212b] sm:text-4xl" id="what-aftercare-compass-is">
            A directory for the step after treatment
          </h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-[#3d4a57]">
            <p>
              Aftercare Compass is where a case manager, social worker, or discharge planner looks for a sober living home, also called recovery housing, or a continued care program such as intensive outpatient, partial hospitalization, outpatient, or medication-assisted treatment.
            </p>
            <p>
              Programs publish and update their own listings. Aftercare Compass does not provide treatment and does not reserve beds.
            </p>
          </div>
        </div>
        <div id="faq">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#10195e]">Questions</h2>
          <div className="mt-4 divide-y divide-border border-t border-border">
            {homeFaqs.map((item) => (
              <details className="group py-4" key={item.question}>
                <summary className="focus-ring cursor-pointer list-none rounded-md text-base font-semibold text-[#17212b]">{item.question}</summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5c6b7a]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
