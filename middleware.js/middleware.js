import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  
  // Supabase istemcisini oluştur
  const supabase = createMiddlewareClient({ req, res })

  // Oturum durumunu kontrol et
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Eğer kullanıcı giriş yapmamışsa (session yoksa)
  if (!session) {
    // Ve gidilmek istenen yer Login sayfası DEĞİLSE
    if (req.nextUrl.pathname !== '/login') {
      // Login sayfasına zorla yönlendir
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Eğer kullanıcı giriş yapmışsa ve Login sayfasına gitmeye çalışıyorsa
  if (session && req.nextUrl.pathname === '/login') {
    // Onu ana sayfaya (veya yönetim paneline) geri gönder
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// Bu kural hangi sayfalarda çalışacak?
export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar HARİÇ tüm sayfalarda çalış:
     * - api (API rotaları)
     * - _next/static (statik dosyalar)
     * - _next/image (resim optimizasyonu)
     * - favicon.ico (site ikonu)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
