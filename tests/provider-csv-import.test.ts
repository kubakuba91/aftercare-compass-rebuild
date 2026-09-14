import assert from "node:assert/strict";
import { csvRecords, normalizeRow, providerTemplateCsv, validateProviderCsv, commitProviderImportRow, virtualProviderImportMatchKey } from "../lib/provider-csv-import";
import { prisma } from "../lib/prisma";

async function main() {
  const examples = csvRecords(providerTemplateCsv());
  assert.equal(examples.length, 2);
  for (const { record } of examples) assert.deepEqual(normalizeRow(record).errors, []);
  const physical = examples[0].record;
  const virtual = examples[1].record;
  const normalized = normalizeRow(virtual).normalized;
  assert.deepEqual(normalized.statesServed, ["Pennsylvania", "Ohio", "New Jersey"]);
  assert.equal(normalizeRow({ ...virtual, states_served: "Nationwide" }).normalized.statesServed?.length, 51);
  assert.deepEqual(normalizeRow({ ...virtual, states_served: "PA; Pennsylvania; DC" }).normalized.statesServed, ["Pennsylvania", "Washington, DC"]);
  assert.equal(normalizeRow({ ...virtual, "capacity/bed_count": "not applicable" }).normalized.bedCount, null);
  for (const override of [{ states_served: "" }, { states_served: "ZZ" }, { programming_time_zone: "EST" }, { delivery_mode: "Hybrid" }, { level_of_care: "Recovery Residence Level III" }] as Record<string, string>[]) {
    assert.ok(normalizeRow({ ...virtual, ...override }).errors.length);
  }
  assert.ok(normalizeRow({ ...physical, address: "" }).errors.length);
  const legacy = Object.fromEntries(Object.entries(physical).filter(([key]) => !["delivery_mode", "states_served", "programming_time_zone", "insurance_notes"].includes(key)));
  assert.deepEqual(normalizeRow(legacy).errors, []);
  assert.equal(normalizeRow(legacy).normalized.telehealthMode, undefined);
  function csv(records: Record<string, string>[]) {
    const headers = Object.keys(records[0]);
    return [headers, ...records.map((record) => headers.map((key) => record[key] || ""))].map((row) => row.map((value) => JSON.stringify(value)).join(",")).join("\n");
  }
  let profiles: unknown[] = [];
  const organizations = [{ id: "org", name: virtual.organization_name, type: "aftercare_continued_care" }];
  Object.assign(prisma.organization, { findMany: async () => organizations });
  Object.assign(prisma.aftercareProfile, { findMany: async () => profiles });
  assert.equal((await validateProviderCsv(csv([legacy])))[0].previewAction, "create");
  let rows = await validateProviderCsv(csv([virtual, { ...virtual, program_name: "Other virtual program" }]));
  assert.deepEqual(rows.map((row) => row.previewAction), ["create", "create"]);
  rows = await validateProviderCsv(csv([virtual, virtual]));
  assert.equal(rows[1].previewAction, "reject");
  profiles = [{ id: "profile", orgId: "org", programName: virtual.program_name, type: "continued_care", telehealthMode: "Virtual only", streetAddress: null, importMatchKey: null, organization: { name: virtual.organization_name } }];
  rows = await validateProviderCsv(csv([virtual]));
  assert.equal(rows[0].previewAction, "update");
  assert.equal(rows[0].profileId, "profile");
  assert.equal(rows[0].normalizedData?.importMatchKey, virtualProviderImportMatchKey(virtual.organization_name, virtual.program_name));
  assert.equal((await validateProviderCsv(csv([{ ...physical, organization_name: virtual.organization_name, level_of_care: "IOP" }])))[0].previewAction, "reject");
  profiles = [];
  const writes: Record<string, unknown>[] = [];
  const tx = {
    organization: { findUnique: async () => organizations[0] },
    aftercareProfile: {
      findMany: async () => [], findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => { writes.push(data); return { id: "created" }; }
    },
    profileImage: { deleteMany: async () => ({ count: 0 }) },
    providerImportRow: { update: async () => ({}) }
  };
  Object.assign(prisma, { $transaction: async (callback: (client: unknown) => unknown) => callback(tx) });
  await commitProviderImportRow({ actorUserId: "admin", rowId: "row", normalized, organizationId: "org", profileId: null });
  assert.equal(writes[0].ownershipStatus, "unclaimed");
  assert.equal(writes[0].telehealthMode, "Virtual only");
  assert.deepEqual(writes[0].statesServed, normalized.statesServed);
  assert.equal(writes[0].totalBeds, null);
  assert.equal(writes[0].latitude, null);
  assert.equal(writes[0].city, "");
  assert.equal(writes[0].insuranceNotes, virtual.insurance_notes);
  // Transaction has no subscription methods: any billing mutation would fail this test.
  console.log("Provider CSV import checks passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
