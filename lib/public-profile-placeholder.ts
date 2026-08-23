const continuedCarePlaceholder = "/images/profile-placeholders/continued-care.jpg";
const soberLivingPlaceholder = "/images/profile-placeholders/sober-living.jpg";

export function profilePlaceholderImage(type: string) {
  return type === "continued_care" ? continuedCarePlaceholder : soberLivingPlaceholder;
}

export function profilePlaceholderAlt(type: string) {
  return type === "continued_care"
    ? "Illustration of a continued care program interior"
    : "Illustration of a sober living home";
}
