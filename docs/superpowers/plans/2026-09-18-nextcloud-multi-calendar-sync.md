# Nextcloud Multi-Calendar Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Route LX events to a shared Nextcloud calendar or to a configured personal calendar for exactly one family member.

**Architecture:** The existing nextcloud integration remains the backwards-compatible shared target. Additional encrypted personal CalDAV targets are persisted separately and receive stable providers named nextcloud-target:<id>. A pure routing helper chooses exactly one target per local event, and each target executes the existing conflict-safe CalDAV sync with an ownership predicate.

**Tech Stack:** Node.js, SQLite, Express, React, CalDAV/WebDAV, node:test, Playwright.

**Spec:** docs/superpowers/specs/2026-09-18-nextcloud-multi-calendar-sync-design.md

## Global Constraints

- Keep the existing nextcloud integration and its provider mappings as the shared target.
- Write one LX event to exactly one target; never fan out shared events to personal calendars.
- Store only encrypted app-password connections.
- Delete remotely only records known through LX mappings.
- Keep anonymous/public calendar feeds read-only.
- Add no dependencies.

---

## File Structure

- Create server/nextcloudCalendarTargets.js for target normalization, provider selection and pure routing.
- Create server/nextcloudCalendarTargets.test.js for target validation and routing tests.
- Modify server/database.js for the target table and CRUD methods.
- Modify server/nextcloud.js for routing-aware export, mapping cleanup and import defaults.
- Modify server/app.js for target APIs, scheduled sync and legacy shared-target adaptation.
- Modify src/context/familyContextState.js and src/context/FamilyContext.jsx for bootstrap and API actions.
- Create src/components/Admin/NextcloudCalendarTargets.jsx for target management.
- Modify src/components/Admin/NextcloudSettings.jsx and all adminCloud locale files.
- Modify server/nextcloud.test.js and add e2e/nextcloud-calendar-targets.spec.js.

### Task 1: Pure calendar-target routing

**Files:**
- Create: server/nextcloudCalendarTargets.js
- Test: server/nextcloudCalendarTargets.test.js

**Interfaces:**
- routeEventToCalendarTarget(event, { sharedTarget, personalTargets }) returns one enabled target or null.
- targetProvider(target) returns nextcloud for kind family and nextcloud-target:<id> for kind member.
- normalizePersonalCalendarTarget(input, members) validates an enabled member target.

- [ ] **Step 1: Write failing routing tests**

~~~js
test('one assigned member uses that member target', () => {
  assert.equal(
    routeEventToCalendarTarget({ memberIds: ['anna'] }, {
      sharedTarget,
      personalTargets: [{ id: 'anna', kind: 'member', memberId: 'anna', enabled: true }]
    }).id,
    'anna'
  );
});

