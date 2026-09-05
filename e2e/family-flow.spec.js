import { expect, test } from '@playwright/test';

test('a new family can complete onboarding and open the calendar', async ({ page }) => {
  const familyName = `Browser Familie ${Date.now()}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Neue Familie anlegen' }).click();

  await expect(
    page.getByText('http://127.0.0.1:4170', { exact: true })
  ).toBeVisible();

  await page.getByLabel('Familienname').fill(familyName);
  await page.getByLabel('Familienpasswort').fill('BrowserTest!2026');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();

  await page.getByLabel('Name').fill('Alex Browser');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Familienraum eröffnen' }).click();

  const releaseNotes = page.locator('.release-notes-layer');
  await expect(releaseNotes).toBeVisible();
  await releaseNotes.locator('.release-notes-confirm').click();
  await expect(releaseNotes).toBeHidden();
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await page.getByRole('dialog', { name: 'Menü' })
    .getByRole('button', { name: 'Kalender', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: /kalender/i })
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.app-header')).toHaveCSS('position', 'fixed');
  await expect(page.locator('.calendar-history-toggle')).toHaveCSS(
    'justify-content',
    'center'
  );
  await expect(page.locator('.calendar-import-action')).toHaveCSS(
    'justify-content',
    'center'
  );
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.locator('.app-header').evaluate(
    element => Math.round(element.getBoundingClientRect().top)
  )).toBe(0);
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Menü' })
  ).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await page.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

  // Reference viewport from the reported iPhone 17 Pro Max Safari issue.
  // Keep this exact CSS viewport in the regression suite so calendar actions
  // cannot silently disappear below the safe area again.
  await page.setViewportSize({ width: 440, height: 956 });

  const created = await page.evaluate(async () => {
    const date = new Date();
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
    const response = await fetch('/api/resources/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: `mobile-dialog-${Date.now()}`,
        title: 'Mobiler Dialog-Test',
        date: dateKey,
        time: '09:00',
        allDay: false,
        memberId: 'all',
        reminders: [10]
      })
    });
    return { ok: response.ok, body: await response.json() };
  });
  expect(created.ok).toBe(true);
  await page.goto('/?view=calendar');
  await page.getByRole('button', {
    name: 'Termin Mobiler Dialog-Test öffnen'
  }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Termin bearbeiten'
  });
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await expect(page.locator('.calendar-editor-dialog > footer')).toBeVisible();
  const viewportSafe = await dialog.evaluate(element => {
    const dialogBounds = element.getBoundingClientRect();
    const footerBounds = element.querySelector('footer').getBoundingClientRect();
    const actionBounds = Array.from(
      element.querySelectorAll('footer button:not([hidden])')
    ).map(button => button.getBoundingClientRect());
    return {
      dialogBottom: Math.ceil(dialogBounds.bottom),
      footerBottom: Math.ceil(footerBounds.bottom),
      actionBottom: Math.ceil(Math.max(...actionBounds.map(bounds => bounds.bottom))),
      viewportHeight: window.innerHeight
    };
  });
  expect(viewportSafe.dialogBottom).toBeLessThanOrEqual(viewportSafe.viewportHeight);
  expect(viewportSafe.footerBottom).toBeLessThanOrEqual(viewportSafe.viewportHeight);
  expect(viewportSafe.actionBottom).toBeLessThanOrEqual(
    viewportSafe.viewportHeight - 18
  );
  expect(viewportSafe.viewportHeight).toBe(956);

  await page.getByRole('button', {
    name: 'Termin duplizieren',
    exact: true
  }).click();
  await expect(dialog.getByLabel('Titel')).toHaveValue(
    'Mobiler Dialog-Test – Kopie'
  );

  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await page.goto('/?view=meals');
  await page.getByRole('button', { name: 'Rezeptbuch (0)', exact: true }).click();
  await page.getByRole('button', { name: 'Neues Rezept', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Bild auswählen', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Foto aufnehmen', exact: true })
  ).toBeVisible();
  await expect(
    page.locator('input[capture="environment"]')
  ).toHaveAttribute('accept', 'image/*');

  const schoolData = await page.evaluate(async () => {
    const childResponse = await fetch('/api/members', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Mika Browser',
        role: 'child',
        position: 'kind'
      })
    });
    const child = (await childResponse.json()).member;
    const lessonResponse = await fetch('/api/resources/schoolItems', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        memberId: child.id,
        kind: 'lesson',
        title: 'Mathe',
        subject: 'Mathe',
        weekday: 1,
        period: 1,
        color: '#3d7ea6'
      })
    });
    const lessonBody = await lessonResponse.json();
    return {
      childCreated: childResponse.ok,
      childId: child.id,
      lessonCreated: lessonResponse.ok,
      lessonError: lessonBody.error || ''
    };
  });
  expect(schoolData.lessonError).toBe('');
  expect(schoolData).toMatchObject({ childCreated: true, lessonCreated: true });

  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await page.getByRole('dialog', { name: 'Menü' })
    .getByRole('button', { name: 'Familienreise', exact: true })
    .click();
  await page.getByLabel('Ansicht für').selectOption({ label: 'Mika Browser' });
  await expect(page.getByLabel('Ansicht für')).toHaveValue(schoolData.childId);
  await page.getByRole('button', { name: 'Schule', exact: true }).click();
  const lessonCard = page.locator('.school-lesson-card.has-custom-color', {
    hasText: 'Mathe'
  });
  await expect(lessonCard).toBeVisible();
  const lessonVisuals = await lessonCard.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      backgroundImage: styles.backgroundImage,
      boxShadow: styles.boxShadow
    };
  });
  expect(lessonVisuals.backgroundImage).not.toBe('none');
  expect(lessonVisuals.boxShadow).toContain('5px');

  await lessonCard.click();
  await page.getByRole('button', {
    name: 'Schuleintrag bearbeiten',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Änderungen speichern',
    exact: true
  }).click();
  await expect(page.getByRole('button', {
    name: 'Eintragen',
    exact: true
  })).toBeVisible();
  const subjectColoursAfterUnchangedSave = await page.evaluate(async () => {
    const bootstrap = await fetch(`/api/bootstrap?cacheBust=${Date.now()}`, {
      cache: 'no-store'
    }).then(response => response.json());
    return bootstrap.resources.kidProfiles.find(
      profile => profile.memberId !== bootstrap.activeMemberId
    )?.schoolSubjectColors || {};
  });
  expect(subjectColoursAfterUnchangedSave).toEqual({});
});
