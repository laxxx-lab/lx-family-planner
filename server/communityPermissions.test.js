import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lx-community-permissions-'));
process.env.DATABASE_FILE = path.join(directory, 'test.sqlite');
process.env.DISABLE_LEGACY_IMPORT = 'true';
process.env.APP_SECRET = 'community-permissions-test-secret';
process.env.NODE_ENV = 'test';
process.env.NEXTCLOUD_AUTO_PROVISION = 'false';
const [{ createApp }, { database }] = await Promise.all([import('./app.js'), import('./database.js')]);
const server = createApp().listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let cookie;
async function request(url, method = 'GET', body, status = 200) {
  const response = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', 'x-lx-language': 'en', ...(cookie ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const result = await response.json();
  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}
after(async () => {
  await new Promise(resolve => server.close(resolve));
  database.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('children cannot create, change, delete or bulk import parent events; wall profile changes preserve adult authentication', async () => {
  const config = await request('/api/config');
  assert.equal(config.language, 'de');
  const family = await request('/api/public/register', 'POST', {
    familyName: 'Permissions', password: 'test-family-password',
    members: [
      { name: 'Parent', role: 'adult', position: 'mama' },
      { name: 'Child', role: 'child', position: 'kind' },
      { name: 'Wall', role: 'wall', position: 'wanddisplay' }
    ]
  }, 201);
  const members = family.members || (await request('/api/bootstrap')).members;
  const parent = members.find(m => m.role === 'adult');
  const child = members.find(m => m.role === 'child');
  const wall = members.find(m => m.role === 'wall');
  await request('/api/auth/member', 'POST', { memberId: parent.id });
  const { record: event } = await request('/api/resources/events', 'POST', { title: 'Parent event', date: '2026-10-03', memberId: 'all' }, 201);
  const { record: reward } = await request('/api/resources/rewards', 'POST', { title: 'Reward', costStars: 100, forMemberId: child.id }, 201);
  await request('/api/auth/member', 'POST', { memberId: child.id });
  const redemption = await request(`/api/rewards/${reward.id}/redeem`, 'POST', { memberId: child.id }, 409);
  assert.equal(redemption.error, 'Not enough stars');
  await request('/api/resources/events', 'POST', { title: 'Child event', date: '2026-10-03' }, 403);
  await request(`/api/resources/events/${event.id}`, 'PATCH', { title: 'Changed' }, 403);
  await request(`/api/resources/events/${event.id}`, 'DELETE', undefined, 403);
  await request('/api/resources/events/bulk', 'POST', { records: [{ ...event, title: 'Changed' }] }, 403);
  await request('/api/auth/member', 'POST', { memberId: wall.id });
  await request(`/api/members/${wall.id}`, 'PATCH', { theme: 'graphite' });
  await request(`/api/members/${parent.id}`, 'PATCH', { theme: 'graphite' }, 403);
  await request('/api/auth/member', 'POST', { memberId: parent.id }, 401);
  await request('/api/auth/member', 'POST', { memberId: parent.id, familyPassword: 'test-family-password' });
  await request(`/api/resources/events/${event.id}`, 'PATCH', { title: 'Still editable by parent' });
});