test('family, multiple members and missing targets use the shared target', () => {
  assert.equal(routeEventToCalendarTarget({ memberIds: [] }, options).id, 'shared');
  assert.equal(routeEventToCalendarTarget({ memberIds: ['anna', 'ben'] }, options).id, 'shared');
  assert.equal(routeEventToCalendarTarget({ memberIds: ['ben'] }, options).id, 'shared');
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test server/nextcloudCalendarTargets.test.js

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimal routing and validation**

~~~js
export function routeEventToCalendarTarget(event, { sharedTarget, personalTargets = [] }) {
  const memberIds = [...new Set(Array.isArray(event?.memberIds)
    ? event.memberIds.filter(Boolean)
    : [])];
  if (memberIds.length === 1) {
    const personal = personalTargets.find(target =>
      target.enabled && target.memberId === memberIds[0]
    );
    if (personal) return personal;
  }
  return sharedTarget?.enabled ? sharedTarget : null;
}

export function targetProvider(target) {
  return target?.kind === 'family' ? 'nextcloud' : 'nextcloud-target:' + target.id;
}
~~~

Reject a missing member, a member outside the current family, duplicate member targets and a missing calendar URL.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: node --test server/nextcloudCalendarTargets.test.js

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add server/nextcloudCalendarTargets.js server/nextcloudCalendarTargets.test.js
git commit -m "feat(nextcloud): route events to calendar targets"
~~~

### Task 2: Persist encrypted personal targets

**Files:**
- Modify: server/database.js
- Test: server/nextcloudCalendarTargets.test.js

**Interfaces:**
- createNextcloudCalendarTarget(familyId, target)
- listNextcloudCalendarTargets(familyId, { includeSecret })
- getNextcloudCalendarTarget(familyId, targetId, { includeSecret })
- updateNextcloudCalendarTarget(familyId, targetId, changes)
- deleteNextcloudCalendarTarget(familyId, targetId)

- [ ] **Step 1: Write failing persistence tests**

~~~js
test('a family cannot store two personal targets for one member', () => {
  createNextcloudCalendarTarget('family-a', targetFor('anna'));
  assert.throws(
    () => createNextcloudCalendarTarget('family-a', targetFor('anna')),
    /bereits.*Kalenderziel/i
  );
});
~~~

- [ ] **Step 2: Run them to verify they fail**

Run: node --test server/nextcloudCalendarTargets.test.js

Expected: FAIL because the database API is absent.

- [ ] **Step 3: Add a targeted SQLite migration and CRUD**

~~~sql
CREATE TABLE IF NOT EXISTS nextcloud_calendar_targets (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  name TEXT NOT NULL,
  calendar_href TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  last_synced_at INTEGER,
  last_success_at INTEGER,
  last_error TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(family_id, member_id)
);
~~~

Map rows to camel case and omit secretEncrypted unless includeSecret is true. Return status fields in the same shape as calendar subscriptions.

- [ ] **Step 4: Add legacy compatibility coverage**

~~~js
test('a configured legacy nextcloud integration remains the shared target', () => {
  const targets = calendarTargetsForFamily('family-a');
  assert.equal(targets.shared.provider, 'nextcloud');
});
~~~

- [ ] **Step 5: Run focused tests and commit**

Run: node --test server/nextcloudCalendarTargets.test.js

~~~bash
git add server/database.js server/nextcloudCalendarTargets.test.js
git commit -m "feat(nextcloud): store personal calendar targets"
~~~

### Task 3: Synchronize only events owned by one target

**Files:**
- Modify: server/nextcloud.js
- Test: server/nextcloud.test.js

**Interfaces:**
- syncNextcloudEvents accepts ownsEvent(event), defaulting to a function that returns true.
- Existing mappings whose local event is no longer owned by the target remove only the LX-created remote record and then remove their mapping.
- Imported personal-calendar records use the target member as default member ID.

- [ ] **Step 1: Write the failing move test with the existing CalDAV fake**

~~~js
test('moving Anna event to family removes its personal remote copy', async () => {
  const event = await syncTarget('anna-target');
  updateLocalEvent(event.id, { memberIds: [] });
  const stats = await syncTarget('anna-target');
  assert.equal(stats.deletedRemote, 1);
  assert.equal(mappingFor(event.id, 'nextcloud-target:anna-target'), null);
});
~~~

- [ ] **Step 2: Verify the red test**

Run: node --test server/nextcloud.test.js --test-name-pattern "moving Anna"

Expected: FAIL because current sync exports all eligible local events for a provider.

- [ ] **Step 3: Implement ownership-aware cleanup and export filtering**

~~~js
const ownsEvent = typeof options.ownsEvent === 'function'
  ? options.ownsEvent
  : () => true;

for (const mapping of mappings) {
  const local = localById.get(mapping.localId);
  if (local && !ownsEvent(local)) {
    if (remoteResource && wasCreatedByLx(remoteResource, familyId)) {
      await deleteRemoteEvent(connection, mapping.remoteHref, request);
      stats.deletedRemote += 1;
    }
    deleteIntegrationSyncItem(familyId, provider, 'events', mapping.localId);
    continue;
  }
}

localEvents = localEvents.filter(ownsEvent);
~~~

Do not change the existing local/remote conflict-copy policy for owned events.

- [ ] **Step 4: Add tests for personal import, shared export, conflict copies and destination failure**

~~~js
test('an event imported from Anna target is assigned to Anna', async () => {
  const { records } = await syncTarget('anna-target');
  assert.deepEqual(records[0].memberIds, ['anna']);
});
~~~

- [ ] **Step 5: Run suites and commit**

Run: node --test server/nextcloud.test.js server/caldav.test.js

~~~bash
git add server/nextcloud.js server/nextcloud.test.js
git commit -m "feat(nextcloud): sync one calendar target per event"
~~~

### Task 4: Add APIs and route all Nextcloud sync jobs

**Files:**
- Modify: server/app.js
- Test: server/nextcloudCalendarTargets.test.js

**Interfaces:**
- calendarTargetsForFamily(familyId) returns virtual shared target plus personal targets.
- syncNextcloudCalendarTarget(familyId, target) derives ownsEvent through routeEventToCalendarTarget.
- Adult-only routes: GET/POST /api/integrations/nextcloud/calendar-targets, PATCH/DELETE /api/integrations/nextcloud/calendar-targets/:targetId, POST .../:targetId/test and POST .../:targetId/sync.

- [ ] **Step 1: Write failing API tests**

~~~js
test('only adults create personal calendar targets', async () => {
  const response = await requestAsChild(
    'POST',
    '/api/integrations/nextcloud/calendar-targets',
    targetPayload()
  );
  assert.equal(response.status, 403);
});

test('a personal target must use a member of the active family', async () => {
  const response = await requestAsAdult(
    'POST',
    '/api/integrations/nextcloud/calendar-targets',
    { ...targetPayload(), memberId: 'foreign-member' }
  );
  assert.equal(response.status, 400);
});
~~~

- [ ] **Step 2: Verify the red tests**

Run: node --test server/nextcloudCalendarTargets.test.js

Expected: FAIL because the target API does not exist.

- [ ] **Step 3: Implement CRUD, connection test and scheduled sync**

Reuse existing app-password validation, encryption, calendar discovery and publishFamilyChange patterns. Sync the virtual shared target first, then each enabled personal target. Record one target failure without preventing the next target from synchronizing.

- [ ] **Step 4: Add fallback and target-change tests**

~~~js
test('removing Anna target routes later Anna events to the shared target', () => {
  assert.equal(
    routeEventToCalendarTarget({ memberIds: ['anna'] }, {
      sharedTarget,
      personalTargets: []
    }).id,
    'shared'
  );
});
~~~

- [ ] **Step 5: Run suites and commit**

Run: node --test server/nextcloud.test.js server/nextcloudCalendarTargets.test.js server/api-smoke.test.js

~~~bash
git add server/app.js server/nextcloudCalendarTargets.test.js
git commit -m "feat(nextcloud): manage personal calendar targets"
~~~

### Task 5: Configure personal targets in the admin UI

**Files:**
- Create: src/components/Admin/NextcloudCalendarTargets.jsx
- Modify: src/components/Admin/NextcloudSettings.jsx
- Modify: src/context/familyContextState.js
- Modify: src/context/FamilyContext.jsx
- Modify: src/i18n/locales/de/adminCloud.json and matching locale files

**Interfaces:**
- Context exposes nextcloudCalendarTargets plus create, update, delete, test and sync actions.
- The target component receives members, shared target, targets and these actions.

- [ ] **Step 1: Write the failing form-validation test**

~~~js
test('a personal target requires a family member and app password', () => {
  assert.equal(validateTargetForm({ memberId: '', password: '' }).valid, false);
});
~~~

- [ ] **Step 2: Verify the red test**

Run: node --test server/nextcloudCalendarTargets.test.js

Expected: FAIL until validation exists.

- [ ] **Step 3: Implement the smallest usable manager**

Show shared-target status first. Show one card per personal target with member name, chosen calendar, last successful sync and error. The add form requires member, URL, username, app password and discovered calendar; exclude members who already have a target. Reuse current test/sync controls and never render a saved password.

- [ ] **Step 4: Add translations and verify them**

Run: npm run check:i18n

Expected: all locale files contain the same new keys.

- [ ] **Step 5: Build and commit**

Run: npm run build

~~~bash
git add src/components/Admin/NextcloudCalendarTargets.jsx src/components/Admin/NextcloudSettings.jsx src/context/familyContextState.js src/context/FamilyContext.jsx src/i18n
git commit -m "feat(nextcloud): configure personal calendar targets"
~~~

### Task 6: Validate the browser journey and release safety

**Files:**
- Create: e2e/nextcloud-calendar-targets.spec.js
- Modify: relevant Nextcloud documentation in README.md if settings wording changes

**Interfaces:**
- Playwright stubs target APIs, configures Anna target and proves a saved password is not shown again.

- [ ] **Step 1: Write the failing browser flow**

~~~js
test('adult adds Anna personal calendar while shared target remains visible', async ({ page }) => {
  await page.goto('/');
  await openNextcloudSettings(page);
  await page.getByRole('button', { name: /persönlichen kalender/i }).click();
  await page.getByLabel(/familienmitglied/i).selectOption('anna');
  await page.getByRole('button', { name: /speichern/i }).click();
  await expect(page.getByText(/Anna.*persönlicher kalender/i)).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveValue('');
});
~~~

- [ ] **Step 2: Verify the red browser test**

Run: npx playwright test e2e/nextcloud-calendar-targets.spec.js

Expected: FAIL until UI and API wiring exist.

- [ ] **Step 3: Add required selectors, mock support and documentation**

Document routing, app-password requirement and shared-calendar fallback. Do not document OAuth, copied shared events or anonymous public write access.

- [ ] **Step 4: Run fresh full verification**

Run:

~~~bash
npx playwright test e2e/nextcloud-calendar-targets.spec.js
npm run check
git diff --check
~~~

Expected: browser flow passes, all server tests and production build pass, no whitespace errors.

- [ ] **Step 5: Review exact changes and commit**

~~~bash
git status --short
git add e2e/nextcloud-calendar-targets.spec.js README.md
git commit -m "test(nextcloud): cover personal calendar routing"
~~~

## Plan Self-Review

- Spec coverage: Tasks 1–4 cover routes, legacy compatibility, one-target sync, cleanup, conflicts and encrypted credentials. Task 5 covers admin configuration and translations. Task 6 covers browser testing, documentation and release safety.
- Placeholder scan: no unresolved markers and all test commands are exact.
- Type consistency: nextcloudCalendarTarget, memberId, calendarHref, secretEncrypted, routeEventToCalendarTarget, targetProvider, ownsEvent and nextcloud-target:<id> use one spelling throughout.
