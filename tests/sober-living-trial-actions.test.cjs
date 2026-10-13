const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
let organization, actor, writes, audits, raced;
const prisma = { $transaction: async fn => fn({
  organization: { updateMany: async ({ where, data }) => {
    writes++;
    assert.equal(where.id, 'own-org');
    assert.equal(where.type, 'aftercare_sober_living');
    assert.equal(where.trialStartedAt, null);
    assert.equal(where.trialEndsAt, null);
    assert.equal(where.stripeSubscriptionId, null);
    assert.deepEqual(where.AND, [
      { OR: [{ subscriptionPlan: null }, { subscriptionPlan: 'claimed_listing' }] },
      { OR: [{ subscriptionStatus: null }, { subscriptionStatus: { in: ['incomplete', 'active'] } }] }
    ]);
    if (raced) return { count: 0 };
    Object.assign(organization, data);
    return { count: 1 };
  } },
  adminAuditLog: { create: async ({ data }) => audits.push(data) }
}) };
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/protected-routing') return { getProtectedAppUser: async () => actor };
  if (request === '@/lib/prisma') return { prisma };
  if (request === 'next/navigation') return { redirect: url => { throw Object.assign(new Error('redirect'), { url }); } };
  if (request === '@/lib/stripe') return { hasStripeConfig: () => false, getStripe: () => { throw new Error('Trials must not call Stripe'); } };
  return originalLoad.call(this, request, parent, isMain);
};
const { startSoberLivingTrial } = require('../app/dashboard/billing/actions.ts');
function reset() {
  organization = { id: 'own-org', type: 'aftercare_sober_living', subscriptionPlan: null, subscriptionStatus: null };
  actor = { id: 'admin', orgId: 'own-org', organization, role: 'aftercare_admin' };
  writes = 0; audits = []; raced = false;
}
async function start() {
  try { await startSoberLivingTrial(); assert.fail('Expected redirect'); }
  catch (error) { if (!error.url) throw error; return new URL(error.url, 'https://example.com'); }
}
(async () => {
  reset(); await start();
  assert.equal(organization.subscriptionPlan, 'professional');
  assert.equal(organization.subscriptionStatus, 'trialing');
  assert.equal(organization.subscriptionBillingCycle, null);
  assert.equal(organization.trialEndsAt - organization.trialStartedAt, 30 * 86_400_000);
  assert.equal(audits.length, 1); assert.equal(audits[0].actorUserId, 'admin');
  assert.equal(audits[0].entityId, 'own-org');
  await start(); assert.equal(writes, 1); // Repeat submission cannot restart trial.
  reset(); actor.role = 'aftercare_manager'; await start(); assert.equal(writes, 0);
  reset(); organization.type = 'referent'; await start(); assert.equal(writes, 0);
  reset(); organization.stripeSubscriptionId = 'paid'; await start(); assert.equal(writes, 0);
  reset(); raced = true; const result = await start(); assert.equal(audits.length, 0);
  assert.match(result.searchParams.get('billingMessage'), /subscription changed/);
  console.log('Trial start authorization, organization scope, one-time grant, audit and concurrent-update handling passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
