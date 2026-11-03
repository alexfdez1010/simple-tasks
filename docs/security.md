# Authentication and security operations

Better Auth owns email/password sessions, TOTP, recovery codes, OAuth MCP grants
and REST API-key verification. Account creation requires a private one-use invitation. PostgreSQL enforces a
unique true-only owner slot, so neither concurrent sign-ups nor direct inserts can
create a second user. Assignees remain workflow records, separate from this owner.

## Configuration

Set `BETTER_AUTH_URL` to the canonical origin and `BETTER_AUTH_SECRET` to an
independent random value of at least 32 characters. Use HTTPS in production.
Application authentication does not read `PASSWORD`, `AUTH_SECRET` or `MCP_TOKEN`.
The auth secret encrypts TOTP and recovery material as well as signing cookies;
back it up securely and plan recovery before rotating it.

Sessions are database-backed, expire after 12 hours, and are revoked on sign-out.
Enrollment invalidates every existing password-only session. Unenrolled owners
cannot read the workspace, mutate data, issue REST keys or authorize MCP clients.
TOTP is required at every sign-in; trusted-device bypass is disabled. Authentication
rate limits persist in PostgreSQL across Vercel instances, with tighter limits for
password, second-factor and client-registration endpoints. The second-factor plugin
also limits failed attempts per account. Error responses never disclose passwords.

## Invite the owner to create a new account

Apply migrations, then invoke `bun run auth:invite` in a trusted operator shell with
`DATABASE_URL`, `BETTER_AUTH_URL` and `AUTH_OWNER_EMAIL`. The command saves a private
24-hour invitation to `.vercel/owner-invitation.txt` with owner-only file permissions.
Set `OWNER_INVITATION_FILE` to choose another private destination. No password is
generated or migrated. Existing owners are never replaced implicitly.

Open the saved link to `/register`. Its secret lives in a URL fragment, which browsers
do not send to the server or in referrers. The form sends it in a request header and
asks for name, the invited email, and a new password with confirmation. Better Auth
hashes the chosen password and creates the user, credential and session. Registration
requires an empty owner slot and an unexpired invitation. The invitation is consumed
inside Better Auth's transaction; failed signup rolls it back. PostgreSQL prevents
concurrent registrations from creating a second user. The form and endpoint close
once the account exists. Anonymous requests without an invitation are rejected.

An explicit correction can replace an incorrectly provisioned owner by additionally
setting `REPLACE_OWNER_ID` to that exact current id. This revokes and removes its auth
records and REST keys, then issues a fresh invitation in one transaction. Tasks,
projects, assignees, properties and statistics are preserved. Never pass an owner id
unless replacement was explicitly requested. The old password is not retained.

After signup, the owner scans the locally rendered QR, verifies a TOTP code and saves
the one-use recovery codes. The board and delegated access remain blocked until
verification. No external QR service receives the secret. Passwords require 12–128
characters. There is no automatic account creation in the build and no fallback to
a legacy shared password. REST API keys are created and verified by Better Auth;
the existing API-token table retains non-secret presentation metadata and budgets.

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
Compose database. Configure the Vercel variables, deploy and verify discovery plus unauthorized
responses, then issue the private invitation. The owner chooses their own credentials.
Reverting application code requires deliberately restoring its old credentials;
rolling back to the old shared-auth design reintroduces its weaker security model.

Official references: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication),
[Better Auth Next.js integration](https://better-auth.com/docs/integrations/next),
[two-factor authentication](https://better-auth.com/docs/plugins/2fa),
[OAuth provider](https://better-auth.com/docs/plugins/oauth-provider),
[MCP](https://better-auth.com/docs/plugins/mcp),
[API keys](https://better-auth.com/docs/plugins/api-key).
