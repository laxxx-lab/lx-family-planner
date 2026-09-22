import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const projectRoot = process.cwd();
const scriptPaths = [
  path.join(projectRoot, 'scripts', 'pve-helper.sh'),
  path.join(projectRoot, 'scripts', 'pve-guest-install.sh'),
  path.join(projectRoot, 'scripts', 'pve-manage.sh'),
  path.join(projectRoot, 'scripts', 'proxmox-lxc.sh'),
  path.join(projectRoot, 'scripts', 'nextcloud-public-url.sh'),
  path.join(projectRoot, 'scripts', 'docker-update.sh'),
  path.join(projectRoot, 'scripts', 'docker-auto-update.sh'),
  path.join(projectRoot, 'scripts', 'docker-entrypoint.sh'),
  path.join(projectRoot, 'scripts', 'install-auto-update.sh')
];
const scripts = Object.fromEntries(
  scriptPaths.map(file => [
    path.basename(file),
    fs.readFileSync(file, 'utf8')
  ])
);
const windowsGitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
const bashExecutable =
  process.platform === 'win32' && fs.existsSync(windowsGitBash)
    ? windowsGitBash
    : 'bash';

test('PVE helper scripts remain valid Bash', t => {
  const check = spawnSync(
    bashExecutable,
    ['-n', ...scriptPaths],
    { encoding: 'utf8' }
  );
  if (check.error?.code === 'ENOENT') {
    t.skip('Bash ist in dieser Umgebung nicht installiert.');
    return;
  }
  assert.equal(
    check.status,
    0,
    check.stderr || check.stdout || 'Bash-Syntaxprüfung fehlgeschlagen.'
  );
});

test('PVE helper exposes a non-destructive help command', t => {
  const help = spawnSync(
    bashExecutable,
    [scriptPaths[0], '--help'],
    { encoding: 'utf8' }
  );
  if (help.error?.code === 'ENOENT') {
    t.skip('Bash ist in dieser Umgebung nicht installiert.');
    return;
  }
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--dry-run/);
  assert.match(help.stdout, /--non-interactive/);
  assert.match(help.stdout, /PUBLIC_APP_URL/);
  assert.doesNotMatch(help.stdout, /Container jetzt erstellen/);
});

test('Proxmox LXC entry point uses the maintained LX installer without third-party internals', () => {
  const launcher = scripts['proxmox-lxc.sh'];
  assert.match(launcher, /LX_RAW_ROOT/);
  assert.match(launcher, /scripts\/pve-helper\.sh/);
  assert.match(launcher, /ungültig/);
  assert.doesNotMatch(launcher, /community-scripts\/core/);
  assert.doesNotMatch(launcher, /docker\s+(compose|run|pull|build)/i);
});

test('PVE host helper creates a guarded unprivileged LXC', () => {
  const helper = scripts['pve-helper.sh'];
  assert.match(helper, /pveversion/);
  assert.match(helper, /pct create/);
  assert.match(helper, /--unprivileged 1/);
  assert.match(helper, /nesting=1,keyctl=1/);
  assert.match(helper, /pct status "\$CTID".*bereits vergeben/s);
  assert.match(helper, /Container jetzt erstellen\?/);
  assert.doesNotMatch(helper, /pct destroy|rm\s+-rf/);
});

test('PVE guest installer protects secrets and uses official Docker packages', () => {
  const installer = scripts['pve-guest-install.sh'];
  assert.match(installer, /download\.docker\.com\/linux\/debian/);
  assert.match(installer, /openssl rand -hex 48/);
  assert.match(installer, /chmod 600 "\$APP_DIR\/\.env"/);
  assert.match(installer, /docker compose build --pull/);
  assert.match(installer, /node server\/dataIntegrity\.js/);
});

