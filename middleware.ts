import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'pdfexpert_auth';

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // Auth disabled if APP_PASSWORD not set
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow login page and auth API through
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (cookie !== password) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/api/:path*'],
};
