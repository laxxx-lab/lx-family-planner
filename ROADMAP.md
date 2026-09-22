# Product roadmap

LX Family Planner is already a broad family operating system. The next stage is
about reliability, openness and optional depth rather than placing every
possible household feature in the core app.

## Now

- complete and continuously verify the English and German interfaces;
- harden mobile and offline read access for calendar, chores and shopping;
- finish the guided backup and Family Cloud restore experience;
- keep installation and safe updates predictable across Docker, Proxmox,
  Unraid and Umbrel.

### In-flight fixes and improvements (from GitHub issues and Reddit feedback)

The main bodies of issues #3 and #11 are complete (profile switching, Home
Assistant, cloud error codes, ntfy, hideable modules, plain themes, custom CSS,
adult profiles, shared tasks, recipe editing with Tandoor import, dynamic waste
tile, and the read-only wall-display profile). This list captures only the
**open follow-ups** from the comment threads, the new issue #15, and Reddit.

Usability bugs to resolve first, with the highest-impact items listed:

- "Today at a glance" counter showing every calendar event instead of just
  today's events (#15).
- Android back/gesture navigation closing the app instead of navigating back;
  Capacitor hardware-back handling to respect in-app history (#15).
- "My events" in "My area" starting mid-June instead of today, while the
  tablet view already shows the correct day (#11 comment).
- Events assigned to me labelled as "family event" instead of reflecting the
  assignee (#15).
- Rendering issues in the view/theme studio ("Ansichtsatelier") (#15).
- Tab bar shifting horizontally between tabs and the last tab (e.g. Pinboard)
  being clipped in browsers such as Firefox (#3 comment).
- "Create family" dialog stalling after entering name and password (Reddit).

Mobile, calendar and tablet improvements:

- compact greeting widget and consistent layout across sub-views (#15);
- bundle waste-collection pickups that fall on the same day into one entry,
  and move the waste-calendar configuration into settings (#15);
- colour-coded events in lists and overviews, not only in the calendar grid;
- real week and month calendar views so free time slots become visible (#15);
- consistent navigation: clicking a card opens it directly on web and mobile,
  not only on mobile (#15);
- flexible wall-tablet task list (4 / 8 / all) with scrollbar and
  prioritisation/sort, replacing the fixed 4-item limit (#11 comment).

## Next

- **Calendar quality release:** duplicate a local event as a starting point for
  a similar one, add recurring locally-created events, then provide a genuine
  time-based day/week view with durations and visible overlaps.
  The week timeline now shows 00:00–24:00 in the normal page flow, so early
  and late appointments are never hidden.
- **Generic WebDAV Family Cloud:** an optional NAS/WebDAV mode alongside
  Nextcloud for browsing folders, creating folders, upload, download, preview
  and deletion. It will use an app password where supported. Nextcloud-only
  functions such as account provisioning, quota display, browser embedding,
  backups and two-way calendar sync remain separate. The isolated, tested
  server-side DAV client now covers connection checks and file operations; the
  encrypted integration storage, API routes and settings UI are the remaining
  steps before this mode can be enabled for families.
- harden the new generic two-way CalDAV mode with a broader server
  compatibility matrix and guided calendar discovery;
- calendar import from Google Calendar and iCloud accounts;
- optional waste-collection subscriptions via URL (not only ICS upload);
- optional Mealie, Immich and Paperless-ngx connections;
- custom recurrence (yearly, quarterly) for maintenance tasks;
- short-lived invitation links for adding a trusted device or relative;
- optional modules for pantry, household budget and other advanced areas;
- accessible large-control mode for grandparents and managed profiles;
- additional interface languages with a reviewed, owner-backed catalogue.

## Later / under evaluation

- opt-in Android family location sharing: visible on-device tracking status,
  per-profile pause controls, no required third-party cloud and no location
  history in the first release; optional arrival alerts and short retention
  only after the consent and battery model have been proven;
- optional at-rest database encryption with a documented recovery model;
- Telegram profile linking through a bot and expiring QR/start links;
- optional Cosmos OpenID Connect sign-in with explicit profile linking,
  automatic first-profile creation and carefully mapped Cosmos groups;
- voice-assisted kitchen capture;
- official Google and Outlook account connections;
- opt-in family albums and seasonal household checklists.

## Product principles

- Children are supported, not monitored.
- Private data is filtered and authorised on the server.
- Integrations are optional and can be disconnected completely.
- Rewards stay positive; balances never fall below zero.
- Updates preserve existing family history or roll back safely.
- Core navigation stays useful without installing optional modules.

The longer German planning document is available at
[docs/PRODUCT_ROADMAP.de.md](docs/PRODUCT_ROADMAP.de.md).