test('PVE management command reuses protected update and backup paths', () => {
  const manager = scripts['pve-manage.sh'];
  assert.match(manager, /bash scripts\/docker-update\.sh/);
  assert.match(manager, /node server\/backup\.js/);
  assert.match(manager, /PUBLIC_APP_URL/);
  assert.match(manager, /nextcloud-public-url\.sh/);
  assert.match(manager, /docker compose/);
  assert.doesNotMatch(manager, /git reset|pct destroy|rm\s+-rf/);
});

test('Nextcloud public URL helper keeps the domain trusted', () => {
  const helper = scripts['nextcloud-public-url.sh'];
  assert.match(helper, /NEXTCLOUD_PUBLIC_URL/);
  assert.match(helper, /NEXTCLOUD_TRUSTED_DOMAINS/);
  assert.match(helper, /config:system:set trusted_domains/);
  assert.match(helper, /config:system:set overwrite\.cli\.url/);
  assert.match(helper, /config:system:set overwriteprotocol/);
  assert.doesNotMatch(helper, /config:system:set overwritehost/);
});

test('Linux Docker updates do not require Node.js on the host', () => {
  const updateScript = fs.readFileSync(
    path.join(projectRoot, 'scripts', 'docker-update.sh'),
    'utf8'
  );
  assert.match(updateScript, /grep -oP/);
  assert.doesNotMatch(
    updateScript,
    /expected_version="\$\(node\s+-p/
  );
});

test('automatic updates only install published stable releases', () => {
  const autoUpdate = scripts['docker-auto-update.sh'];
  assert.match(autoUpdate, /releases\/latest/);
  assert.match(autoUpdate, /latest_tag.*\^v\[0-9\]/s);
  assert.match(autoUpdate, /git merge --ff-only/);
  assert.match(autoUpdate, /docker-update\.sh --skip-pull/);
  assert.match(autoUpdate, /git merge-base --is-ancestor/);
  assert.match(autoUpdate, /flock -n/);
  assert.doesNotMatch(autoUpdate, /git reset|git pull/);
});

test('automatic update installer enables a guarded systemd timer', () => {
  const installer = scripts['install-auto-update.sh'];
  assert.match(installer, /lx-family-planner-auto-update\.timer/);
  assert.match(installer, /systemctl enable --now/);
  assert.match(installer, /EUID/);
  assert.doesNotMatch(installer, /rm\s+-rf|systemctl disable/);
});

test('Docker and PVE builds retain the signed public Android package', () => {
  const dockerIgnore = fs.readFileSync(
    path.join(projectRoot, '.dockerignore'),
    'utf8'
  );
  const globalApkRule = dockerIgnore.indexOf('*.apk');
  const publicApkRule = dockerIgnore.indexOf('!public/apk/latest.apk');
  assert.equal(globalApkRule >= 0, true);
  assert.equal(publicApkRule > globalApkRule, true);
  assert.equal(
    fs.statSync(
      path.join(projectRoot, 'public', 'apk', 'latest.apk')
    ).size > 1_000_000,
    true
  );
});

test('Docker startup repairs Unraid bind-mount permissions before dropping privileges', () => {
  const entrypoint = scripts['docker-entrypoint.sh'];
  const dockerfile = fs.readFileSync(
    path.join(projectRoot, 'Dockerfile'),
    'utf8'
  );
  const unraidTemplate = fs.readFileSync(
    path.join(projectRoot, 'templates', 'lx-family-planner.xml'),
    'utf8'
  );
  assert.match(entrypoint, /chown -R "\$data_uid:\$data_gid" \/app\/data \/app\/backups/);
  assert.match(entrypoint, /gosu "\$data_uid:\$data_gid" test -w \/app\/data/);
  assert.match(entrypoint, /exec gosu "\$data_uid:\$data_gid" "\$@"/);
  assert.match(entrypoint, /secret_file="\/app\/data\/\.lx-family-app-secret"/);
  assert.match(entrypoint, /randomBytes\(48\)/);
  assert.match(entrypoint, /gosu "\$data_uid:\$data_gid" test -r "\$secret_file"/);
  assert.match(entrypoint, /gosu "\$data_uid:\$data_gid" cat "\$secret_file"/);
  assert.match(entrypoint, /export APP_SECRET/);
  assert.match(dockerfile, /apt-get install -y --no-install-recommends gosu/);
  assert.match(dockerfile, /ENTRYPOINT \["\/usr\/local\/bin\/lx-family-entrypoint"\]/);
  assert.match(unraidTemplate, /Target="PUID" Default="99"/);
  assert.match(unraidTemplate, /Target="PGID" Default="100"/);
});

