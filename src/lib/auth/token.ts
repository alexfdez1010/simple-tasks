/** Converts binary digest bytes to a stable lowercase hexadecimal token. */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

/** Hashes a value with a purpose-specific secret using Web Crypto SHA-256. */
export async function digestToken(
  value: string,
  secret: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(`${secret}::${value}`);
  return toHex(await crypto.subtle.digest('SHA-256', bytes));
}

/** Compares arbitrary strings through fixed-length digests without early exit. */
export async function timingSafeMatch(
  candidate: string,
  expected: string,
  secret: string,
): Promise<boolean> {
  const [candidateHash, expectedHash] = await Promise.all([
    digestToken(candidate, secret),
    digestToken(expected, secret),
  ]);
  let difference = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |=
      candidateHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

/** Derives the fixed browser-session token from password and auth secret. */
export function createSessionToken(
  password: string,
  secret: string,
): Promise<string> {
  return digestToken(password, `session:${secret}`);
}
