# Umbrel submission package

Copy the `lx-family-planner` directory into a branch of
`getumbrel/umbrel-apps`, test it on an umbrelOS Linux VM and open an App
Submission pull request.

The initial submission intentionally keeps `gallery: []` and
`releaseNotes: ""`, as required by the Umbrel submission guide. Each later
update must use the exact published GHCR version and multi-architecture digest.

Use these existing 1440×900 product views in the submission:

1. `docs/screenshots/demo-dashboard.png`
2. `docs/screenshots/demo-profilauswahl.png`
3. `docs/screenshots/demo-kinderprofil.png`
4. `docs/screenshots/demo-haustierprofil.png`
5. `docs/screenshots/demo-tablet-modus.png`

## Verified on umbrelOS

Verified on July 30, 2026:

- umbrelOS 1.7.4 in a Proxmox EFI VM,
- `linux/amd64`,
- fresh install through `umbreld`,
- launch through `http://umbrel.local:3413`,
- first-run family creation with an adult and a child profile,
- dashboard and calendar,
- health endpoint and Android APK download,
- app restart with persisted SQLite data,
- app update lifecycle with persisted SQLite data,
- complete VM reboot with Umbrel and LX autostart,
- settled app logs with no actionable errors.

The image index also exposes `linux/arm64`; runtime testing was performed on
`linux/amd64`.

The linter reports the intentional `security_opt` entry. It only enables
`no-new-privileges:true` as additional container hardening. LX does not request
privileged mode, host networking, devices, capabilities, broad host mounts, or
access to the Docker socket.

Before opening the pull request:

1. verify a clean install,
2. restart the app and confirm all data is still present,
3. update the app and confirm `/app/data` and `/app/backups` remain intact,
4. test the dashboard, login, calendar and Android download link.

The package is pinned to the published `1.21.1` multi-architecture digest:
`sha256:6b4c1482aadf458e5b3e3faf1ebf0f9d775f18326d61f85e6fe56fa18e03017f`.
