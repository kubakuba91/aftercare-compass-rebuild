import { Play } from "lucide-react";

export function MarketingVideoCard({
  caption,
  eyebrow,
  title,
  videoUrl
}: {
  caption: string;
  eyebrow: string;
  title: string;
  videoUrl?: string;
}) {
  return (
    <figure>
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-[#cddcf4] bg-[#10195e] shadow-[0_24px_70px_rgba(23,33,43,0.18)]">
        {videoUrl ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            referrerPolicy="strict-origin-when-cross-origin"
            src={videoUrl}
            title={title}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden px-8 text-center text-white">
            <div className="absolute -left-12 -top-16 size-64 rounded-full border border-white/15" aria-hidden="true" />
            <div className="absolute -bottom-24 -right-10 size-80 rounded-full border border-white/15" aria-hidden="true" />
            <div className="relative">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-[#10195e] shadow-xl">
                <Play aria-hidden="true" className="ml-1" fill="currentColor" size={30} />
              </div>
              <p className="mt-6 text-xl font-semibold">{eyebrow}</p>
              <p className="mt-2 text-sm text-white/70">Explainer video</p>
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
