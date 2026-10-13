const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
let actor, org, audits, writes, raced;
const prisma = {
  organization: { findUnique: async () => org },
  $transaction: async fn => fn({
    organization: { updateMany: async ({ where, data }) => {
      writes++;
      assert.equal(where.stripeSubscriptionId, null);
      assert.equal(where.subscriptionStatus, 'trialing');
      assert.equal(where.trialEndsAt, org.trialEndsAt);
      if (raced) return { count: 0 };
      Object.assign(org, data); return { count: 1 };
    } },
    trialExtension: { create: async ({ data }) => audits.push(data) }
  })
};
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/protected-routing') return { getProtectedAppUser: async () => actor };
  if (request === '@/lib/prisma') return { prisma };
  if (request === 'next/navigation') return { redirect: url => { throw Object.assign(new Error('redirect'), { url }); } };
  if (request === 'next/cache') return { revalidatePath() {} };
  return originalLoad.call(this, request, parent, isMain);
};
const { extendOrganizationTrial } = require('../app/dashboard/admin/actions.ts');
function reset(type = 'aftercare_sober_living') {
  actor = { id: 'system-admin', role: 'system_admin' };
  org = { id: 'org', type, subscriptionStatus: 'trialing', stripeSubscriptionId: null, trialStartedAt: new Date(0), trialEndsAt: new Date(1) };
  audits = []; writes = 0; raced = false;
}
async function extend(days = '7', reason = 'Provider requested more evaluation time') {
  const form = new FormData(); form.set('orgId', 'org'); form.set('days', days); form.set('reason', reason);
  try { await extendOrganizationTrial(form); assert.fail('Expected redirect'); }
  catch (error) { if (!error.url) throw error; return error.url; }
}
(async () => {
  for (const type of ['aftercare_sober_living', 'referent']) {
    reset(type); const before = Date.now(); await extend();
    assert.equal(writes, 1); assert.equal(audits.length, 1);
    assert.equal(audits[0].actorUserId, 'system-admin');
    assert.equal(audits[0].previousEndsAt.getTime(), 1);
    assert.ok(audits[0].newEndsAt.getTime() >= before + 7 * 86_400_000);
  }
  reset(); actor.role = 'aftercare_admin'; await extend(); assert.equal(writes, 0);
  reset(); org.stripeSubscriptionId = 'paid'; await extend(); assert.equal(writes, 0);
  reset('aftercare_continued_care'); await extend(); assert.equal(writes, 0);
  reset(); await extend('91'); await extend('7', ''); assert.equal(writes, 0);
  reset(); raced = true; await extend(); assert.equal(audits.length, 0);
  console.log('Trial extension authorization, legacy referents, expired trials, bounds, audit and race checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
