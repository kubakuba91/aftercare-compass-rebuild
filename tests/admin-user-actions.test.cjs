const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
const { Role } = require('@prisma/client');
const stamp = new Date('2026-10-07T12:00:00Z');
let actor = { id: 'admin', role: Role.system_admin, isActive: true };
let user;
let audits;
let otherAdmins;
let transactions;
const redirect = (url) => { throw Object.assign(new Error('redirect'), { url }); };
const prisma = {
  user: { findUnique: async () => user },
  $transaction: async (callback) => {
    transactions++;
    let pendingUser = { ...user };
    const pendingAudits = [];
    const result = await callback({
      user: {
        findUnique: async ({ where }) => where.id === actor.id ? actor : pendingUser,
        count: async () => otherAdmins,
        updateMany: async ({ data }) => { pendingUser = { ...pendingUser, ...data }; return { count: 1 }; }
      },
      adminAuditLog: { create: async ({ data }) => { pendingAudits.push(data); } }
    });
    user = pendingUser;
    audits.push(...pendingAudits);
    return result;
  }
};
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/protected-routing') return { getProtectedAppUser: async () => actor };
  if (request === '@/lib/prisma') return { prisma };
  if (request === 'next/navigation') return { redirect };
  if (request === 'next/cache') return { revalidatePath() {} };
  if (request === '@/lib/database-status') return { hasValidDatabaseUrl: () => true };
  if (request === '@/lib/clerk-config') return { hasValidClerkRuntimeConfig: () => true };
  if (request === '@clerk/nextjs/server') return { auth: async () => ({ userId: 'clerk-user' }), currentUser: async () => ({ id: 'clerk-user' }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { updateAdminUser } = require('../app/dashboard/admin/users/actions.ts');
const { getClerkSessionUserId, getRequiredClerkIdentity } = require('../lib/current-user.ts');
function reset() {
  actor = { id: 'admin', role: Role.system_admin, isActive: true };
  user = { id: 'user', firstName: 'Alex', lastName: 'Example', phone: '(212) 555-0100', smsOptIn: true, role: Role.referent_admin, orgId: 'org', organization: { type: 'referent' }, isActive: true, updatedAt: stamp };
  audits = []; otherAdmins = 1; transactions = 0;
}
async function submit(values) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ userId: 'user', version: stamp.toISOString(), ...values })) form.set(key, value);
  try { await updateAdminUser(form); assert.fail('Expected redirect'); } catch (error) { if (!error.url) throw error; return new URL(error.url, 'https://example.com'); }
}
async function main() {
  reset(); actor.role = Role.referent_admin;
  assert.equal((await submit({ intent: 'access', isActive: 'false' })).pathname, '/dashboard');
  assert.equal(transactions, 0);
  reset();
  let result = await submit({ intent: 'details', firstName: 'New', lastName: 'Name', phone: '(212) 555-0101', role: Role.referent_manager, orgId: 'injected-org', email: 'injected@example.com' });
  assert.equal(result.searchParams.has('error'), false);
  assert.equal(user.orgId, 'org'); assert.equal(user.email, undefined); assert.equal(user.role, Role.referent_manager); assert.equal(user.smsOptIn, false);
  assert.equal(audits[0].action, 'user_details_updated'); assert.equal(audits[0].actorUserId, 'admin');
  reset(); result = await submit({ intent: 'details', firstName: 'New', lastName: '', phone: '', role: Role.system_admin });
  assert.equal(result.searchParams.get('error'), '1'); assert.equal(user.role, Role.referent_admin); assert.equal(audits.length, 0);
  reset(); otherAdmins = 0;
  result = await submit({ intent: 'access', isActive: 'false' });
  assert.match(result.searchParams.get('message'), /last active/); assert.equal(user.isActive, true); assert.equal(audits.length, 0);
  reset(); result = await submit({ intent: 'access', isActive: 'false', version: 'stale' });
  assert.match(result.searchParams.get('message'), /changed/); assert.equal(user.isActive, true);
  reset(); await submit({ intent: 'access', isActive: 'false' });
  assert.equal(user.isActive, false); assert.equal(user.orgId, 'org'); assert.equal(audits[0].action, 'user_deactivated');
  await assert.rejects(getClerkSessionUserId(), error => error.url === '/account-disabled');
  await assert.rejects(getRequiredClerkIdentity(), error => error.url === '/account-disabled');
  await submit({ intent: 'access', isActive: 'true' });
  assert.equal(user.isActive, true); assert.equal(audits[1].action, 'user_reactivated');
  assert.equal(await getClerkSessionUserId(), 'clerk-user');
  console.log('Admin actions: authorization, immutable organization/email, role boundaries, audit writes, stale edits, SMS consent, last-admin protection, deactivation enforcement and reactivation passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
