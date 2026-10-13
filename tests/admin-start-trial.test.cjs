const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
let actor, org, audits, writes, raced, failAudit, reads, emails;
const prisma = {
  organization: { findUnique: async ({ where }) => { reads++; assert.equal(where.id, 'selected-org'); return org; } },
  $transaction: async fn => {
    const before = { ...org };
    try { return await fn({
      organization: { updateMany: async ({ where, data }) => {
        writes++;
        assert.equal(where.id, 'selected-org');
        assert.equal(where.type, 'aftercare_sober_living');
        assert.equal(where.stripeSubscriptionId, null);
        assert.equal(where.trialStartedAt, null);
        assert.equal(where.trialEndsAt, null);
        assert.deepEqual(where.AND, [
          { OR: [{ subscriptionPlan: null }, { subscriptionPlan: 'claimed_listing' }] },
          { OR: [{ subscriptionStatus: null }, { subscriptionStatus: { in: ['incomplete', 'active'] } }] }
        ]);
        if (raced) return { count: 0 };
        Object.assign(org, data); return { count: 1 };
      } },
      adminAuditLog: { create: async ({ data }) => {
        if (failAudit) throw new Error('audit failed');
        audits.push(data);
      } }
    }); } catch (error) { org = before; throw error; }
  }
};
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/trial-start-email') return { sendTrialStartedEmail: async (id, end) => { assert.equal(id, 'selected-org'); assert.equal(end, org.trialEndsAt); assert.equal(audits.length, 1); emails++; return 'Trial confirmation email sent.'; } };
  if (request === '@/lib/protected-routing') return { getProtectedAppUser: async () => actor };
  if (request === '@/lib/prisma') return { prisma };
  if (request === 'next/navigation') return { redirect: url => { throw Object.assign(new Error('redirect'), { url }); } };
  if (request === 'next/cache') return { revalidatePath() {} };
  return originalLoad.call(this, request, parent, isMain);
};
const { startAdminSoberLivingTrial } = require('../app/dashboard/admin/actions.ts');
function reset() {
  actor = { id: 'system-admin', role: 'system_admin', orgId: 'other-org' };
  org = { id: 'selected-org', name: "Danny's House", type: 'aftercare_sober_living', subscriptionPlan: null, subscriptionStatus: null, stripeSubscriptionId: null, trialStartedAt: null, trialEndsAt: null };
  audits = []; writes = 0; reads = 0; raced = false; failAudit = false; emails = 0;
}
async function start(id = 'selected-org') {
  const form = new FormData(); form.set('orgId', id);
  form.set('plan', 'enterprise'); form.set('days', '999');
  try { await startAdminSoberLivingTrial(form); assert.fail('Expected redirect'); }
  catch (error) { if (!error.url) throw error; return decodeURIComponent(error.url); }
}
(async () => {
  reset(); const before = Date.now(); const message = await start();
  assert.match(message, /30-day Aftercare Basic trial has started/);
  assert.equal(org.subscriptionPlan, 'professional'); assert.equal(org.subscriptionStatus, 'trialing');
  assert.ok(org.trialStartedAt.getTime() >= before);
  assert.equal(org.trialEndsAt - org.trialStartedAt, 30 * 86_400_000);
  assert.equal(org.subscriptionBillingCycle, null);
  assert.equal(audits[0].actorUserId, 'system-admin'); assert.equal(audits[0].entityId, 'selected-org');
  assert.equal(audits[0].action, 'sober_living_trial_started'); assert.equal(audits[0].metadata.source, 'admin');
  await start(); assert.equal(writes, 1); assert.equal(audits.length, 1); assert.equal(emails, 1);
  reset(); actor.role = 'aftercare_admin'; assert.equal(await start(), '/dashboard'); assert.equal(reads, 0);
  for (const change of [
    { type: 'referent' }, { type: 'aftercare_continued_care' },
    { stripeSubscriptionId: 'paid' }, { subscriptionPlan: 'professional' },
    { trialStartedAt: new Date(0) }, { trialEndsAt: new Date(0) }, { subscriptionStatus: 'canceled' }
  ]) { reset(); Object.assign(org, change); await start(); assert.equal(writes, 0); }
  reset(); org = null; await start(); assert.equal(writes, 0);
  reset(); await start(''); await start('a'.repeat(129)); assert.equal(reads, 0);
  reset(); raced = true; assert.match(await start(), /Subscription changed/); assert.equal(audits.length, 0); assert.equal(emails, 0);
  reset(); failAudit = true; await assert.rejects(start(), /audit failed/); assert.equal(org.trialStartedAt, null); assert.equal(emails, 0);
  console.log('Admin trial authorization, eligibility, organization scope, fixed terms, duplicate/race protection and transactional audit checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
