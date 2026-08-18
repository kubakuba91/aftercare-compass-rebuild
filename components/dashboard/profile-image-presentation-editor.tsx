"use client";

import { useState } from "react";
import { Crosshair, Save } from "lucide-react";
import {
  AdaptiveProfileImage,
  type ProfileImagePresentationMode
} from "@/components/public/adaptive-profile-image";

type ProfileImagePresentationEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  alt: string;
  focalX: number;
  focalY: number;
  imageId: string;
  mode: string;
  profileId: string;
  src: string;
};

const presentationOptions: Array<{
  description: string;
  label: string;
  value: ProfileImagePresentationMode;
}> = [
  {
    value: "auto",
    label: "Automatic fit",
    description: "Shows the complete image over a softly blurred backdrop."
  },
  {
    value: "photo",
    label: "Photo crop",
    description: "Fills the frame and keeps your selected focal point visible."
  },
  {
    value: "graphic",
    label: "Logo or graphic",
    description: "Shows the complete image on a clean solid background."
  }
];

function validMode(value: string): ProfileImagePresentationMode {
  return value === "auto" || value === "graphic" ? value : "photo";
}

export function ProfileImagePresentationEditor({
  action,
  alt,
  focalX: initialFocalX,
  focalY: initialFocalY,
  imageId,
  mode: initialMode,
  profileId,
  src
}: ProfileImagePresentationEditorProps) {
  const [mode, setMode] = useState<ProfileImagePresentationMode>(() => validMode(initialMode));
  const [focalX, setFocalX] = useState(initialFocalX);
  const [focalY, setFocalY] = useState(initialFocalY);

  function selectFocalPoint(event: React.PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setFocalX(Math.round(((event.clientX - bounds.left) / bounds.width) * 100));
    setFocalY(Math.round(((event.clientY - bounds.top) / bounds.height) * 100));
  }

  const selectedOption = presentationOptions.find((option) => option.value === mode) ?? presentationOptions[0];

  return (
    <form action={action}>
      <input name="profileId" type="hidden" value={profileId} />
      <input name="imageId" type="hidden" value={imageId} />
      <input name="focalX" type="hidden" value={focalX} />
      <input name="focalY" type="hidden" value={focalY} />

      <div className="relative aspect-[4/3] bg-muted">
        <AdaptiveProfileImage
          alt={alt}
          focalX={focalX}
          focalY={focalY}
          mode={mode}
          sizes="(min-width: 1024px) 320px, 100vw"
          src={src}
        />
        {mode === "photo" ? (
          <button
            aria-label="Choose image focal point"
            className="focus-ring absolute inset-0 cursor-crosshair"
            onPointerDown={selectFocalPoint}
            type="button"
          >
            <span
              aria-hidden="true"
              className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/55 text-white shadow-lg"
              style={{ left: `${focalX}%`, top: `${focalY}%` }}
            >
              <Crosshair size={17} />
            </span>
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-border p-3">
        <label className="grid gap-1 text-sm font-semibold">
          Image fit
          <select
            className="focus-ring min-h-10 rounded-md border border-border bg-white px-3 text-sm"
            name="presentationMode"
            onChange={(event) => setMode(validMode(event.target.value))}
            value={mode}
          >
            {presentationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <p className="text-xs leading-5 text-muted-foreground">{selectedOption.description}</p>
        {mode === "photo" ? (
          <p className="text-xs font-semibold text-muted-foreground">
            Click the most important part of the photo to set its focal point.
          </p>
        ) : null}
        <button className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          <Save size={15} />
          Save image fit
        </button>
      </div>
    </form>
  );
}
