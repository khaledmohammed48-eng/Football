import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role as string;

    // SUPER_ADMIN: can only access /super-admin/* — redirect everything else
    if (role === 'SUPER_ADMIN') {
      if (!pathname.startsWith('/super-admin')) {
        return NextResponse.redirect(new URL('/super-admin', req.url));
      }
      return NextResponse.next();
    }

    // Protect /super-admin from non-SUPER_ADMIN
    if (pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Role-based route enforcement (existing)
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (pathname.startsWith('/coach') && role !== 'COACH') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (pathname.startsWith('/player') && role !== 'PLAYER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/coach/:path*', '/player/:path*', '/super-admin/:path*'],
};
