import {
  OrganizationType,
  PrismaClient,
  ProfileStatus,
  ProfileType,
  SubscriptionStatus
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "seed-aftercare-org" },
    update: {},
    create: {
      id: "seed-aftercare-org",
      type: OrganizationType.aftercare_sober_living,
      name: "Harbor House Recovery",
      phone: "555-0100",
      email: "admissions@example.com",
      website: "https://example.com",
      subscriptionPlan: "verified",
      subscriptionStatus: SubscriptionStatus.active
    }
  });

  await prisma.aftercareProfile.upsert({
    where: { slug: "harbor-house-recovery" },
    update: {},
    create: {
      orgId: org.id,
      type: ProfileType.sober_living,
      programName: "Harbor House Recovery",
      slug: "harbor-house-recovery",
      status: ProfileStatus.published,
      verificationTier: 1,
      streetAddress: "Private",
      city: "Philadelphia",
      state: "PA",
      zip: "19103",
      publicCity: "Philadelphia",
      publicState: "PA",
      admissionsContactPhone: "555-0100",
      admissionsContactEmail: "admissions@example.com",
      populationServed: "both",
      populationServedOptions: ["Men", "Women"],
      totalBeds: 12,
      bedsMen: 6,
      bedsWomen: 6,
      bedsLgbtq: 0,
      bedsMenAvailable: 2,
      bedsWomenAvailable: 2,
      bedsLgbtqAvailable: 0,
      bedsAvailable: 4,
      bedsAvailableUpdatedAt: new Date(),
      insuranceAccepted: ["Private Pay / Self-Pay"],
      supportServices: ["Peer Support Specialist", "Life Skills Training"],
      amenities: ["High-Speed WiFi", "Public Transportation Access"],
      description: "Seed profile for local marketplace testing.",
      publishedAt: new Date()
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
