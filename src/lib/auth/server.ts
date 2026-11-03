import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { jwt, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { generateApiToken } from '@/lib/api-tokens/crypto';
import { mcp } from '@better-auth/mcp';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { db } from '@/lib/db/client';
import { getAuthConfig } from '@/lib/auth/config';

const config = getAuthConfig();
export const mcpResource = `${config.baseURL}/api/mcp/mcp`;
export const mcpScopes = ['tasks:read', 'tasks:write', 'offline_access'];

export const auth = betterAuth({
  ...config,
  appName: 'Simple Tasks',
  database: prismaAdapter(db, { provider: 'postgresql', transaction: true }),
  user: {
    additionalFields: {
      passwordChangeRequired: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  disabledPaths: [
    '/token',
    '/oauth2/update-consent',
    '/oauth2/delete-consent',
    '/two-factor/disable',
    '/update-user',
    '/change-email',
    '/delete-user',
    '/api-key/create',
    '/api-key/update',
    '/api-key/delete',
    '/api-key/delete-all-expired',
  ],
  session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30, freshAge: 60 * 10 },
  advanced: {
    ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-real-ip'] },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/two-factor/*': { window: 60, max: 5 },
      '/oauth2/register': { window: 60, max: 10 },
    },
  },
  databaseHooks: {
    user: {
      update: {
        /** Revokes every password-only session when enrollment enables the second factor. */
        after: async (user) => {
          if (user.twoFactorEnabled)
            await db.session.deleteMany({ where: { userId: user.id } });
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === '/two-factor/verify-totp' ||
        ctx.path === '/two-factor/verify-backup-code'
      ) {
        if (ctx.body?.trustDevice)
          throw new APIError('BAD_REQUEST', {
            message: 'A second factor is required on every sign-in.',
          });
      }
    }),
  },
  plugins: [
    apiKey({
      defaultPrefix: 'st_',
      maximumNameLength: 80,
      enableSessionForAPIKeys: false,
      rateLimit: { enabled: false },
      /** Keeps the existing 256-bit REST credential format. */
      customKeyGenerator: () => generateApiToken().token,
    }),
    twoFactor({
      issuer: 'Simple Tasks',
      backupCodeOptions: { storeBackupCodes: 'encrypted' },
    }),
    jwt(),
    mcp({
      loginPage: '/login',
      consentPage: '/oauth/consent',
      resource: mcpResource,
      scopes: mcpScopes,
      grantTypes: ['authorization_code', 'refresh_token'],
      /** Allows public client registration, while restricting management to the verified owner. */
      clientPrivileges: async ({ action, user }) =>
        !user
          ? action === 'create'
          : Boolean(user.twoFactorEnabled && !user.passwordChangeRequired),
      /** Resource configuration is reserved for the verified owner. */
      resourcePrivileges: async ({ user }) =>
        Boolean(user?.twoFactorEnabled && !user.passwordChangeRequired),
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultScopes: mcpScopes,
      resources: [{ identifier: mcpResource, allowedScopes: mcpScopes }],
      accessTokenExpiresIn: 300,
      refreshTokenExpiresIn: 60 * 60 * 24 * 7,
      postLogin: {
        page: '/security',
        /** Uses owner-level consent, without an organization reference. */
        consentReferenceId: () => undefined,
        /** Forces enrollment before authorization can issue delegated credentials. */
        shouldRedirect: async ({ user }) =>
          !user.twoFactorEnabled || Boolean(user.passwordChangeRequired),
      },
    }),
    nextCookies(),
  ],
});
