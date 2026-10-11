import { expect, test } from '@playwright/test';

test('families can create zero-star emoji tasks, protected notes and reusable school periods', async ({ page }) => {
  const registration = await page.request.post('/api/public/register', { data: {
    familyName: `Community ${Date.now()}`, password: 'CommunityTest!2026',
    members: [{ name: 'Parent', position: 'mama', role: 'adult' }, { name: 'Child', position: 'kind', role: 'child' }]
  }});
  expect(registration.status()).toBe(201);
  const { members } = await registration.json();
  const child = members.find(member => member.role === 'child');
  expect((await page.request.post('/api/resources/kidProfiles', { data: { memberId: child.id, schoolEnabled: true } })).ok()).toBe(true);
  await page.goto('/?view=tasks');
  await page.locator('.release-notes-confirm').click();
  await page.getByRole('button', { name: 'Neue Aufgabe zuteilen', exact: true }).click();
  const taskForm = page.locator('.modal-card form');
  await taskForm.locator('input[type=text]').first().fill('Zähne putzen');
  await taskForm.getByLabel('Emoji (optional)').fill('🪥');
  await taskForm.locator('input[type=number]').last().fill('0');
  await taskForm.getByRole('button', { name: 'Aufgabe erstellen', exact: true }).click();
  await expect(page.locator('.modal-card')).toHaveCount(0);
  const createdTask = (await (await page.request.get('/api/resources/tasks')).json()).records.find(task => task.title === 'Zähne putzen');
  expect(createdTask).toMatchObject({ stars: 0, icon: '🪥' });

  await page.goto('/?view=board');
  await page.getByRole('button', { name: /Notiz/ }).click();
  const noteForm = page.locator('.modal-card form');
  await noteForm.getByLabel('Emoji (optional)').fill('🔒');
  await noteForm.getByLabel('Sichtbarkeit').selectOption('adults');
  await noteForm.locator('input[type=text]').last().fill('WLAN');
  await noteForm.locator('textarea').fill('private-password');
  await noteForm.getByRole('button', { name: 'Notiz anheften' }).click();
  await expect(page.getByText('🔒 Nur Erwachsene', { exact: true })).toBeVisible();

  await page.goto('/?view=family-life');
  await page.getByLabel('Ansicht für').selectOption(child.id);
  await page.getByRole('button', { name: 'Schule', exact: true }).click();
  await page.getByText('Stundenzeiten & Fächer', { exact: true }).click();
  const templateForm = page.locator('.school-template-editor form');
  await templateForm.getByLabel('1. Beginn', { exact: true }).fill('08:00');
  await templateForm.getByLabel('1. Ende', { exact: true }).fill('08:45');
  await templateForm.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect.poll(async () => (await (await page.request.get('/api/resources/familySettings')).json()).records[0]?.schoolTimetable?.periods[0]?.time).toBe('08:00');
  await page.locator('.school-empty-slot').first().click();
  const lessonForm = page.locator('#school-item-editor form');
  await expect(lessonForm.getByLabel('Beginn', { exact: true })).toHaveValue('08:00');
  await lessonForm.getByPlaceholder('Fach', { exact: true }).fill('Mathematik');
  await lessonForm.getByRole('button', { name: 'Eintragen', exact: true }).click();
  await expect(page.locator('.school-lesson-card').filter({ hasText: 'Mathematik' })).toBeVisible();
  await page.screenshot({ path: '.codex-tmp/community-school-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.school-timetable')).toBeVisible();
  await page.screenshot({ path: '.codex-tmp/community-school-mobile.png', fullPage: true });
});
