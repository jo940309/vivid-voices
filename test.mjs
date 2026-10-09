import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
process.env.DATA_DIR = mkdtempSync(path.join(os.tmpdir(), 'voice-test-'));
process.env.ADMIN_PASSWORD = 'test-only-password';
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
test('Gmail 驗證、防重複投票、前後台分離與計分', async () => {
  const { googleClient, validateGooglePayload } = await import('./google-auth.mjs');
  const payload = (sub, nonce) => ({ sub, nonce, aud: process.env.GOOGLE_CLIENT_ID,
    iss: 'https://accounts.google.com', email_verified: true,
    email: sub + '@gmail.com', name: '觀眾' + sub, exp: Date.now() / 1000 + 3600 });
  const valid = payload('one', 'nonce');
  assert.equal(validateGooglePayload(valid, valid.aud, 'nonce').sub, 'one');
  for (const changes of [{ aud: 'other' }, { iss: 'fake' }, { email_verified: false },
    { email: 'one@example.com' }, { nonce: 'wrong' }, { exp: 0 }, { sub: '' }]) {
    assert.throws(() => validateGooglePayload({ ...valid, ...changes }, valid.aud, 'nonce'));
  }
  // Only mock the external verifier. App checks, cookies and database run normally.
  mock.method(googleClient, 'verifyIdToken', async ({ idToken }) => {
    if (idToken === 'forged') throw new Error('invalid signature');
    return { getPayload: () => JSON.parse(idToken) };
  });
  const { server } = await import('./server.mjs');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function call(route, b, cookie) {
    const res = await fetch(base + '/api/' + route, { method: b ? 'POST' : 'GET',
      headers: { ...(b ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: b ? JSON.stringify(b) : undefined });
    return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }
  async function signIn(sub) {
    const challenge = await call('auth/nonce', {});
    return call('auth/google', { credential: JSON.stringify(payload(sub, challenge.data.nonce)) }, challenge.cookie);
  }
  try {
    const html = await (await fetch(base)).text();
    assert.ok(html.includes('活色聲香') && html.includes('TK流行歌唱社'));
    assert.ok(!html.includes('後台') && !html.includes('admin'));
    assert.ok(!readFileSync('public/app.js', 'utf8').includes('admin/'));
    assert.equal((await fetch(base + '/admin')).status, 200);
    assert.equal((await call('admin/state')).status, 401);
    const admin = (await call('admin/login', { password: 'test-only-password' })).cookie;
    assert.ok(admin.startsWith('admin_session='));
    assert.equal((await call('me', null, admin)).status, 401);
    let s = (await call('admin/state', null, admin)).data;
    assert.equal(s.teams.length, 18);
    assert.ok(s.rounds.every(r => r.teams.length === 3));
    assert.equal((await call('login', { code: 'old', name: 'old' })).status, 401);
    assert.equal((await call('auth/google', { credential: 'forged' })).status, 401);
    const challenge = await call('auth/nonce', {});
    assert.equal((await call('auth/google', { credential: 'forged' }, challenge.cookie)).status, 401);
    const credential = JSON.stringify(payload('one', challenge.data.nonce));
    const first = await call('auth/google', { credential }, challenge.cookie);
    assert.equal(first.status, 200);
    assert.equal((await call('auth/google', { credential }, challenge.cookie)).status, 401);
    const voters = [first.cookie, (await signIn('two')).cookie, (await signIn('three')).cookie];
    assert.equal((await call('admin/state', null, voters[0])).status, 401);
    assert.equal((await call('admin/me', null, admin + '; ' + voters[0])).status, 200);
    assert.equal((await call('me', null, admin + '; ' + voters[0])).data.email, 'one@gmail.com');
    await call('admin/round', { id: 1, action: 'open' }, admin);
    const teams = s.rounds[0].teams;
    assert.equal((await call('vote', { round: 1, team: teams[0].id }, voters[0])).status, 200);
    assert.equal((await call('vote', { round: 1, team: teams[1].id }, voters[0])).status, 409);
    const repeat = (await signIn('one')).cookie;
    assert.equal((await call('vote', { round: 1, team: teams[1].id }, repeat)).status, 409);
    await call('vote', { round: 1, team: teams[0].id }, voters[1]);
    await call('vote', { round: 1, team: teams[1].id }, voters[2]);
    assert.equal((await call('state')).data.rounds[0].counts.length, 0);
    await call('admin/round', { id: 1, action: 'settle' }, admin);
    s = (await call('admin/state',null,admin)).data;
    assert.equal(s.totals[0].total, 2); assert.equal(s.totals[1].total, 0);
    await call('admin/round', { id: 2, action: 'open' }, admin);
    const second = s.rounds[1].teams;
    await call('vote', { round: 2, team: second[0].id }, voters[0]);
    await call('vote', { round: 2, team: second[1].id }, voters[1]);
    assert.equal((await call('admin/round', { id: 2, action: 'settle' }, admin)).data.tie.length, 2);
    assert.equal((await call('vote', { round: 2, team: second[0].id }, voters[2])).status, 400);
    await call('admin/round', { id: 2, action: 'settle', winner: second[1].id }, admin);
    assert.equal((await call('admin/state',null,admin)).data.totals[1].total, 1);
    assert.deepEqual((await call('state')).data.totals, []);
    assert.equal((await call('admin/finalize', {}, admin)).status, 400);
    assert.equal((await call('admin/reset', { confirm: '錯誤', resetTeams: false }, admin)).status, 400);
    const reset = await call('admin/reset', { confirm: '重設投票', resetTeams: false }, admin);
    assert.equal(reset.status, 200);
    assert.ok((await call('admin/state', null, admin)).data.rounds.every(r => r.status === 'ready'));
    assert.equal((await call('admin/archive/' + reset.data.archiveId)).status, 401);
    assert.equal((await call('admin/archive/' + reset.data.archiveId, null, admin)).data.votes.length, 5);
  } finally { await new Promise(r => server.close(r)); mock.restoreAll(); }
});
