const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
const calls = [];
let fail = false;
const signedInAt = Date.parse('2026-10-07T16:30:00Z');
Module._load = function(request, parent, isMain) {
  if (request === '@clerk/nextjs/server') return { clerkClient: async () => ({ users: { getUserList: async (params) => {
    calls.push(params);
    if (fail) throw new Error('Authentication service unavailable');
    return { data: params.userId.filter(id => id !== 'missing').map(id => ({ id, lastSignInAt: id === 'never' ? null : signedInAt })) };
  } } }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { getUserLastLogins, formatLastLogin } = require('../lib/user-last-login.ts');
(async () => {
  assert.equal((await getUserLastLogins([])).size, 0);
  assert.equal(calls.length, 0);
  const result = await getUserLastLogins(['signed-in', 'never', 'missing', 'signed-in']);
  assert.deepEqual(calls[0], { userId: ['signed-in', 'never', 'missing'], limit: 3 });
  assert.equal(result.get('signed-in'), signedInAt);
  assert.equal(formatLastLogin(result.get('never')), 'Never signed in');
  assert.equal(formatLastLogin(result.get('missing')), 'Unavailable');
  assert.match(formatLastLogin(signedInAt), /Oct 7, 2026.*12:30 PM EDT/);
  assert.match(formatLastLogin(Date.parse('2026-01-07T16:30:00Z')), /11:30 AM EST/);
  assert.equal(formatLastLogin(NaN), 'Unavailable');
  calls.length = 0;
  await getUserLastLogins(Array.from({ length: 101 }, (_, i) => `user-${i}`));
  assert.deepEqual(calls.map(call => call.limit), [100, 1]);
  fail = true;
  assert.equal((await getUserLastLogins(['signed-in'])).size, 0);
  console.log('Last-login batch lookup, missing accounts, never-signed-in state, service failure and Eastern DST formatting passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
