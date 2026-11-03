/** Returns the canonical origin and strong encryption secret; fails closed. */
export function getAuthConfig() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32)
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  if (!baseURL) throw new Error('BETTER_AUTH_URL is required.');
  const url = new URL(baseURL);
  if (
    url.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(url.hostname)
  )
    throw new Error('BETTER_AUTH_URL must use HTTPS outside localhost.');
  return { secret, baseURL: url.origin };
}
