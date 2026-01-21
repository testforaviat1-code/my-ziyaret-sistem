import { NextResponse } from 'next/server'
 
export function middleware(request) {
  // Eğer zaten /bakim sayfasındaysan veya statik bir dosyaya gidiyorsan döngüye girmemesi için:
  if (request.nextUrl.pathname === '/bakim' || request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Tüm trafiği bakım sayfasına yönlendir
  return NextResponse.redirect(new URL('/bakim', request.url))
}

export const config = {
  // API rotaları hariç her şeyi kapsar
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}