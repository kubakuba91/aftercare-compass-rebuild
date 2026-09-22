import { strict as assert } from "node:assert";
import { deliverInvitations } from "../lib/invite-delivery";
async function main() {
  const recipients: string[] = [];
  assert.deepEqual(await deliverInvitations([], async () => { throw new Error("Should not send"); }), { sent: 0, notSent: 0 });
  const result = await deliverInvitations(["one@example.com", "two@example.com", "three@example.com", "four@example.com"], async email => {
    recipients.push(email);
    if (email.startsWith("two")) throw new Error("Provider unavailable");
    return { status: email.startsWith("three") ? "skipped" : email.startsWith("four") ? "failed" : "sent" };
  });
  assert.equal(recipients.length, 4);
  assert.deepEqual(result, { sent: 1, notSent: 3 });
  assert.deepEqual(await deliverInvitations(["one@example.com"], async () => ({status: "sent"})), {sent: 1, notSent: 0});
  console.log("Invitation delivery handles success, empty teams, rejected requests, and partial failure without sending real emails.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
