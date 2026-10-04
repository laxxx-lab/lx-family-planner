# Community follow-ups: Wall display, tasks, school and pinboard

## Goal

Resolve the active community follow-ups in one release: the wall display
must honour hidden tiles, tasks must support a visual cue and zero-star
chores, school schedules must avoid repeated time entry, and pinboard notes
must support adult-only visibility.

## Wall display

The existing dashboard-layout preference remains the source of truth. The
wall display uses the same normalized visible-widget list as the dashboard,
so a disabled tile cannot be rendered through a wall-specific fallback.
Tasks shown on the wall always come from family tasks, never from a wall
profile's own task list.

## Tasks

Tasks gain an optional single emoji `icon`; existing tasks remain unchanged.
`stars: 0` is preserved as an explicit no-reward task. Defaults of ten stars
apply only when the field is absent. Task cards and child dashboards show the
icon where present.

## School schedules

Add a family-level timetable template with ordered periods (label, start and
end time) and a reusable subject list. New lessons refer to the period and
subject, while existing free-form lessons remain readable. Admins can add a
period once, use it in every weekday column, and choose a default or custom
subject. No automatic import is included in this release; ICS stays an
existing calendar-import route rather than becoming a second school model.

## Pinboard privacy

Notes have `visibility: 'family' | 'adults'`, defaulting to family. The API
filters adult-only notes for children, teens, pets and wall profiles. Server
mutation rules continue to require adults for creating or changing the
visibility; the UI merely reflects this rule. Optional emoji is stored as a
bounded text field and displayed with a note.

## Safety and testing

All data additions are backwards compatible. Tests cover normalized wall
widgets, zero stars, board visibility at the API boundary, and timetable
period reuse. Existing role and content filtering remains authoritative.

## Release

The release includes the already-tested Nextcloud multi-calendar branch,
version bump, signed Android APK, container metadata for Docker/CasaOS,
Umbrel and Cosmos, changelog/release notes, tag and GitHub release.
