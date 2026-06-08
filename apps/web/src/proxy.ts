import { NextRequest, NextResponse } from 'next/server';
import { extractTenantSlug } from './lib/tenant-resolver';

const RESERVED_ROUTES = new Set(['api', '_next', 'favicon.ico']);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';

  if (RESERVED_ROUTES.has(firstSegment)) {
    return NextResponse.next();
  }

  const slug = extractTenantSlug(pathname);
  if (!slug) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-slug', slug);

  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)']
};
