# Authentication and security operations

Better Auth owns email/password sessions, TOTP, recovery codes, OAuth MCP grants
and REST API-key verification. Public sign-up is disabled. PostgreSQL enforces a
unique true-only owner slot, so neither concurrent sign-ups nor direct inserts can
create a second user. Assignees remain workflow records, separate from this owner.

## Configuration

Set `BETTER_AUTH_URL` to the canonical origin and `BETTER_AUTH_SECRET` to an
independent random value of at least 32 characters. Use HTTPS in production.
Application authentication does not read `PASSWORD`, `AUTH_SECRET` or `MCP_TOKEN`.
For migration only, the build can consume `LEGACY_OWNER_EMAIL` and the existing
protected `PASSWORD` directly inside Vercel. It skips an existing owner and never
extracts or logs the legacy secret. Remove these temporary variables afterward.
The auth secret encrypts TOTP and recovery material as well as signing cookies;
back it up securely and plan recovery before rotating it.

Sessions are database-backed, expire after 12 hours, and are revoked on sign-out.
Enrollment invalidates every existing password-only session. Unenrolled owners
cannot read the workspace, mutate data, issue REST keys or authorize MCP clients.
TOTP is required at every sign-in; trusted-device bypass is disabled. Authentication
rate limits persist in PostgreSQL across Vercel instances, with tighter limits for
password, second-factor and client-registration endpoints. The second-factor plugin
also limits failed attempts per account. Error responses never disclose passwords.

## Provision the owner

Apply migrations, then invoke `bun run auth:provision` in a trusted operator shell
with `DATABASE_URL`, `AUTH_OWNER_EMAIL` and `AUTH_OWNER_PASSWORD` provided through
secure process input. Example invocation: `bun run auth:provision` after loading
those values from a password manager. Do not put passwords in command history,
source control, build logs or Vercel runtime variables.

Provisioning hashes the password through Better Auth and atomically creates the
user and credential account. A repeat invocation fails without modifying the owner.
Legacy REST hashes are re-encoded from hexadecimal SHA-256 to Better Auth's base64url
SHA-256 representation inside the same transaction, preserving existing keys without
ever recovering their original values. Existing revocations and read/write modes
are retained. New keys are issued and verified by Better Auth; the existing API-token
table retains non-secret presentation metadata and per-token rate-limit identities.

On first sign-in, the owner confirms the password, scans the locally rendered QR,
verifies a TOTP code and saves the one-use recovery codes. No external QR service
receives the secret. Passwords shorter than 12 characters may be migrated only for
this restricted onboarding; the owner must replace them before accessing the board
or issuing delegated credentials. Password replacement invalidates all sessions and
requires a new password-plus-TOTP sign-in. New passwords require 12–128 characters.

## Connect an MCP client

Use `https://YOUR_ORIGIN/api/mcp/mcp` with OAuth. Download a secret-free configuration
from `/skill`. Discovery follows RFC 8414 and RFC 9728; authorization uses S256 PKCE
and exact redirect URIs. Native clients registering loopback callbacks must declare
`application_type: native`. Only authorization-code and refresh-token grants are
allowed. Unauthenticated registration creates a client, never a user or a grant.

Request `tasks:read` and optionally `tasks:write offline_access`. The signed consent
screen defaults to Read only and offers Full access only when write was requested.
Scopes can be reduced, never escalated. Tokens are bound to the canonical MCP resource,
issuer, client and owner. Access tokens last five minutes; refresh tokens last seven
days and rotate. A per-request tool-registration decorator exposes only explicit
read tools to a read token and denies unknown future mutations by default.

`/security` lists grants and atomically deletes Better Auth consent and issued token records. Every MCP request
checks the live consent, owner security state and client enabled state, so revocation
or reduced permissions invalidate outstanding JWTs immediately. A newly issued token
must be used after permissions change. Old shared MCP tokens and old fixed browser
cookies are rejected. REST API keys cannot create browser sessions or access MCP;
OAuth MCP tokens do not authenticate the REST API.

## Recovery and deployment

Use one-use recovery codes when the authenticator is unavailable. There is no public
password reset or 2FA-disable endpoint. If both authenticator and recovery codes are
lost, recovery requires trusted database/operator access: verify identity out of band,
revoke all sessions, OAuth grants and refresh tokens, remove the lost factor and set
`twoFactorEnabled` to false, then require fresh enrollment. Never temporarily enable
public sign-up. Recovery should not be automated from an unauthenticated request.

Migrations are additive and preserve board data. Test first against the disposable
Compose database. Provision the production owner while the old deployment is still
available, configure the new Vercel variables, deploy and verify discovery plus
unauthorized responses. Remove obsolete secrets after the new deployment is healthy.
Reverting application code requires deliberately restoring its old credentials;
rolling back to the old shared-auth design reintroduces its weaker security model.

Official references: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication),
[Better Auth Next.js integration](https://better-auth.com/docs/integrations/next),
[two-factor authentication](https://better-auth.com/docs/plugins/2fa),
[OAuth provider](https://better-auth.com/docs/plugins/oauth-provider),
[MCP](https://better-auth.com/docs/plugins/mcp),
[API keys](https://better-auth.com/docs/plugins/api-key).
