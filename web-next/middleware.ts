/**
 * Next.js Middleware for Authentication
 * Handles token validation and auto-refresh
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, refreshAccessToken } from '@/lib/services/jwt';

// Routes that require authentication
const protectedRoutes = ['/create', '/my-events', '/settings'];

// Routes that are public
const publicRoutes = ['/', '/vote', '/results', '/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf)$/i)
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Try to verify access token
  let isAuthenticated = false;
  if (accessToken) {
    try {
      verifyAccessToken(accessToken);
      isAuthenticated = true;
    } catch (error) {
      // Access token expired or invalid
      isAuthenticated = false;
    }
  }

  // If access token is invalid but refresh token exists, try to refresh
  if (!isAuthenticated && refreshToken) {
    try {
      const tokens = await refreshAccessToken(refreshToken);

      // Create response with new tokens
      const response = NextResponse.next();
      const isProduction = process.env.NODE_ENV === 'production';

      response.cookies.set('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });

      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      isAuthenticated = true;
      return response;
    } catch (error) {
      // Refresh failed - clear invalid tokens
      const response = NextResponse.next();
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      isAuthenticated = false;
    }
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
