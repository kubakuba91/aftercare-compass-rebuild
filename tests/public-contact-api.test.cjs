const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let found = true, configured = true, writes = [], notifications = [];
Module._load = function(request, parent, main) {
  if (request === '@/lib/database-status') return { hasDatabaseConfig: () => configured, missingDatabaseResponse: () => ({ error: 'Unavailable' }) };
  if (request === '@/lib/email-notifications') return { notifyNewPublicLead: async id => notifications.push(id) };
  if (request === '@/lib/prisma') return { prisma: {
    aftercareProfile: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'profile', slug: 'program', status: 'published' });
      return found ? { id: 'profile', orgId: 'provider-org' } : null;
    } },
    lead: { create: async ({ data }) => { writes.push(data); return { id: 'lead', status: 'new' }; } }
  } };
  return original.call(this, request, parent, main);
};
const { POST } = require('../app/api/leads/route.ts');
const body = { profileId: 'profile', slug: 'program', name: 'Test Person', email: 'person@example.com', phone: '', message: 'Please tell me about availability.', companyWebsite: '', aftercareOrgId: 'forged-org' };
const submit = overrides => POST(new Request('https://example.com/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...overrides }) }));
(async () => {
  const response = await submit(); assert.equal(response.status, 200);
  assert.equal(writes.length, 1); assert.equal(writes[0].aftercareOrgId, 'provider-org');
  assert.equal(writes[0].profileId, 'profile'); assert.equal(writes[0].message, body.message);
  assert.deepEqual(notifications, ['lead']);
  for (const invalid of [{ email: 'bad' }, { name: '' }, { message: ' ' }, { message: 'a'.repeat(2001) }, { companyWebsite: 'bot' }]) assert.equal((await submit(invalid)).status, 400);
  found = false; assert.equal((await submit()).status, 404);
  configured = false; assert.equal((await submit()).status, 503);
  assert.equal(writes.length, 1); assert.equal(notifications.length, 1);
  console.log('Public contact: validated fields, honeypot, published target, server-owned recipient, saved request and notification passed without sending email.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = original; });
