/// <reference types="next-auth" />
import NextAuth from 'next-auth';
import { PermifyClient } from '@/lib/permify';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    {
      id: 'fusionauth',
      name: 'FusionAuth',
      type: 'oauth',
      clientId: process.env.AUTH_FUSIONAUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_FUSIONAUTH_CLIENT_SECRET!,
      authorization: {
        url: `${process.env.AUTH_FUSIONAUTH_ISSUER}/oauth2/authorize`,
        params: {
          scope: 'offline_access email openid profile',
          tenantId: process.env.AUTH_FUSIONAUTH_TENANT_ID!,
        },
      },
      token: {
        url: `${process.env.AUTH_FUSIONAUTH_ISSUER}/oauth2/token`,
        conform: async (response: Response) => {
          if (response.status === 401) return response;

          const newHeaders = Array.from(response.headers.entries())
            .filter(([key]) => key.toLowerCase() !== 'www-authenticate')
            .reduce((headers, [key, value]) => {
              headers.append(key, value);
              return headers;
            }, new Headers());

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        },
      },
      userinfo: {
        url: `${process.env.AUTH_FUSIONAUTH_ISSUER}/oauth2/userinfo`,
        async request({ tokens, provider }: { tokens: { access_token: string }; provider: { userinfo: { url: string } } }) {
          const response = await fetch(provider.userinfo.url, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          return await response.json();
        },
      },
      checks: ['state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt(params) {
      const { token, account } = params;
      if (account) {
        // Auto-join organization on first login
        const userId = account.providerAccountId;
        if (userId) {
          const permify = new PermifyClient();
          await permify.writeRelationships([
            {
              entity: { type: 'organization', id: 'acme' },
              relation: 'member',
              subject: { type: 'user', id: userId },
            },
          ]);
        }
        return {
          ...token,
          ...account,
        };
      }
      if (
        token.expires_at &&
        Date.now() < (token.expires_at as number) * 1000
      ) {
        return token;
      }
      if (!token.refresh_token) throw new TypeError('Missing refresh_token');

      try {
        const refreshResponse = await fetch(
          `${process.env.AUTH_FUSIONAUTH_ISSUER}/oauth2/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.AUTH_FUSIONAUTH_CLIENT_ID!,
              client_secret: process.env.AUTH_FUSIONAUTH_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refresh_token as string,
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        const newTokens = (await refreshResponse.json()) as {
          access_token: string;
          expires_in: number;
          refresh_token?: string;
        };

        return {
          ...token,
          access_token: newTokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
          refresh_token: newTokens.refresh_token
            ? newTokens.refresh_token
            : token.refresh_token,
        };
      } catch (error) {
        console.error('Error refreshing access_token', error);
        token.error = 'RefreshTokenError';
        return token;
      }
    },
    async session(params) {
      const { session, token } = params;
      return { ...session, ...token };
    },
  },
});

declare module 'next-auth' {
  interface Session {
    access_token: string;
    expires_in: number;
    id_token?: string;
    expires_at: number;
    refresh_token?: string;
    refresh_token_id?: string;
    error?: 'RefreshTokenError';
    scope: string;
    token_type: string;
    userId: string;
    provider: string;
    type: string;
    providerAccountId: string;
  }
}

declare module 'next-auth' {
  interface JWT {
    access_token: string;
    expires_in: number;
    id_token?: string;
    expires_at: number;
    refresh_token?: string;
    refresh_token_id?: string;
    error?: 'RefreshTokenError';
    scope: string;
    token_type: string;
    userId: string;
    provider: string;
    type: string;
    providerAccountId: string;
  }
}
