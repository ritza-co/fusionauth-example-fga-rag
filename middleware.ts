import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const protectedPaths = ['/chat', '/documents', '/organization'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!req.auth && isProtected) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }
  if (req.auth && pathname === '/') {
    return NextResponse.redirect(new URL('/chat', req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
