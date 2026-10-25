import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('preview, recurring import, export and safe batch removal work on a 440px screen', async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 956 });
  const registration = await page.request.post('/api/public/register', { data: {
    familyName: `ICS Browser ${Date.now()}`, password: 'BrowserTest!2026',
    members: [{ name: 'Testadmin', position: 'mama', role: 'adult' }]
  } });
  expect(registration.status()).toBe(201);
  await page.goto('/?view=calendar');
  await page.locator('.release-notes-confirm').click();
  const now = new Date();
  const date = `2000${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:browser-birthday\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:ICS Geburtstag\r\nRRULE:FREQ=YEARLY\r\nCATEGORIES:GEBURTSTAG\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-P1D\r\nDESCRIPTION:Erinnerung\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  await page.locator('.calendar-import-action input').setInputFiles({
    name: 'birthdays.ics', mimeType: 'text/calendar', buffer: Buffer.from(content)
  });
  const dialog = page.getByRole('dialog', { name: 'Kalenderdatei importieren' });
  await expect(dialog.getByText('1 Termine / Serien', { exact: true })).toBeVisible();
  const before = await (await page.request.get('/api/resources/events')).json();
  expect(before.records).toHaveLength(0);
  const bounds = await dialog.evaluate(element => ({
    right: element.getBoundingClientRect().right,
    bottom: element.querySelector('footer').getBoundingClientRect().bottom,
    width: innerWidth, height: innerHeight
  }));
  expect(bounds.right).toBeLessThanOrEqual(bounds.width);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
  await expect(dialog.getByRole('button', { name: 'Jetzt importieren', exact: true })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: '.codex-tmp/ics-preview-440.png' });
  await dialog.getByRole('button', { name: 'Jetzt importieren', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Termin ICS Geburtstag öffnen', exact: true }).first()).toBeVisible();
  const imported = await (await page.request.get('/api/resources/events')).json();
  expect(imported.records).toHaveLength(1);
  expect(imported.records[0].icsSource).toContain('RRULE:FREQ=YEARLY');

  await page.getByRole('button', { name: 'Termin ICS Geburtstag öffnen', exact: true }).first().click();
  const editor = page.getByRole('dialog', { name: 'Termin bearbeiten' });
  await expect(editor.getByLabel('Beginnt am', { exact: true })).toBeDisabled();
  await editor.getByLabel('Titel', { exact: true }).fill('Geburtstag korrigiert');
  await editor.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(editor).toBeHidden();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const exported = await readFile(await (await download).path(), 'utf8');
  expect(exported).toContain('UID:browser-birthday');
  expect(exported).toContain('SUMMARY:Geburtstag korrigiert');
  expect(exported).toContain('BEGIN:VALARM');
  expect(exported.match(/BEGIN:VEVENT/g)).toHaveLength(1);

  await page.getByRole('button', { name: 'Dateiimporte verwalten', exact: true }).click();
  page.once('dialog', prompt => prompt.accept());
  await dialog.getByRole('button', { name: 'Import birthdays.ics entfernen', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Import birthdays.ics entfernen', exact: true })).toHaveCount(0);
  const remaining = await (await page.request.get('/api/resources/events')).json();
  expect(remaining.records).toHaveLength(0);
  const recycled = await (await page.request.get('/api/recycle-bin')).json();
  expect(recycled.records[0].record.title).toBe('Geburtstag korrigiert');
  await dialog.getByRole('button', { name: 'Schließen', exact: true }).last().click();

  await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Menü', exact: true });
  await menu.getByRole('button', { name: /als Favorit hinzufügen/ }).first().click();
  await expect(menu.getByRole('status')).toContainText('Limit von 5 Favoriten');
  const pins = menu.getByRole('button', { name: /aus Favoriten entfernen/ });
  await expect(pins).toHaveCount(5);
  await expect(menu.getByRole('button', { name: /als Favorit hinzufügen/ }).first()).toHaveAttribute('aria-disabled', 'true');
  await menu.getByRole('status').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.codex-tmp/favorites-limit-440.png' });
});
