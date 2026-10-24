import 'server-only';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

type Resolve = (
  hostname: string,
) => Promise<{ address: string; family: number }[]>;

/** Rejects internal, reserved, mapped-private and non-routable destination addresses. */
export function isPublicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === 'unicast';
  } catch {
    return false;
  }
}

/** Bounds DNS latency without allowing a late answer to trigger a request after timeout. */
async function boundedLookup(hostname: string, resolve: Resolve) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      resolve(hostname),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DNS_TIMEOUT')), 3000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Validates a public HTTPS URL and resolves every address once; callers pin the returned address. */
export async function resolveWebhookTarget(
  raw: string,
  resolve: Resolve = (host) => lookup(host, { all: true, verbatim: true }),
) {
  const url = new URL(raw);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443')
  )
    throw new Error('INVALID_URL');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = ipaddr.isValid(hostname)
    ? [
        {
          address: hostname,
          family: ipaddr.parse(hostname).kind() === 'ipv4' ? 4 : 6,
        },
      ]
    : await boundedLookup(hostname, resolve);
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  )
    throw new Error('UNSAFE_TARGET');
  return { url, hostname, address: addresses[0] };
}
