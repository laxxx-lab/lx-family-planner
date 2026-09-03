# Changelog

All notable changes to LX Family Planner are documented here.

German version: [CHANGELOG.de.md](CHANGELOG.de.md)

## [Unreleased]

## [1.20.3] — 2026-09-03

### Shopping item icon hotfix

- Shopping items now receive a fitting symbol for the actual product rather
  than sharing one department icon. Eggs, butter, cheese, fruit, vegetables,
  drinks and household supplies are easier to scan at a glance.
- The improvement applies to the catalog, shopping list, dashboard and kitchen
  display. Existing generic icons are corrected while intentional custom icons
  remain untouched.

## [1.20.2] — 2026-09-03

### Mobile Family Journey hotfix

- The complete Family Journey navigation is now always visible on Android
  phones. Its seven areas are arranged in a compact, sticky two-row grid
  instead of a horizontally hidden scrolling strip.

## [1.20.1] — 2026-09-03

### Family phone book and a calmer timetable

- Parents can keep important numbers for doctors, school, care providers,
  authorities, insurance and emergencies in a searchable Family Phone Book.
  Children and managed profiles cannot read this adult-only directory.
- Timetable subjects use a restrained, curated palette with a fine accent line
  and colour dot instead of broad colour blocks. This keeps the timetable
  readable while making subjects easier to recognise.
- The subject palette is validated by the server, so imported or outdated
  arbitrary colours cannot make a timetable look inconsistent.

## [1.20.0] — 2026-08-27

### Safer family moves and everyday recovery

- Families can now export an encrypted, password-protected move file from the
  Parent Hub and import it on a new, empty LX Family server.
- The move includes family profiles, PINs, calendar, tasks, notes, recipes,
  local recipe images and the recycle bin. Device- and server-specific
  connections are deliberately reconnected on the new server.
- Deleted events, tasks, notes, meals, recipes, shopping entries and chat
  messages are kept in a family recycle bin, where parents can restore an
  individual entry or remove it permanently.

### Faster calendar entry

- A click on a free space in the weekly view starts a 30-minute event. Dragging
  over a free time range opens the event form with that exact span already set.
- Overlapping calendar cards use the available column width more effectively on
  narrow and wide displays.

### Easier mobile forms

- On touch devices, opening the event form no longer immediately focuses the
  title input, so the keyboard does not hide the time and action controls.

## [1.19.6] — 2026-08-27

### Notification settings

- Browser validation of ntfy topics no longer emits a console error in modern
  browsers. Safe topic names with letters, numbers, underscores and hyphens
  remain accepted.

## [1.19.5] — 2026-08-27

### Android weekly calendar

- The weekly view no longer captures vertical swipes. The whole calendar page
  scrolls up and down again while day columns remain horizontally reachable on
  narrow devices.

## [1.19.4] — 2026-08-26

### Clearer family calendar

- The weekly view now covers the complete day from 00:00 to 24:00. Concurrent
  events remain at their actual time and are separated horizontally.
- Calendar sources can be assigned to selected family profiles. A warning
  points out source colours that are already in use.
- ICS exports include end times and end dates so other calendars import events
  correctly.
- The server-address dialog no longer blocks page scrolling, and backup
  controls remain contained on narrow admin screens.

## [1.19.3] — 2026-08-25

### Recurring family events

- locally created calendar events can repeat daily, weekly, monthly, yearly or
  on a custom schedule;
- an optional end date limits a series, while reminders are delivered for each
  individual occurrence;
- a series remains one tidy entry: editing and deleting deliberately affect
  the entire series, and two-way CalDAV exports it as a standard RRULE.

## [1.19.2] — 2026-08-25

### A clearer shared calendar and safer family operations

- calendar events now keep one stable day column, stack overlapping cards so
  every title remains readable, and use a fixed family colour or the assigned
  person's profile colour;
- the full navigation is available through a compact menu, while personal
  quick links stay short and keep the personal dashboard first;
- iPhone users get an explicit Safari Home Screen installation guide, and the
  sign-in screen no longer uses space for release notes;
