import { strict as assert } from "node:assert";
import { Prisma } from "@prisma/client";
import { assertInvitationAvailable, InvitationConflict, uniqueInvitedOrganization, normalizeInviteEmail } from "../lib/organization-invitations";

async function main() {
  assert.equal(normalizeInviteEmail("  Person@Example.com "), "person@example.com");
  assert.equal(uniqueInvitedOrganization([]), undefined);
  assert.equal(uniqueInvitedOrganization([{orgId: "a"}, {orgId: "a"}]), "a");
  assert.throws(() => uniqueInvitedOrganization([{orgId: "a"}, {orgId: "b"}]), InvitationConflict);
  const emails: string[] = [];
  const record = {email: "PERSON@example.com", orgId: "other"};
  const tx = {
    user: {findMany: async (query: {where: {OR: Array<{email: {equals: string; mode: string}}>}}) => {
      for (const clause of query.where.OR) { emails.push(clause.email.equals); assert.equal(clause.email.mode, "insensitive"); }
      return [record];
    }},
    organizationInvite: {findMany: async () => []},
    $queryRaw: async () => []
  } as unknown as Prisma.TransactionClient;
  await assert.rejects(assertInvitationAvailable(tx, ["PERSON@Example.com"], "new-org"), InvitationConflict);
  await assert.rejects(assertInvitationAvailable(tx, ["person@example.com"], null), InvitationConflict);
  await assertInvitationAvailable(tx, ["person@example.com"], "other");
  assert.equal(emails[0], "person@example.com");
  for (const store of ["provider", "referent"]) {
    const pendingTx = {
      user: {findMany: async () => []},
      organizationInvite: {findMany: async () => store === "provider" ? [record] : []},
      $queryRaw: async () => store === "referent" ? [record] : []
    } as unknown as Prisma.TransactionClient;
    await assert.rejects(assertInvitationAvailable(pendingTx, ["person@example.com"], "new-org"), InvitationConflict);
    await assertInvitationAvailable(pendingTx, ["person@example.com"], "other");
    await assert.rejects(assertInvitationAvailable(pendingTx, ["person@example.com"], null), InvitationConflict);
  }
  await assertInvitationAvailable({} as Prisma.TransactionClient, [], null);
  console.log("Invitation checks cover existing memberships, case variants, both pending invitation stores, same-org retries, and ambiguous acceptance.");
}
main().catch(error => {console.error(error); process.exitCode = 1;});
