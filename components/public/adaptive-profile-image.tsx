"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

type ImageBounds = {
  height: number;
  width: number;
};

function AutomaticEdgeFill({
  alt,
  className,
  priority,
  sizes,
  src
}: Pick<AdaptiveProfileImageProps, "alt" | "className" | "priority" | "sizes" | "src">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<ImageBounds>({ height: 0, width: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState(0);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateBounds = () => {
      setBounds({ height: container.clientHeight, width: container.clientWidth });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const containerAspectRatio = bounds.height ? bounds.width / bounds.height : 0;
  const hasHorizontalBars = imageAspectRatio > containerAspectRatio;
  const renderedHeight = imageAspectRatio ? bounds.width / imageAspectRatio : 0;
  const renderedWidth = imageAspectRatio ? bounds.height * imageAspectRatio : 0;
  const gap = hasHorizontalBars
    ? Math.max((bounds.height - renderedHeight) / 2, 0)
    : Math.max((bounds.width - renderedWidth) / 2, 0);
  const sampleSize = 8;
  const backgroundImage = `url(${JSON.stringify(src)})`;
  const sharedEdgeStyle = {
    backgroundImage,
    backgroundRepeat: "no-repeat",
    filter: "blur(6px) saturate(1.2)"
  } as const;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-slate-100">
      {gap > 0 && bounds.width > 0 && bounds.height > 0 ? (
        hasHorizontalBars ? (
          <>
            <div
              aria-hidden="true"
              className="absolute left-0 right-0"
              style={{
                ...sharedEdgeStyle,
                backgroundPosition: "center top",
                backgroundSize: `${bounds.width}px ${renderedHeight}px`,
                height: sampleSize,
                top: gap - sampleSize,
                transform: `scaleY(${Math.max(gap / sampleSize, 1)})`,
                transformOrigin: "center bottom"
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-0 right-0"
              style={{
                ...sharedEdgeStyle,
                backgroundPosition: "center bottom",
                backgroundSize: `${bounds.width}px ${renderedHeight}px`,
                height: sampleSize,
                top: bounds.height - gap,
                transform: `scaleY(${Math.max(gap / sampleSize, 1)})`,
                transformOrigin: "center top"
              }}
            />
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute bottom-0 top-0"
              style={{
                ...sharedEdgeStyle,
                backgroundPosition: "left center",
                backgroundSize: `${renderedWidth}px ${bounds.height}px`,
                left: gap - sampleSize,
                transform: `scaleX(${Math.max(gap / sampleSize, 1)})`,
                transformOrigin: "right center",
                width: sampleSize
              }}
            />
            <div
              aria-hidden="true"
              className="absolute bottom-0 top-0"
              style={{
                ...sharedEdgeStyle,
                backgroundPosition: "right center",
                backgroundSize: `${renderedWidth}px ${bounds.height}px`,
                left: bounds.width - gap,
                transform: `scaleX(${Math.max(gap / sampleSize, 1)})`,
                transformOrigin: "left center",
                width: sampleSize
              }}
            />
          </>
        )
      ) : null}
      <Image
        alt={alt}
        className={cn("object-contain", className)}
        fill
        onLoad={(event) => {
          const image = event.currentTarget;
          setImageAspectRatio(image.naturalWidth / image.naturalHeight);
        }}
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized
      />
    </div>
  );
}

export function AdaptiveProfileImage({
  alt,
  className,
  focalX,
  focalY,
  mode = "photo",
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
    <AutomaticEdgeFill
      alt={alt}
      className={className}
      priority={priority}
      sizes={sizes}
      src={src}
    />
  );
}
