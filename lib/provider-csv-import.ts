import {
  OrganizationType,
  Prisma,
  ProfileOwnershipStatus,
  ProfileStatus,
  ProfileType
} from "@prisma/client";
import { normalizePhoneForStorage } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";

export const providerCsvHeaders = [
  "org_id",
  "organization_name",
  "program_name",
  "address",
  "city",
  "state",
  "zip",
  "phone",
  "level_of_care",
  "insurance_accepted",
  "website",
  "hours",
  "capacity/bed_count",
  "licensure_id",
  "contact_name",
  "contact_email",
  "photos_url",
  "description"
] as const;

const requiredHeaders = providerCsvHeaders.filter((header) => ![
  "org_id",
  "website",
  "hours",
  "capacity/bed_count",
  "licensure_id",
  "contact_name",
  "contact_email",
  "photos_url",
  "description"
].includes(header));

type CsvRecord = Record<string, string>;

export type NormalizedProviderImportRow = {
  orgId: string | null;
  organizationName: string;
  programName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  profileType: ProfileType;
  levelOfCare: string[];
  insuranceAccepted: string[];
  website: string | null;
  hours: string | null;
  bedCount: number | null;
  licensureId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  photoUrls: string[];
  description: string | null;
  importMatchKey: string;
};

type PreviewRow = {
  rowNumber: number;
  rawData: CsvRecord;
  normalizedData: NormalizedProviderImportRow | null;
  previewAction: "create" | "update" | "reject";
  errorReasons: string[];
  organizationId: string | null;
  profileId: string | null;
};

