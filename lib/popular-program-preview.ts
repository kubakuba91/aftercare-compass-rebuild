import type { TrendingHome } from "@/components/public/trending-homes";

// Fictional listings for local design review without database credentials.
export const popularProgramPreview: TrendingHome[] = [
  {
    id: "preview-home", slug: "preview-home", programName: "Maple House Recovery", programType: "sober_living",
    location: "Lancaster, PA", photoUrl: "/images/profile-placeholders/sober-living.jpg",
    photoAlt: "Illustration of a sober living home", photoFocalX: 50, photoFocalY: 50,
    photoPresentationMode: "photo", priceAmount: "$185", tags: ["Level II", "Self-pay", "MAT accepted"],
    availabilityLabel: "2 beds open", isAvailable: true, phone: ""
  },
  {
    id: "preview-care", slug: "preview-care", programName: "Willow Continued Care", programType: "continued_care",
    location: "Lancaster, PA", photoUrl: "/images/profile-placeholders/continued-care.jpg",
    photoAlt: "Illustration of a continued care program interior", photoFocalX: 50, photoFocalY: 50,
    photoPresentationMode: "photo", priceAmount: null, tags: ["Medicaid", "MAT accepted"],
    availabilityLabel: "Accepting patients", isAvailable: true, phone: ""
  },
  {
    id: "preview-residence", slug: "preview-residence", programName: "Oak Street Residence", programType: "sober_living",
    location: "York, PA", photoUrl: "/images/profile-placeholders/sober-living.jpg",
    photoAlt: "Illustration of a sober living home", photoFocalX: 50, photoFocalY: 50,
    photoPresentationMode: "photo", priceAmount: "$210", tags: ["Level III", "Self-pay"],
    availabilityLabel: "Call for availability", isAvailable: false, phone: ""
  }
];