test('default Docker Compose grants only the capabilities needed for bind-mount repair', () => {
  const compose = fs.readFileSync(
    path.join(projectRoot, 'compose.yaml'),
    'utf8'
  );
  assert.match(compose, /PUID: "\$\{PUID:-1000\}"/);
  assert.match(compose, /PGID: "\$\{PGID:-1000\}"/);
  assert.match(compose, /cap_drop:\s*\n\s*- ALL/);
  assert.match(compose, /cap_add:\s*\n\s*- CHOWN\s*\n\s*- SETGID\s*\n\s*- SETUID/);
});

test('backup cleanup repairs legacy permissions without rolling back a healthy update', () => {
  const linuxUpdate = scripts['docker-update.sh'];
  const windowsUpdate = fs.readFileSync(
    path.join(projectRoot, 'scripts', 'docker-update.ps1'),
    'utf8'
  );
  assert.match(
    linuxUpdate,
    /docker compose run --rm --no-deps family-planner node server\/backup\.js --prune 3/
  );
  assert.match(
    linuxUpdate,
    /Sicherungsbereinigung konnte wegen alter Dateirechte nicht abgeschlossen werden/
  );
  assert.match(
    windowsUpdate,
    /'compose', 'run', '--rm', '--no-deps'/
  );
  assert.match(
    windowsUpdate,
    /Das Update bleibt aktiv; alle vorhandenen Sicherungen wurden unverändert behalten/
  );
});

test('Umbrel package uses one internally consistent pinned release without root capabilities', () => {
  const compose = fs.readFileSync(
    path.join(
      projectRoot,
      'deploy',
      'umbrel',
      'lx-family-planner',
      'docker-compose.yml'
    ),
    'utf8'
  );
  const manifest = fs.readFileSync(
    path.join(
      projectRoot,
      'deploy',
      'umbrel',
      'lx-family-planner',
      'umbrel-app.yml'
    ),
    'utf8'
  );
  const umbrelVersion = manifest.match(/^version: "([^"]+)"/m)?.[1] || '';
  assert.match(umbrelVersion, /^\d+\.\d+\.\d+$/);
  assert.match(
    compose,
    new RegExp(
      `image: ghcr\\.io/laxxx-lab/lx-family-planner:${umbrelVersion.replaceAll('.', '\\.')}@sha256:[a-f0-9]{64}`
    )
  );
  assert.match(compose, /user: "1000:1000"/);
  assert.doesNotMatch(compose, /cap_add:/);
  assert.match(manifest, /releaseNotes: ""/);
});