function clean(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function keyPart(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function providerImportMatchKey(organizationName: string, address: string) {
  return `${keyPart(organizationName)}|${keyPart(address)}`;
}

function splitList(value: string) {
  return value.split(/[;|]/).map(clean).filter(Boolean);
}

function inferProfileType(levelOfCare: string) {
  const normalized = keyPart(levelOfCare);
  return /sober living|recovery residence|level (i|ii|iii|iv|1|2|3|4)\b/.test(normalized)
    ? ProfileType.sober_living
    : ProfileType.continued_care;
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((values) => values.some((value) => clean(value)));
}

function csvRecords(text: string) {
  const parsed = parseCsv(text.replace(/^\uFEFF/, ""));
  if (parsed.length < 2) throw new Error("The CSV must include a header and at least one data row.");

  const headers = parsed[0].map((header) => clean(header).toLowerCase());
  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) throw new Error(`Duplicate CSV header: ${duplicateHeader}.`);

  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Missing required CSV columns: ${missingHeaders.join(", ")}.`);

  return parsed.slice(1).map((values, index) => {
    if (values.length > headers.length) {
      throw new Error(`CSV row ${index + 2} has more columns than the header row.`);
    }
    return {
      rowNumber: index + 2,
      record: Object.fromEntries(headers.map((header, column) => [header, clean(values[column])]))
    };
  });
}

function normalizeRow(record: CsvRecord) {
  const errors: string[] = [];
  const requiredValues: Array<[string, string]> = [
    ["organization_name", record.organization_name],
    ["program_name", record.program_name],
    ["address", record.address],
    ["city", record.city],
    ["state", record.state],
    ["zip", record.zip],
    ["phone", record.phone],
    ["level_of_care", record.level_of_care],
    ["insurance_accepted", record.insurance_accepted]
  ];
  for (const [field, value] of requiredValues) {
    if (!clean(value)) errors.push(`${field} is required.`);
  }

  const lengthLimits: Array<[string, string, number]> = [
    ["organization_name", record.organization_name, 200],
    ["program_name", record.program_name, 200],
    ["address", record.address, 300],
    ["city", record.city, 100],
    ["state", record.state, 2],
    ["zip", record.zip, 10],
    ["phone", record.phone, 40],
    ["level_of_care", record.level_of_care, 1000],
    ["insurance_accepted", record.insurance_accepted, 1000],
    ["description", record.description, 10000]
  ];
  for (const [field, value, limit] of lengthLimits) {
    if (clean(value).length > limit) errors.push(`${field} must be ${limit} characters or fewer.`);
  }

  const state = clean(record.state).toUpperCase();
  if (state && !/^[A-Z]{2}$/.test(state)) errors.push("state must be a two-letter abbreviation.");
  if (record.zip && !/^\d{5}(?:-\d{4})?$/.test(record.zip)) errors.push("zip must be a 5-digit or ZIP+4 code.");
  const phone = normalizePhoneForStorage(record.phone);
  if (record.phone && !phone) errors.push("phone must be a valid phone number.");
  if (record.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contact_email)) {
    errors.push("contact_email must be a valid email address.");
  }
  if (record.website && !isUrl(record.website)) errors.push("website must be an http(s) URL.");

  const photoUrls = splitList(record.photos_url || "");
  if (photoUrls.some((url) => !isUrl(url))) errors.push("photos_url must contain http(s) URLs separated by semicolons.");

  const bedValue = clean(record["capacity/bed_count"]);
  const bedCount = bedValue ? Number(bedValue) : null;
  if (bedValue && (!Number.isInteger(bedCount) || Number(bedCount) < 0)) {
    errors.push("capacity/bed_count must be a non-negative whole number.");
  }

  const organizationName = clean(record.organization_name);
  const address = clean(record.address);
  const levelOfCare = splitList(record.level_of_care || "");
  const insuranceAccepted = splitList(record.insurance_accepted || "");
  if (record.level_of_care && !levelOfCare.length) errors.push("level_of_care must contain at least one value.");
  if (record.insurance_accepted && !insuranceAccepted.length) errors.push("insurance_accepted must contain at least one value.");

  const normalized: NormalizedProviderImportRow = {
    orgId: clean(record.org_id) || null,
    organizationName,
    programName: clean(record.program_name),
    address,
    city: clean(record.city),
    state,
    zip: clean(record.zip),
    phone: phone || "",
    profileType: inferProfileType(record.level_of_care || ""),
    levelOfCare,
    insuranceAccepted,
    website: clean(record.website) || null,
    hours: clean(record.hours) || null,
    bedCount: Number.isInteger(bedCount) ? bedCount : null,
    licensureId: clean(record.licensure_id) || null,
    contactName: clean(record.contact_name) || null,
    contactEmail: clean(record.contact_email).toLowerCase() || null,
    photoUrls,
    description: sanitizeRichText(record.description) || null,
    importMatchKey: providerImportMatchKey(organizationName, address)
  };

  return { normalized, errors };
}

function orgTypeForProfile(type: ProfileType) {
  return type === ProfileType.sober_living
    ? OrganizationType.aftercare_sober_living
    : OrganizationType.aftercare_continued_care;
}

export async function validateProviderCsv(text: string): Promise<PreviewRow[]> {
  const sourceRows = csvRecords(text);
  if (sourceRows.length > 5000) throw new Error("A single import can contain at most 5,000 data rows.");

  const [organizations, profiles] = await Promise.all([
    prisma.organization.findMany({ select: { id: true, name: true, type: true } }),
    prisma.aftercareProfile.findMany({
      select: { id: true, orgId: true, streetAddress: true, importMatchKey: true, organization: { select: { name: true } } }
    })
  ]);
  const organizationsById = new Map(organizations.map((org) => [org.id, org]));
  const organizationsByName = new Map<string, typeof organizations>();
  for (const org of organizations) {
    const key = keyPart(org.name);
    organizationsByName.set(key, [...(organizationsByName.get(key) || []), org]);
  }

  const profilesByKey = new Map<string, typeof profiles>();
  for (const profile of profiles) {
    const key = profile.importMatchKey || providerImportMatchKey(profile.organization.name, profile.streetAddress || "");
    profilesByKey.set(key, [...(profilesByKey.get(key) || []), profile]);
  }

  const seenKeys = new Set<string>();
  const rows: PreviewRow[] = sourceRows.map(({ rowNumber, record }) => {
    const { normalized, errors } = normalizeRow(record);
    let organizationId: string | null = null;
    let profileId: string | null = null;

    if (normalized.orgId) {
      const org = organizationsById.get(normalized.orgId);
      if (!org) errors.push(`org_id ${normalized.orgId} was not found.`);
      else if (keyPart(org.name) !== keyPart(normalized.organizationName)) errors.push("org_id does not match organization_name.");
      else organizationId = org.id;
    } else {
      const orgMatches = organizationsByName.get(keyPart(normalized.organizationName)) || [];
      if (orgMatches.length > 1) errors.push("organization_name matches multiple existing organizations; provide org_id.");
      else organizationId = orgMatches[0]?.id || null;
    }

    const organization = organizationId ? organizationsById.get(organizationId) : null;
    if (organization && organization.type !== orgTypeForProfile(normalized.profileType)) {
      errors.push("level_of_care conflicts with the existing organization type.");
    }

    const profileMatches = profilesByKey.get(normalized.importMatchKey) || [];
    if (profileMatches.length > 1) errors.push("organization_name + address matches multiple existing locations.");
    else if (profileMatches.length === 1) {
      profileId = profileMatches[0].id;
      organizationId = profileMatches[0].orgId;
    }

    if (seenKeys.has(normalized.importMatchKey)) errors.push("Duplicate organization_name + address in this CSV.");
    seenKeys.add(normalized.importMatchKey);

    return {
      rowNumber,
      rawData: record,
      normalizedData: errors.length ? null : normalized,
      previewAction: errors.length ? "reject" : profileId ? "update" : "create",
      errorReasons: errors,
      organizationId,
      profileId
    };
  });

  const typesByOrganization = new Map<string, Set<ProfileType>>();
  for (const row of rows) {
    const normalized = normalizeRow(row.rawData).normalized;
    const key = normalized.orgId || keyPart(normalized.organizationName);
    const types = typesByOrganization.get(key) || new Set<ProfileType>();
    types.add(normalized.profileType);
    typesByOrganization.set(key, types);
  }
  for (const row of rows) {
    const normalized = normalizeRow(row.rawData).normalized;
    const key = normalized.orgId || keyPart(normalized.organizationName);
    if ((typesByOrganization.get(key)?.size || 0) > 1) {
      row.errorReasons.push("One organization cannot mix sober-living and continued-care rows in the current account model.");
      row.normalizedData = null;
      row.previewAction = "reject";
    }
  }

  return rows;
}

async function uniqueSlug(tx: Prisma.TransactionClient, programName: string) {
  const base = slugify(programName) || "aftercare-profile";
  let slug = base;
  let suffix = 2;
  while (await tx.aftercareProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function commitProviderImportRow(input: {
  actorUserId: string;
  rowId: string;
  normalized: NormalizedProviderImportRow;
  organizationId: string | null;
  profileId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    let organization = input.organizationId
      ? await tx.organization.findUnique({ where: { id: input.organizationId } })
      : await tx.organization.findFirst({
          where: { name: { equals: input.normalized.organizationName, mode: Prisma.QueryMode.insensitive } }
        });

    if (!organization) {
      organization = await tx.organization.create({
        data: {
          name: input.normalized.organizationName,
          type: orgTypeForProfile(input.normalized.profileType),
          phone: input.normalized.phone,
          email: input.normalized.contactEmail,
          website: input.normalized.website
        }
      });
    }

    const profileData = {
      orgId: organization.id,
      programName: input.normalized.programName,
      type: input.normalized.profileType,
      importMatchKey: input.normalized.importMatchKey,
      streetAddress: input.normalized.address,
      city: input.normalized.city,
      state: input.normalized.state,
      zip: input.normalized.zip,
      publicCity: input.normalized.city,
      publicState: input.normalized.state,
      admissionsContactPhone: input.normalized.phone,
      admissionsContactEmail: input.normalized.contactEmail,
      intakeContactName: input.normalized.contactName,
      websiteUrl: input.normalized.website,
      hoursOfOperation: input.normalized.hours,
      totalBeds: input.normalized.bedCount,
      stateLicenseNumber: input.normalized.licensureId,
      levelsOfCare: input.normalized.profileType === ProfileType.continued_care ? input.normalized.levelOfCare : [],
      recoveryResidenceLevel: input.normalized.profileType === ProfileType.sober_living ? input.normalized.levelOfCare.join(", ") : null,
      insuranceAccepted: input.normalized.insuranceAccepted,
      description: input.normalized.description
    };

    let profile;
    if (input.profileId) {
      profile = await tx.aftercareProfile.update({ where: { id: input.profileId }, data: profileData });
    } else {
      profile = await tx.aftercareProfile.create({
        data: {
          ...profileData,
          slug: await uniqueSlug(tx, input.normalized.programName),
          status: ProfileStatus.published,
          publishedAt: new Date(),
          ownershipStatus: ProfileOwnershipStatus.unclaimed,
          verificationTier: 1,
          seededByUserId: input.actorUserId,
          onboardingCompletedAt: new Date()
        }
      });
    }

    await tx.profileImage.deleteMany({
      where: { profileId: profile.id, storagePath: { startsWith: "external:" } }
    });
    if (input.normalized.photoUrls.length) {
      await tx.profileImage.createMany({
        data: input.normalized.photoUrls.map((url, index) => ({
          profileId: profile.id,
          url,
          storagePath: `external:${url}`,
          altText: input.normalized.programName,
          sortOrder: index,
          isCover: index === 0
        }))
      });
    }

    await tx.providerImportRow.update({
      where: { id: input.rowId },
      data: {
        status: "committed",
        previewAction: input.profileId ? "updated" : "created",
        organizationId: organization.id,
        profileId: profile.id,
        resultMessage: input.profileId ? "Existing location updated." : "New location created."
      }
    });
    return profile;
  });
}

function quoteCsv(value: unknown) {
  const raw = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToResultsCsv(rows: Array<{
  rowNumber: number;
  previewAction: string;
  status: string;
  errorReasons: string[];
  resultMessage: string | null;
  rawData: Prisma.JsonValue;
}>) {
  const headers = ["row_number", "result", "status", "errors", "message", ...providerCsvHeaders];
  return [
    headers.map(quoteCsv).join(","),
    ...rows.map((row) => {
      const raw = row.rawData && typeof row.rawData === "object" && !Array.isArray(row.rawData)
        ? row.rawData as Record<string, unknown>
        : {};
      return [row.rowNumber, row.previewAction, row.status, row.errorReasons, row.resultMessage, ...providerCsvHeaders.map((header) => raw[header])]
        .map(quoteCsv).join(",");
    })
  ].join("\r\n");
}

export function providerTemplateCsv() {
  const example = [
    "",
    "Example Recovery Network",
    "Example Recovery Residence - Downtown",
    "123 Main Street",
    "Reading",
    "PA",
    "19601",
    "(610) 555-0100",
    "Recovery Residence Level III",
    "Private Pay; Medicaid",
    "https://example.org",
    "Mon-Fri 8am-6pm",
    "24",
    "PA-EXAMPLE-123",
    "Jordan Lee",
    "jordan@example.org",
    "https://example.org/photo.jpg",
    "Structured recovery housing with peer support."
  ];
  return `${providerCsvHeaders.map(quoteCsv).join(",")}\r\n${example.map(quoteCsv).join(",")}\r\n`;
}
