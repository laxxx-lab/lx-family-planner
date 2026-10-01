import { expect, test } from '@playwright/test';

test('wall display shows family tasks, saves its theme and switches to a child with a read-only calendar', async ({ page }) => {
  const registration = await page.request.post('/api/public/register', {
    data: {
      familyName: `Wall test ${Date.now()}`, password: 'WallTest!2026',
      members: [
        { name: 'Parent', position: 'mama', role: 'adult' },
        { name: 'Child', position: 'kind', role: 'child' },
        { name: 'Wall', position: 'wanddisplay', role: 'wall' }
      ]
    }
  });
  expect(registration.status()).toBe(201);
  const bootstrap = await (await page.request.get('/api/bootstrap')).json();
  const child = bootstrap.members.find(member => member.role === 'child');
  const wall = bootstrap.members.find(member => member.role === 'wall');
  const task = await page.request.post('/api/resources/tasks', {
    data: { title: 'Child family task', memberId: child.id, stars: 5 }
  });
  expect(task.status()).toBe(201);
  const event = await page.request.post('/api/resources/events', {
    data: { title: 'Family event', date: '2030-10-03', memberId: 'all' }
  });
  expect(event.status()).toBe(201);
  await page.goto('/?view=calendar');
  const releaseNotes = page.locator('.release-notes-confirm');
  await expect(releaseNotes).toBeVisible();
  await releaseNotes.click();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'graphite'));
  await expect(page.locator('.calendar-add-button')).toHaveCSS('color', 'rgb(25, 51, 47)');
  await expect(page.locator('.calendar-add-button')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect((await page.request.post('/api/auth/member', { data: { memberId: wall.id } })).ok()).toBe(true);
  await page.goto('/?view=tasks');
  const notes = page.locator('.release-notes-confirm');
  if (await notes.isVisible()) await notes.click();
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await page.getByRole('dialog', { name: 'Menü' }).getByRole('button', { name: 'Aufgaben & Sterne', exact: true }).click();
  await expect(page.getByText('Child family task', { exact: true })).toBeVisible();
  await expect(page.locator('.wall-display-badge')).toBeVisible();
  await page.getByRole('button', { name: 'Themenwelt wählen' }).click();
  await page.getByRole('button', { name: /Graphit neutral/ }).click();
  await expect.poll(async () => {
    const data = await (await page.request.get('/api/bootstrap')).json();
    return data.members.find(member => member.id === wall.id).theme;
  }).toBe('graphite');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(240, 241, 241)');
  await page.screenshot({ path: '.codex-tmp/wall-tasks-graphite.png', fullPage: true });
  await page.locator('.wall-display-badge').click();
  await expect(page.locator('.profile-tool-button')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wall bearbeiten', exact: true })).toHaveCount(0);
  await page.locator('.profile-switch-target').filter({ hasText: 'Child' }).click();
  await page.goto('/?view=calendar');
  await expect(page.locator('.calendar-control-deck')).toBeVisible();
  await expect(page.locator('.calendar-add-button')).toHaveCount(0);
  await expect(page.locator('.calendar-import-action')).toHaveCount(0);
  await page.getByRole('button', { name: 'Termin Family event öffnen' }).click();
  await expect(page.locator('.calendar-editor-save')).toHaveCount(0);
  await expect(page.locator('.calendar-editor-delete')).toHaveCount(0);
});
