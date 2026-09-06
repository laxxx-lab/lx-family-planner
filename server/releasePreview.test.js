import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { releaseNotesForVersion } from '../shared/releaseNotes.js';

const projectRoot = process.cwd();

test('the login screen keeps release notes out of the sign-in flow', () => {
  const version = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  ).version;
  const notes = releaseNotesForVersion(version);
  const login = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'Auth', 'FamilyLoginScreen.jsx'),
    'utf8'
  );
  assert.equal(version, '1.21.1');
  assert.doesNotMatch(login, /ReleasePreviewCard/);
  assert.deepEqual(
    notes.highlights.map(highlight => highlight.id),
    [
      'pinned-outbound-connections',
      'safer-cloud-and-calendar-sync'
    ]
  );
});