test('CasaOS and Cosmos packages use a pinned multi-architecture release with persistent storage', () => {
  const version = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  ).version;
  const casaCompose = fs.readFileSync(
    path.join(
      projectRoot,
      'deploy',
      'casaos',
      'lx-family',
      'docker-compose.yml'
    ),
    'utf8'
  );
  const cosmosCompose = JSON.parse(
    fs.readFileSync(
      path.join(
        projectRoot,
        'deploy',
        'cosmos',
        'LXFamily',
        'cosmos-compose.json'
      ),
      'utf8'
    )
  );
  const cosmosDescription = JSON.parse(
    fs.readFileSync(
      path.join(
        projectRoot,
        'deploy',
        'cosmos',
        'LXFamily',
        'description.json'
      ),
      'utf8'
    )
  );

  assert.match(
    casaCompose,
    new RegExp(
      `image: ghcr\\.io/laxxx-lab/lx-family-planner:${version.replaceAll('.', '\\.')}\\b`
    )
  );
  assert.match(casaCompose, /id: io\.github\.laxxx-lab\.lx-family/);
  assert.match(casaCompose, /source: \/DATA\/AppData\/\$AppID\/data/);
  assert.match(casaCompose, /source: \/DATA\/AppData\/\$AppID\/backups/);
  assert.match(casaCompose, /architectures:\s*\n\s*- amd64\s*\n\s*- arm64/);
  assert.doesNotMatch(casaCompose, /:latest\b/);
  assert.doesNotMatch(casaCompose, /\n\s*init:\s*true/);

  const cosmosService = cosmosCompose.services['{ServiceName}'];
  assert.equal(
    cosmosService.image,
    `ghcr.io/laxxx-lab/lx-family-planner:${version}`
  );
  assert.equal(cosmosService.labels['cosmos-auto-update'], 'false');
  assert.equal(cosmosService.labels['cosmos-persistent-env'], 'APP_SECRET');
  assert.equal(cosmosService.environment.includes('TRUST_PROXY=1'), true);
  assert.equal(cosmosService.init, undefined);
  assert.equal(cosmosService.routes[0].AuthEnabled, true);
  assert.equal(cosmosCompose.volumes['{ServiceName}-data'] !== undefined, true);
  assert.equal(cosmosCompose.volumes['{ServiceName}-backups'] !== undefined, true);
  assert.deepEqual(cosmosDescription.supported_architectures, ['amd64', 'arm64']);
});

test('Proxmox Helper-Scripts candidate follows the native LXC contribution model', t => {
  const candidateRoot = path.join(
    projectRoot,
    'deploy',
    'proxmox-helper-scripts'
  );
  const ctScript = path.join(candidateRoot, 'ct', 'lx-family.sh');
  const installScript = path.join(
    candidateRoot,
    'install',
    'lx-family-install.sh'
  );
  const metadata = JSON.parse(
    fs.readFileSync(path.join(candidateRoot, 'json', 'lx-family.json'), 'utf8')
  );
  const ctSource = fs.readFileSync(ctScript, 'utf8');
  const installSource = fs.readFileSync(installScript, 'utf8');

  assert.match(ctSource, /source <\(curl -fsSL .*build\.func/);
  assert.match(ctSource, /check_for_gh_release "lx-family" "laxxx-lab\/lx-family-planner"/);
  assert.match(ctSource, /create_backup \/opt\/lx-family\/\.env \/opt\/lx-family\/data \/opt\/lx-family\/backups/);
  assert.match(installSource, /NODE_VERSION="22" setup_nodejs/);
  assert.match(installSource, /ensure_dependencies curl ca-certificates gpg/);
  assert.match(installSource, /app="\$\{app:-lx-family\}"/);
  assert.match(installSource, /fetch_and_deploy_gh_release "lx-family" "laxxx-lab\/lx-family-planner" "tarball"/);
  assert.match(installSource, /ExecStart=\/usr\/bin\/node --env-file-if-exists=\.env server\.js/);
  assert.doesNotMatch(`${ctSource}\n${installSource}`, /docker\s+(compose|run|pull|build)/i);
  assert.equal(metadata.slug, 'lx-family');
  assert.equal(metadata.type, 'ct');
  assert.equal(metadata.updateable, true);
  assert.equal(metadata.privileged, false);
  assert.equal(metadata.interface_port, 3001);
  assert.deepEqual(metadata.architectures, ['amd64']);

  const check = spawnSync(bashExecutable, ['-n', ctScript, installScript], {
    encoding: 'utf8'
  });
  if (check.error?.code === 'ENOENT') {
    t.skip('Bash ist in dieser Umgebung nicht installiert.');
    return;
  }
  assert.equal(check.status, 0, check.stderr || check.stdout);
});
