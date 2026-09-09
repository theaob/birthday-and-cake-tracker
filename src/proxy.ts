import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Gates the whole app behind a Keycloak login. /api/cron is excluded
// because it's called server-to-server by an external scheduler
// (authenticated separately via CRON_SECRET, not a browser session).
export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)'],
};
