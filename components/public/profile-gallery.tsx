import type { ProfileImage } from "@prisma/client";
import Link from "next/link";
import { Images } from "lucide-react";
import { AdaptiveProfileImage } from "@/components/public/adaptive-profile-image";
import { profilePlaceholderAlt, profilePlaceholderImage } from "@/lib/public-profile-placeholder";

type GalleryProfile = { slug: string; programName: string; type: string; images: ProfileImage[] };

export function ProfileGallery({ profile, preview = false }: { profile: GalleryProfile; preview?: boolean }) {
  const images = profile.images.slice(0, 3);
  return <div className={`ac-gallery ac-gallery--${images.length > 1 ? "multiple" : "single"}`}>
    {images.length ? images.map((image, index) => <div className="ac-gallery-image" key={image.id}>
      <AdaptiveProfileImage alt={image.altText || profile.programName} focalX={image.focalX} focalY={image.focalY}
        mode={image.presentationMode} priority={index === 0} sizes={index === 0 ? "(min-width: 768px) 900px, 100vw" : "(min-width: 768px) 450px, 50vw"} src={image.url} />
    </div>) : <div className="ac-gallery-image">
      <AdaptiveProfileImage alt={profilePlaceholderAlt(profile.type)} priority sizes="100vw" src={profilePlaceholderImage(profile.type)} />
    </div>}
    {images.length > 0 ? <Link className="ac-gallery-all ac-button ac-button--secondary focus-ring" href={`/profiles/${profile.slug}/photos${preview ? "?preview=1" : ""}`}>
      <Images aria-hidden="true" size={18} />View all photos ({profile.images.length})
    </Link> : null}
  </div>;
}
