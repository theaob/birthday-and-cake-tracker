import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

// Reads AUTH_KEYCLOAK_ID / AUTH_KEYCLOAK_SECRET / AUTH_KEYCLOAK_ISSUER and
// AUTH_SECRET from the environment by Auth.js convention (see README).
//
// `trustHost: true` is required for a self-hosted deployment (Docker,
// reverse-proxied, not Vercel) so Auth.js trusts the Host header when
// building callback URLs. This app is meant to run on a trusted
// network/behind your own reverse proxy — see the Security model section
// in the README.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak],
  trustHost: true,
  session: { strategy: 'jwt' },
});
