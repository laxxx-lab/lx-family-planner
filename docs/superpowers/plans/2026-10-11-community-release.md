# Community release implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task in this session.

**Goal:** Deliver the approved community follow-ups and Cosmos compatibility as 1.22.0, including the signed APK and store submissions.

**Architecture:** Reuse JSON resource records and familySettings for compatible additions. Keep the Cosmos gate and LX profile permissions; use Capacitor's built-in native HTTP transport and a separate Android WebView for the proxy login, sharing Android cookies.

**Tech Stack:** React, Express, SQLite, Capacitor 8, Android Java, node:test, Playwright.

**Spec:** ../specs/2026-10-04-community-follow-ups-design.md. User authorized completion, validation and publication on 2026-10-11.

## Global constraints

- No new dependency; preserve existing family data, installation secrets and APK signing identity.
- OIDC remains deferred. Cosmos login only unlocks the proxy; LX authentication and profile permissions remain authoritative.
- Only Cosmos uses latest, because its maintainer confirmed fixed tags cannot update existing installations. Automatic unattended updating stays disabled.
- Publish source/image before submitting store changes. Do not claim physical Android delivery or a live user's deployment has been tested.

## Task 1: Cosmos and Android

Files: capacitor.config.json, android/app/src/main/java/com/lxfamily/planner/LXServerPreferencesPlugin.java, src/utils/apiConfig.js, src/components/ServerConfigModal.jsx, deploy/cosmos/LXFamily/cosmos-compose.json, docs/STORE_SUBMISSIONS.md, server/apiConfig.test.js, server/pveScripts.test.js.
- [x] Reproduce proxy redirects and verify native HTTP cookie handling in Capacitor sources.
- [x] Add an API regression for non-JSON proxy authentication responses. Run `node --test server/apiConfig.test.js` before and after.
- [x] Enable built-in native HTTP; add isolated proxy-login dialog with Android cookies, strict HTTP(S) URL validation and cleanup. Offer proxy sign-in in native server setup; retest health after closing.
- [x] Use latest in Cosmos manifest; document one-time existing-install migration without enabling unattended updates. Run store checks.

## Task 2: Wall display and tasks

Files: KitchenTabletView.jsx, shared/appAccess.js, ChoreRewardsPlanner.jsx, FamilyContext.jsx, ChildDashboard.jsx, server/app.js, e2e/community-follow-ups.spec.js.
- [x] Add browser regression that opens wall tile customization, hides a tile and checks globally disabled modules are absent.
- [x] Render customizer for wall and filter available widgets through existing module access rules.
- [x] Add zero-star task API test; preserve zero defaults, add bounded optional task icon, render it in task/dashboard cards and use existing emoji inputs.
- [x] Run targeted API/browser tests.

## Task 3: Pinboard privacy

Files: server/app.js, FamilyPinboard.jsx, FamilyContext.jsx, server/communityPrivacy.test.js.
- [x] Add API test with adult, child, teen, wall and no-profile sessions: adult note visible only to adult, ordinary note retains prior access.
- [x] Filter both bootstrap and resource reads; restrict adult-note mutations and visibility changes to adults. Normalize visibility/icon on create and patch.
- [x] Add adult-only visibility controls and optional emoji; verify via API and browser.

## Task 4: School template

Files: shared/schoolTimetable.js, server/app.js, FamilyLifeHub.jsx, server/schoolTimetable.test.js.
- [x] Test normalization of periods/subjects and resolving a reused period while retaining legacy times.
- [x] Store bounded family template in existing familySettings, resolving lesson period on server and client. Reject invalid/overlapping times and preserve existing free-form records.
- [x] Add adult template editor, reusable subject suggestions and period picker; verify two weekday lessons share times.

## Task 5: Verification and release

Files: package.json/package-lock.json, Android build metadata, shared/releaseNotes.js, CHANGELOG.md, docs/releases/v1.22.0.md, deploy store metadata, public/apk.
- [x] Review Nextcloud branch for target removal/mapping correctness and add needed regression checks.
- [x] Run `npm run check`, browser flows and release metadata checks; build signed APK with existing script and signing files, verify original signing certificate matches.
- [x] Review full diff and integrate branch into main, preserving unrelated untracked files. Publish v1.22.0 and check multi-architecture image/release assets.
- [x] Update existing CasaOS/Umbrel submissions and create Cosmos store update PR; attach created PRs and verify checks. Report actual external review status.

## Verification record (2026-10-11)

Tasks 1–4 implemented and verified. Nextcloud mapping/removal review repairs completed, including actual-creation provenance and failed-destination regression checks. `npm run check` passed; 180 server tests and all four Playwright flows passed. Signed APK rebuilt from the final frontend; original certificate retained. Database update simulation from 1.21.4 passed without fixture content changes. Independent final review found no release blockers. Release workflow 38161452598 succeeded; published APK matches the signed local build. The public 1.22.0 OCI index contains AMD64 and ARM64 and matches the release digest. Physical Android/Cosmos and live store runtime tests were not available.

CasaOS #999 and Umbrel #5939 updated; Cosmos update PR #321 created. All three are attached to the task. Local package validators passed (Umbrel has the intentional existing no-new-privileges warning). External maintainer approval and checks requiring maintainer authorization remain outside our control; these are submissions, not a claim of store publication.
