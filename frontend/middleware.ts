import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAuthRoute =
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  // Protect /admin routes (except public auth routes)
  if (pathname.startsWith('/admin') && !isPublicAuthRoute) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and visiting /admin/login, redirect to dashboard
  if (pathname === '/admin/login') {
    const accessToken = request.cookies.get('access_token')?.value;
    if (accessToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