- families can create and restore verified database backups, including a
  guarded weekly schedule, connect an optional two-way CalDAV calendar, and
  use a personal WebDAV server or NAS for the family archive.

## [1.19.1] — 2026-08-23

### A calmer timetable

- The weekly timetable is now one clear grid with periods on the left and
  weekdays along the top, rather than separate lists for each day.
- Edit, one-off cancellation and delete actions stay out of the timetable and
  appear for parents only after selecting the relevant subject.
- On narrow screens the complete timetable remains readable through horizontal
  swiping instead of crushing subjects into tiny cards.

## [1.19.0] — 2026-08-23

### School, CalDAV, chores and iOS

- child profiles gain a complete editable weekly timetable with subjects,
  rooms, teachers and lesson times;
- external calendars can be connected read-only through ICS or CalDAV.
  Synology Calendar account URLs are discovered automatically, while unrelated
  Synology system collections are skipped safely;
- chores can recur daily, on selected weekdays, weekly or monthly and can be
  hidden until their due day;
- Safari on iOS explains **Share → Add to Home Screen**, after which LX starts
  from its own icon without the Safari bar;
- headers, profile switching, calendar actions, quick add and dialogs remain
  reachable and correctly scrollable on narrow iOS screens;
- recipe viewing and editing provide clearer mobile feedback without clipping
  important actions;
- the sign-in screen gives everyone a compact overview of the installed release
  even before profile selection.

## [1.18.4] — 2026-08-11

### Calendar and mobile overview

- the selected calendar layout (agenda, week or month) now stays saved per
  profile and device, even after navigating to another area;
- calendar and personal overview use a significantly denser header on phones,
  so the actual content becomes visible sooner;
- the dashboard waste card now shows the correct bin, or all matching bins for
  a grouped pickup, instead of a generic icon.

## [1.18.3] — 2026-08-10

### Reliable update cleanup

- after a successful data and health check, backup cleanup now runs in a fresh
  LX container so legacy bind-mount ownership can be repaired before pruning;
- if legacy file permissions still prevent cleanup, the verified update stays
  active and every existing backup is retained untouched instead of triggering
  an unnecessary rollback.

## [1.18.2] — 2026-08-10

### Android server persistence and home-server stores

- the Android app now stores the selected LX Family server in native Android
  preferences and restores it before the web app starts, so an app update no
  longer loses the configured server;
- existing WebView server settings migrate automatically to native storage;
- Docker installations generate and persist a strong application secret when
  none was configured explicitly;
- the hardened container startup no longer conflicts with the init process;
- APK metadata is accepted only when its checksum matches the APK actually
  served by the server, preventing a stale persistent APK from blocking an
  Android update;
- the Dockerfile now also builds on older Docker engines without BuildKit;
- install packages, metadata and screenshots for CasaOS/ZimaOS and Cosmos are
  included;
- the first FamilyContext responsibilities were split into focused bootstrap,
  notification, toast and helper modules without changing family data.

## [1.18.1] — 2026-08-09

### LX Family branding

- LX Family Planner is now presented everywhere as **LX Family · Private
  Family OS**;
- the Android app, Docker image, repository slug and application id deliberately
  stay compatible, so existing installations update without a reinstall;
- the release image no longer advertises a developer-specific public domain,
  which keeps self-hosted installations neutral.

## [1.18.0] — 2026-08-08

### Languages and bug fixes

- five new interface languages: French, Spanish, Italian, Dutch and Polish;
  missing translations fall back to English cleanly;
