import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

test('Android transport preserves login JSON and files without leaking tokens through proxy redirects', async t => {
  let redirectedRequests = 0;
  const destination = createServer((_req, res) => { redirectedRequests++; res.end('Proxy login'); });
  destination.listen(0, '127.0.0.1');
  await new Promise(resolve => destination.once('listening', resolve));
  const backend = createServer(async (req, res) => {
    if (req.url === '/api/protected') {
      res.writeHead(302, { location: `http://127.0.0.1:${destination.address().port}/login` });
      res.end();
      return;
    }
    assert.equal(req.headers['x-lx-client'], 'native');
    assert.equal(req.headers['x-session-token'], 'test-native-session');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url === '/api/upload'
      ? { bytes: [...bytes] }
      : { success: true, received: JSON.parse(bytes.toString()) }));
  });
  backend.listen(0, '127.0.0.1');
  await new Promise(resolve => backend.once('listening', resolve));
  t.after(async () => {
    await Promise.all([new Promise(resolve => backend.close(resolve)), new Promise(resolve => destination.close(resolve))]);
  });
  const baseUrl = `http://127.0.0.1:${backend.address().port}`;
  globalThis.androidBridge = {};
  globalThis.Capacitor = {
    PluginHeaders: [{ name: 'CapacitorHttp', methods: [{ name: 'request', rtype: 'promise' }] }],
    // Emulate only the platform boundary using real HTTP. Android parses JSON
    // regardless of responseType and base64-encodes successful binary bodies.
    nativePromise: async (_plugin, _method, options) => {
      const response = await fetch(options.url, {
        method: options.method, headers: options.headers,
        body: options.data == null ? undefined : options.dataType === 'file'
          ? Buffer.from(options.data, 'base64') : JSON.stringify(options.data),
        redirect: options.disableRedirects ? 'manual' : 'follow'
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      return { status: response.status, headers: Object.fromEntries(response.headers),
        data: response.headers.get('content-type')?.includes('application/json')
          ? JSON.parse(bytes.toString()) : bytes.toString('base64') };
    }
  };
  globalThis.window = { Capacitor: globalThis.Capacitor };
  const values = new Map([['lx_family_server_url', baseUrl], ['lx_family_session_token', 'test-native-session']]);
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const { plannerApiRequest, plannerApiFetch } = await import('../src/utils/apiConfig.js');
  const login = await plannerApiRequest('/api/login', { method: 'POST', body: JSON.stringify({ familyName: 'Test' }) });
  assert.deepEqual(login, { success: true, received: { familyName: 'Test' } });
  const file = await plannerApiFetch('/api/upload', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: new Blob([Uint8Array.from([137, 255, 0, 128])]) });
  assert.deepEqual(await file.json(), { bytes: [137, 255, 0, 128] });
  await assert.rejects(plannerApiRequest('/api/protected'), { code: 'PROXY_AUTH_REQUIRED' });
  assert.equal(redirectedRequests, 0);
});
