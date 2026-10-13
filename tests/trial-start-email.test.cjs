const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
let org = { name: 'House <A>', email: 'fallback@example.com', users: [{ email: 'ADMIN@example.com' }, { email: 'admin@example.com' }] };
let status = 'sent', sent, fail = false;
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/prisma') return { prisma: { organization: { findUnique: async ({ where, select }) => {
    assert.equal(where.id, 'org');
    assert.deepEqual(select.users.where, { isActive: true, role: 'aftercare_admin' });
    if (fail) throw new Error('database unavailable');
    return org;
  } } } };
  if (request === '@/lib/email') {
    const actual = originalLoad.call(this, request, parent, isMain);
    return { ...actual, sendTransactionalEmail: async input => { sent = input; return { status }; } };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { sendTrialStartedEmail } = require('../lib/trial-start-email.ts');
(async () => {
  const end = new Date('2026-11-12T17:00:00Z');
  assert.match(await sendTrialStartedEmail('org', end), /email sent/);
  assert.deepEqual(sent.to, ['admin@example.com']);
  assert.equal(sent.subject, 'Your Aftercare Compass trial has started');
  assert.match(sent.html, /House &lt;A&gt;/);
  assert.match(sent.text, /November 12, 2026/);
  assert.match(sent.text, /12:00 PM EST/);
  assert.match(sent.text, /Aftercare Basic/);
  assert.match(sent.text, /will not be charged automatically/);
  assert.match(sent.text, /dashboard\/aftercare\?tab=subscription/);
  org.users = []; await sendTrialStartedEmail('org', end); assert.deepEqual(sent.to, ['fallback@example.com']);
  for (status of ['failed', 'skipped']) assert.match(await sendTrialStartedEmail('org', end), /could not be sent/);
  fail = true; assert.match(await sendTrialStartedEmail('org', end), /could not be sent/);
  console.log('Trial email recipients, content, escaping, expiration timezone, fallback and failure handling passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
