import { NextResponse } from 'next/server'

export function middleware(request) {
  // Test: Herkesi Google'a gönder
  return NextResponse.redirect(new URL('https://www.google.com', request.url))
}

export const config = {
  matcher: '/:path*',
}
