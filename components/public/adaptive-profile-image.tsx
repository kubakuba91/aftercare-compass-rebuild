import Image from "next/image";
import { cn } from "@/lib/utils";

export type ProfileImagePresentationMode = "auto" | "photo" | "graphic";

type AdaptiveProfileImageProps = {
  alt: string;
  className?: string;
  focalX?: number;
  focalY?: number;
  mode?: string;
  priority?: boolean;
  sizes: string;
  src: string;
};

function boundedPercent(value: number | undefined) {
  return Math.min(100, Math.max(0, value ?? 50));
}

export function AdaptiveProfileImage({
  alt,
  className,
  focalX,
  focalY,
  mode = "auto",
  priority = false,
  sizes,
  src
}: AdaptiveProfileImageProps) {
  const objectPosition = `${boundedPercent(focalX)}% ${boundedPercent(focalY)}%`;

  if (mode === "photo") {
    return (
      <Image
        alt={alt}
        className={cn("object-cover", className)}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        style={{ objectPosition }}
        unoptimized
      />
    );
  }

  if (mode === "graphic") {
    return (
      <div className="absolute inset-0 bg-slate-950">
        <Image
          alt={alt}
          className={cn("object-contain p-3", className)}
          fill
          priority={priority}
          sizes={sizes}
          src={src}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      <Image
        alt=""
        aria-hidden="true"
        className="scale-110 object-cover opacity-60 blur-2xl"
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
      <Image
        alt={alt}
        className={cn("object-contain", className)}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized
      />
    </div>
  );
}
