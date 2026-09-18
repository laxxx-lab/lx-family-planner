import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

function findApkCandidates(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'data/apk/latest.apk'),
    path.join(projectRoot, 'data/apk/LX-Family-Planner.apk'),
    path.join(projectRoot, 'public/apk/LX-Family-Planner.apk'),
    path.join(projectRoot, 'public/apk/latest.apk'),
    path.join(projectRoot, 'dist/apk/LX-Family-Planner.apk'),
    path.join(projectRoot, 'dist/apk/latest.apk'),
    path.join(projectRoot, 'LX-Family-Planner.apk'),
    path.join(projectRoot, 'dist/LX-Family-Planner.apk')
  ];
  return [...new Set(candidates)].filter(file => fs.existsSync(file));
}

function readApkMetadata(apkFile, { appVersion, cleanText }) {
  const candidates = apkFile
    ? [path.join(path.dirname(apkFile), 'version.json')]
    : [];
  for (const file of [...new Set(candidates)]) {
    try {
      const metadata = JSON.parse(
        fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
      );
      return {
        versionName: cleanText(metadata.versionName, appVersion, 40),
        versionCode: Math.max(0, Number(metadata.versionCode) || 0),
        buildKind:
          metadata.buildKind === 'release' ? 'release' : 'debug',
        builtAt: cleanText(metadata.builtAt, '', 80),
        sha256: /^[a-f0-9]{64}$/i.test(metadata.sha256 || '')
          ? metadata.sha256.toLowerCase()
          : ''
      };
    } catch {
      // Try the next local metadata file.
    }
  }
  return {
    versionName: appVersion,
    versionCode: 0,
    buildKind: 'debug',
    builtAt: '',
    sha256: ''
  };
}

function sha256ForFile(file) {
  return createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');
}

/**
 * Public runtime endpoints are intentionally separate from family data routes.
 * They are used before login by web browsers, Android and installation tools.
 */
export function registerRuntimeRoutes(app, {
  appVersion,
  appLanguage,
  supportedLanguages,
  normalizeRequestLanguage,
  publicAppUrl,
  isProduction,
  cleanText,
  projectRoot = process.cwd()
}) {
  const availableApkRelease = () => {
    const releases = findApkCandidates(projectRoot)
      .map(file => {
        const metadata = readApkMetadata(file, { appVersion, cleanText });
        const actualSha256 = sha256ForFile(file);
        return {
          file,
          metadata: {
            ...metadata,
            sha256: actualSha256
          },
          metadataMatchesFile:
            !metadata.sha256 || metadata.sha256 === actualSha256,
          stats: fs.statSync(file)
        };
      })
      .filter(
        release =>
          release.metadataMatchesFile &&
          (!isProduction || release.metadata.buildKind === 'release')
      )
      .sort((left, right) => {
        const byVersion =
          right.metadata.versionCode - left.metadata.versionCode;
        if (byVersion !== 0) return byVersion;
        return right.stats.mtimeMs - left.stats.mtimeMs;
      });
    return releases[0] || null;
  };

  app.get('/api/config', (_req, res) => {
    res.json({
      success: true,
      language: appLanguage,
      supportedLanguages
    });
  });

  app.get('/manifest.json', (req, res) => {
    const language =
      normalizeRequestLanguage(req.headers['x-lx-language']) ||
      normalizeRequestLanguage(req.headers['accept-language']) ||
      appLanguage;
    const fileName = `manifest.${language}.json`;
    const manifestPath = [
      path.join(projectRoot, 'dist', fileName),
      path.join(projectRoot, 'public', fileName)
    ].find(candidate => fs.existsSync(candidate));
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.append('Vary', 'Accept-Language');
    if (!manifestPath) return res.sendStatus(404);
    return res.sendFile(manifestPath, { dotfiles: 'allow' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      status: 'ok',
      version: appVersion,
      database: 'sqlite',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/app/version', (req, res) => {
    const release = availableApkRelease();
    const metadata = release?.metadata || {
      versionName: appVersion,
      versionCode: 0,
      buildKind: '',
      builtAt: '',
      sha256: ''
    };
    const requestOrigin = `${req.protocol}://${req.get('host')}`;
    const publicAppOrigin = publicAppUrl || requestOrigin;
    let publicApkUrl = null;
    if (release) {
      try {
        publicApkUrl = new URL('/apk/latest.apk', publicAppOrigin).href;
      } catch {
        publicApkUrl = null;
      }
    }

    res.json({
      success: true,
      versionName: metadata.versionName,
      versionCode: metadata.versionCode,
      apkUrl: release ? '/apk/latest.apk' : null,
      publicApkUrl,
      buildKind: release ? metadata.buildKind : null,
      fileSizeBytes: release ? release.stats.size : null,
      releasedAt:
        metadata.builtAt || (release ? release.stats.mtime.toISOString() : null),
      sha256: metadata.sha256 || null
    });
  });

  return { availableApkRelease };
}