- "Today at a glance" and the calendar badge count only the current day's
  events instead of every upcoming event (#15);
- "My events" starts at the current day (#11);
- assigned events show the profile names instead of always "family event"
  (#15);
- the tab bar no longer shifts when switching, and the last tab stays
  reachable in Firefox (#3);
- the hardware back button and gesture navigates back inside the app on
  Android instead of exiting (#15);
- the dashboard studio no longer clips its footer when the conditional
  picker blocks are shown (#15);
- the "create family" onboarding dialog shows why "Next" is inactive
  (password too short or invite code required).

## [1.16.2] — 2026-08-04

### Notifications, wall display and finer profile permissions

- ntfy is available as an additional, optional push channel alongside Gotify;
- a dedicated, read-only wall display profile exposes only reading and the two
  intended check-off actions, so a shared tablet cannot change settings or
  switch profiles;
- the tablet view asks "who completed this?" with large profile bubbles instead
  of navigating away, so checking off a chore stays fast at a central display;
- chores can be marked as shared, so a single completion counts for everyone
  that day while the stars go to the person who actually did it;
- adult "Tochter (erwachsen)" and "Sohn (erwachsen)" positions receive
  family-admin rights, and cloud or mailbox access can be granted per profile
  independently of the role;
- switching from an adult to a child profile now immediately closes the cloud
  and parent areas and returns to the dashboard;
- individual modules such as the mailbox or cloud can be hidden globally for the
  whole family or per profile.

### Calendar, Home Assistant and cloud uploads

- the waste-collection card can be set to always, never, or only a configurable
  number of days before the next pickup;
- the Home Assistant entity list scrolls within a capped height instead of
  collapsing many devices into thin lines, and selecting a device expands the
  "allow control" detail panel;
- failed cloud uploads now surface the concrete HTTP status code instead of
  failing silently.

### Voluntary project support

- the repository is prepared for the official GitHub Sponsors button;
- a quiet, bilingual support card for one-time or monthly sponsorship is ready
  for the public sign-in page and the adult family settings, but remains hidden
  until the Sponsors profile has actually been approved;
- child profiles, pet profiles, dashboards, and profile selection never show a
  sponsorship prompt;
- sponsorship stays optional and does not unlock features, remove limits, or
  create a paid support lane.

## [1.16.1] — 2026-08-04

### Android sharing and mobile language hotfix

- the Android app now appears as a share target for My Recipe Box `.rtk`
  backups and compatible ZIP streams;
- shared RTK files open the recipe area automatically and import recipes,
  embedded images and source links without a manual file-picker detour;
- incoming archives are copied into protected temporary app storage, limited
  to 120 MB and validated before import;
- the German/English selector now remains fully visible on narrow Android
  screens and shows the active `DE` or `EN` language directly in the header;
- existing families, profiles, recipes, files and settings remain unchanged.

## [1.16.0] — 2026-08-03

### Birthdays, shared chores, recipe maintenance and safe custom themes

- profiles can store an optional birthday; read-only family calendar events and
  reminders are generated automatically;
- initial setup guarantees that at least one signed-in adult can manage the
  family, and repairs affected older households during migration;
- one chore can be offered to several profiles while stars are assigned to the
  person who actually completed it;
- child completions still require approval from the adult who created the
  chore;
- recipes can be created and edited with complete ingredients and preparation
  steps;
- official Tandoor exports, public Facebook Reel drafts and My Recipe Box
  `.rtk` backups can be imported with images where the source provides them;
- the waste-collection dashboard card can be always visible, hidden or shown
  only shortly before the next collection;
- calm motif-free themes and a separate server-validated custom CSS theme are
  available without overwriting built-in designs;
- the complete interface can be switched between English and German before
  login and from the main header;
- the repository now has an English-first presentation, bilingual contribution
  and security documents, and English/German issue forms;
- this release was verified locally before publication and keeps existing
  family data compatible.

## [1.15.0] — 2026-08-03

### Calendar editing, multiple participants and child timetables

- calendar entries can be opened, edited and deleted with their full details;
- a single event can belong to several family members;
- shared events can be updated by the owning family;
- adults can enable and maintain a weekly school timetable for each child;
- one-off cancelled lessons are clearly marked and cleaned up after expiry;
- recipe actions remain usable on narrow phone screens;
- existing families, calendar sources, profiles and settings remain compatible.

For the complete historical record, see [CHANGELOG.de.md](CHANGELOG.de.md).
