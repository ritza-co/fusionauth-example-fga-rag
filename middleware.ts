import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }
  if (req.auth && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/chat', req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
