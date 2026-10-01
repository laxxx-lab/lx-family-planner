# Store-Veröffentlichungen

LX Family is prepared for distribution through GitHub Container Registry,
Unraid Community Applications, Umbrel, CasaOS and Cosmos.

## Current public status

- **Unraid Community Applications:** live and installable at
  [LX Family on Unraid](https://ca.unraid.net/apps/lx-family-planner-1kvgxdh1njii8h).
- **Umbrel:** package review is open at
  [getumbrel/umbrel-apps#5939](https://github.com/getumbrel/umbrel-apps/pull/5939).
- **CasaOS:** package review is open at
  [IceWhaleTech/CasaOS-AppStore#999](https://github.com/IceWhaleTech/CasaOS-AppStore/pull/999).
- **Cosmos:** the initial package was merged in
  [azukaar/cosmos-servapps-official#267](https://github.com/azukaar/cosmos-servapps-official/pull/267).
  Patch updates are submitted separately to the marketplace.

Store submissions and updates require a maintainer to approve and publish the
package after automated checks have passed. A published LX Family GitHub
release updates the source package, but never bypasses that external review.

## Shared release image

All stores use the same signed release source:

```text
ghcr.io/laxxx-lab/lx-family-planner:<published-release-version>
```

For every store submission, take the matching immutable digest from the
published GitHub release. Do not copy a digest from an older release.

Supported platforms:

- `linux/amd64`
- `linux/arm64`

Persistent paths:

- `/app/data`
- `/app/backups`

The `APP_SECRET` must stay unchanged during updates. Umbrel supplies its
deterministic `APP_SEED`; Unraid asks for a masked random value during setup.
The CasaOS package creates and persists a per-installation secret in its data
folder on first start, while Cosmos supplies a generated persistent secret.
The visible product name is **LX Family · Private Family OS**. Repository,
image and package identifiers deliberately keep `lx-family-planner` so existing
store installs update in place; see [the renaming note](RENAMING.md).

## Unraid

Files:

- `/ca_profile.xml`
- `/templates/lx-family-planner.xml`

Submission:

1. publish the GHCR image and make the package public,
2. open `https://ca.unraid.net/submit`,
3. submit this GitHub repository,
4. run **Validate** and **Scan**,
5. complete the moderator review.

## Umbrel

Files:

- `/deploy/umbrel/lx-family-planner/docker-compose.yml`
- `/deploy/umbrel/lx-family-planner/umbrel-app.yml`
- `/deploy/umbrel/SUBMISSION.md`

The package must be tested on umbrelOS before opening the pull request against
`getumbrel/umbrel-apps`.

For every update, publish the GitHub release first. Then take the exact
multi-architecture GHCR digest for that version, pin it in the Umbrel compose
file as `:<version>@sha256:<digest>`, bump `umbrel-app.yml` and run the Umbrel
update test. Keep `releaseNotes` empty while the Umbrel pull request is a new
app submission. Never pin Umbrel to a guessed digest or the moving `latest`
tag.

## CasaOS

Files:

- `/deploy/casaos/lx-family/docker-compose.yml`
- `/deploy/casaos/SUBMISSION.md`

CasaOS v2 packages use one Compose file with a top-level `x-casaos` metadata
block. The LX package has two persistent bind mounts below CasaOS AppData: one
for `/app/data`, one for `/app/backups`. It exposes only port 3001 and starts
with first-family registration protection.

For every release, update the image tag, `x-casaos.version`, date and release
notes together. Copy the whole `lx-family/` folder into the AppStore PR so the
reviewed icon and screenshots travel with the manifest.

## Cosmos

Files:

- `/deploy/cosmos/LXFamily/cosmos-compose.json`
- `/deploy/cosmos/LXFamily/description.json`
- `/deploy/cosmos/SUBMISSION.md`

Cosmos uses a JSON Compose superset with a generated `APP_SECRET`, two named
volumes and a routed web entry point. The Cosmos route has `AuthEnabled: true`,
so Cosmos authentication is the first gate. LX Family keeps its own login for
family-specific profiles and permissions. Since the route is the only web
entry point, `TRUST_PROXY=1` lets LX recognize the HTTPS connection forwarded
by Cosmos safely.

`cosmos-auto-update` remains disabled. LX updates must follow a published
release and preserve the database and backup volumes; platform-wide automatic
container updates would bypass LX's own pre-update backup checks.

## Release safety

Every store test must cover:

1. clean install,
2. family and profile creation,
3. restart with unchanged data,
4. update to a newer image,
5. database and backup persistence,
6. health endpoint,
7. rollback using an LX backup.
