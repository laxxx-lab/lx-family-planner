import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

function hostnameForLookup(value) {
  return String(value || '').replace(/^\[|\]$/g, '').toLowerCase();
}

function targetError(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.code = code;
  return error;
}

function familyFor(address, family) {
  const detected = isIP(hostnameForLookup(address));
  return detected || Number(family) || 0;
}

export async function resolvePinnedTarget(rawUrl, {
  isBlocked = () => false,
  resolve = hostname => dns.lookup(hostname, { all: true, verbatim: true })
} = {}) {
  const url = rawUrl instanceof URL ? new URL(rawUrl) : new URL(rawUrl);
  const hostname = hostnameForLookup(url.hostname);
  let addresses;
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await resolve(hostname);
  } catch (error) {
    throw targetError('PINNED_TARGET_NOT_FOUND', 'Target hostname could not be resolved.', error);
  }
  const approved = Array.isArray(addresses)
    ? addresses.map(entry => ({
      address: hostnameForLookup(entry?.address),
      family: familyFor(entry?.address, entry?.family)
    })).filter(entry => entry.address && entry.family)
    : [];
  if (!approved.length) {
    throw targetError('PINNED_TARGET_NOT_FOUND', 'Target hostname has no usable address.');
  }
  if (approved.some(entry => isBlocked(entry.address))) {
    throw targetError('PINNED_TARGET_BLOCKED', 'Target hostname resolves to a blocked address.');
  }
  return {
    url,
    hostname,
    address: approved[0].address,
    family: approved[0].family,
    addresses: approved,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : 80))
  };
}

function pinnedLookup(target) {
  return (hostname, options, callback) => {
    if (hostnameForLookup(hostname) !== target.hostname) {
      callback(targetError('PINNED_TARGET_HOST_MISMATCH', 'Unexpected hostname during pinned connection.'));
      return;
    }
    if (options?.all) {
      callback(null, [{ address: target.address, family: target.family }]);
      return;
    }
    callback(null, target.address, target.family);
  };
}

export async function fetchPinnedTarget(target, options = {}) {
  const dispatcher = new Agent({
    connect: { lookup: pinnedLookup(target) },
    connections: 1,
    pipelining: 0
  });
  try {
    const response = await undiciFetch(target.url, { ...options, dispatcher });
    return { response, dispatcher, target };
  } catch (error) {
    await dispatcher.close().catch(() => {});
    throw error;
  }
}

export async function fetchPinned(rawUrl, options = {}, policy = {}) {
  const target = await resolvePinnedTarget(rawUrl, policy);
  return fetchPinnedTarget(target, options);
}

export async function closePinnedResponse(request) {
  if (!request) return;
  await request.response?.body?.cancel().catch(() => {});
  await request.dispatcher?.close().catch(() => {});
}

export function curlResolveArgument(target) {
  const address = target.family === 6 ? `[${target.address}]` : target.address;
  return `${target.hostname}:${target.port}:${address}`;
}
