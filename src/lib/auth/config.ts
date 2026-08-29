export type AuthConfig = {
  password: string;
  secret: string;
};

/** Reads and validates the shared-password authentication configuration. */
export function getAuthConfig(): AuthConfig {
  const password = process.env.PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password) throw new Error('PASSWORD is required.');
  if (!secret) throw new Error('AUTH_SECRET is required.');
  return { password, secret };
}
