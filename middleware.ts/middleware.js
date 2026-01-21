// Bakim modu aktif
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // 1. İzin verilen yollar: Bakım sayfası, statik dosyalar (resimler), API ve Next.js sistem dosyaları
  if (
    pathname === '/bakim' ||
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.') // favicon.ico, logo.png gibi dosyalar için
  ) {
    return NextResponse.next()
  }

  // 2. Geriye kalan HER ŞEYİ bakım sayfasına postala
  return NextResponse.redirect(new URL('/bakim', request.url))
}

export const config = {
  // Karmaşık regex yerine her şeyi yakalayan basit yıldız kullanıyoruz
  matcher: '/:path*',
}