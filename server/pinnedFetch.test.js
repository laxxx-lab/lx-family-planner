import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  closePinnedResponse,
  curlResolveArgument,
  fetchPinned,
  resolvePinnedTarget
} from './pinnedFetch.js';

function listen(handler) {
  const server = http.createServer(handler);
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function close(server) {
  return new Promise(resolve => server.close(resolve));
}

test('pinned fetch connects to the verified address without another DNS lookup', async () => {
  let receivedHost = '';
  const server = await listen((request, response) => {
    receivedHost = request.headers.host || '';
    response.end('pinned');
  });
  const { port } = server.address();
  let lookups = 0;

  try {
    const request = await fetchPinned(
      new URL(`http://rebind.example.test:${port}/recipe`),
      {},
      {
        isBlocked: () => false,
        resolve: async hostname => {
          lookups += 1;
          assert.equal(hostname, 'rebind.example.test');
          return [{ address: '127.0.0.1', family: 4 }];
        }
      }
    );
    try {
      assert.equal(await request.response.text(), 'pinned');
      assert.equal(receivedHost, `rebind.example.test:${port}`);
      assert.equal(lookups, 1);
    } finally {
      await closePinnedResponse(request);
    }
  } finally {
    await close(server);
  }
});

test('pinned target rejects a hostname with any blocked answer', async () => {
  await assert.rejects(
    resolvePinnedTarget(new URL('https://mixed.example.test/'), {
      isBlocked: address => address === '127.0.0.1',
      resolve: async () => [
        { address: '93.184.216.34', family: 4 },
        { address: '127.0.0.1', family: 4 }
      ]
    }),
    error => error?.code === 'PINNED_TARGET_BLOCKED'
  );
});

test('curl fallback receives the same verified hostname and address', () => {
  assert.equal(
    curlResolveArgument({
      hostname: 'caldav.example.test',
      port: 443,
      address: '2001:db8::10',
      family: 6
    }),
    'caldav.example.test:443:[2001:db8::10]'
  );
});
