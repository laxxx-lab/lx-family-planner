import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  DEFAULT_SERVER_URL,
  getStoredServerUrl,
  hydrateStoredServerUrl,
  normalizeServerUrl,
  plannerApiRequest,
  nativeHttpResponse,
  nativeHttpBody
} from '../src/utils/apiConfig.js';

test('native client configuration has no preselected deployment server', () => {
  assert.equal(DEFAULT_SERVER_URL, '');
});

test('a proxy login page is never treated as a successful LX API response', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>Cosmos login</html>', {
    headers: { 'Content-Type': 'text/html' }
  });
  try {
    await assert.rejects(plannerApiRequest('/api/auth/session'), {
      code: 'PROXY_AUTH_REQUIRED'
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('server configuration accepts a family-owned domain and local address', () => {
  assert.equal(
    normalizeServerUrl('https://family.example.test/'),
    'https://family.example.test'
  );
  assert.equal(
    normalizeServerUrl('192.168.178.50:3001'),
    'http://192.168.178.50:3001'
  );
});

test('Android parsed JSON responses survive conversion to a web Response', async () => {
  const response = nativeHttpResponse({ status: 200, headers: { 'Content-Type': 'application/json' }, data: { status: 'ok', version: '1.22.0' } });
  assert.deepEqual(await response.json(), { status: 'ok', version: '1.22.0' });
  const empty = nativeHttpResponse({ status: 204, headers: {}, data: '' });
  assert.equal(await empty.text(), '');
});

test('native downloads retain PNG bytes instead of converting them through UTF-8', async () => {
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 255, 0, 128]);
  const response = nativeHttpResponse({ status: 200, headers: { 'Content-Type': 'image/png' }, data: bytes.toString('base64') });
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  const proxy = nativeHttpResponse({ status: 403, headers: { 'Content-Type': 'text/html' }, data: '<html>Login required</html>' });
  assert.equal(await proxy.text(), '<html>Login required</html>');
});

test('native file uploads preserve bytes and use the file encoding accepted by Android', async () => {
  const bytes = Buffer.from([137, 255, 0, 128]);
  const body = await nativeHttpBody(new Blob([bytes]));
  assert.equal(body.dataType, 'file');
  assert.deepEqual(Buffer.from(body.data, 'base64'), bytes);
});

test('a web installation keeps its chosen server address through hydration', async () => {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;
  const values = new Map([
    ['lx_family_server_url', 'https://family.example.test']
  ]);
  globalThis.window = { Capacitor: { isNativePlatform: () => false } };
  globalThis.localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  try {
    assert.equal(await hydrateStoredServerUrl(), 'https://family.example.test');
    assert.equal(getStoredServerUrl(), 'https://family.example.test');
  } finally {
    globalThis.window = previousWindow;
    globalThis.localStorage = previousLocalStorage;
  }
});

test('Android stores the selected server outside WebView storage for updates', async () => {
  const [plugin, activity] = await Promise.all([
    readFile(
      new URL(
        '../android/app/src/main/java/com/lxfamily/planner/LXServerPreferencesPlugin.java',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../android/app/src/main/java/com/lxfamily/planner/MainActivity.java',
        import.meta.url
      ),
      'utf8'
    )
  ]);
  assert.match(plugin, /SharedPreferences/);
  assert.match(plugin, /getServerUrl/);
  assert.match(plugin, /setServerUrl/);
  assert.match(plugin, /"lx_server_preferences"/);
  assert.match(activity, /registerPlugin\(LXServerPreferencesPlugin\.class\)/);
});
