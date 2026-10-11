import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lx-community-'));
process.env.DATABASE_FILE = path.join(directory, 'test.sqlite');
process.env.BACKUP_DIRECTORY = path.join(directory, 'backups');
process.env.DISABLE_LEGACY_IMPORT = 'true';
process.env.APP_SECRET = 'community-test-secret';
process.env.NODE_ENV = 'test';
process.env.REGISTRATION_MODE = 'open';
const { createApp } = await import('./app.js');
const { database } = await import('./database.js');

test('adult-only pinboard notes never leak through bootstrap or resource reads', async t => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function request(route, method = 'GET', body) {
    const response = await fetch(base + route, {
      method, headers: { cookie, 'content-type': 'application/json', 'x-lx-client': 'native' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, body: await response.json() };
  }
  const registration = await request('/api/public/register', 'POST', {
    familyName: 'Community QA', password: 'Community-Test-Password-123',
    members: [
      { name: 'Adult', position: 'mama', role: 'adult' },
      { name: 'Child', position: 'kind', role: 'child' },
      { name: 'Teen', position: 'kind', role: 'teen' },
      { name: 'Wall', position: 'wanddisplay', role: 'wall' },
      { name: 'Pet', position: 'haustier', role: 'pet' }
    ]
  });
  assert.equal(registration.status, 201);
  const [adult, child] = registration.body.members;
  const task = await request('/api/resources/tasks', 'POST', {
    id: 'zero-task', title: 'Brush teeth', memberId: child.id, stars: 0, icon: '🪥'
  });
  assert.equal(task.status, 201);
  assert.equal(task.body.record.stars, 0);
  assert.equal(task.body.record.icon, '🪥');
  await request('/api/resources/notes', 'POST', { id: 'public', title: 'Family', content: 'Shopping', visibility: 'family' });
  const secret = await request('/api/resources/notes', 'POST', { id: 'secret', title: 'WiFi', content: 'private-password', visibility: 'adults', icon: '🔒' });
  assert.equal(secret.body.record.visibility, 'adults');
  const template = { periods: [{ period: 1, label: 'First', time: '08:00', endTime: '08:45' }], subjects: ['Maths'] };
  assert.equal((await request('/api/resources/familySettings', 'POST', { id: 'family-settings', schoolTimetable: template })).status, 201);
  for (const weekday of [1, 3]) {
    const lesson = await request('/api/resources/schoolItems', 'POST', { id: `lesson-${weekday}`, memberId: child.id, kind: 'lesson', title: 'Maths', subject: 'Maths', period: 1, weekday });
    assert.equal(lesson.status, 201);
    assert.equal(lesson.body.record.time, '08:00');
    assert.equal(lesson.body.record.usesTimetableTemplate, true);
  }
  assert.equal((await request('/api/resources/familySettings/family-settings', 'PATCH', {
    schoolTimetable: { ...template, periods: [{ ...template.periods[0], time: '08:15', endTime: '09:00' }] }
  })).status, 200);
  const lessons = await request('/api/resources/schoolItems');
  assert.equal(lessons.body.records.filter(item => item.time === '08:15').length, 2);
  const legacy = await request('/api/resources/schoolItems', 'POST', {
    id: 'legacy-lesson', memberId: child.id, kind: 'lesson', title: 'Custom lesson',
    period: 1, weekday: 2, time: '09:15', endTime: '10:00', usesTimetableTemplate: false
  });
  assert.equal(legacy.body.record.time, '09:15');
  const editedLegacy = await request('/api/resources/schoolItems/legacy-lesson', 'PATCH', { details: 'New room' });
  assert.equal(editedLegacy.body.record.time, '09:15');
  for (const member of registration.body.members.slice(1)) {
    assert.equal((await request('/api/auth/member', 'POST', { memberId: member.id })).status, 200);
    const bootstrap = await request('/api/bootstrap');
    assert.equal(bootstrap.body.resources.notes.some(note => note.id === 'secret'), false, member.role);
    const notes = await request('/api/resources/notes');
    assert.equal(notes.body.records.some(note => note.id === 'secret'), false, member.role);
    assert.equal((await request('/api/resources/notes/secret', 'PATCH', { visibility: 'family' })).status, 403);
    assert.equal((await request('/api/resources/notes/secret', 'DELETE')).status, 403);
  }
  assert.equal((await request('/api/auth/member', 'POST', { memberId: adult.id, familyPassword: 'Community-Test-Password-123' })).status, 200);
  assert.equal((await request('/api/resources/notes')).body.records.some(note => note.id === 'secret'), true);
  await request('/api/auth/member', 'POST', { memberId: child.id });
  assert.equal((await request('/api/resources/notes/public', 'PATCH', { visibility: 'adults' })).status, 403);
  assert.equal((await request('/api/resources/notes', 'POST', { id: 'child-secret', title: 'Secret', visibility: 'adults' })).status, 403);
  assert.equal((await request('/api/auth/family', 'POST', { familyId: registration.body.family.id, password: 'Community-Test-Password-123' })).status, 200);
  assert.equal((await request('/api/bootstrap')).body.resources.notes.some(note => note.id === 'secret'), false);
  assert.equal((await request('/api/resources/notes')).body.records.some(note => note.id === 'secret'), false);
});
