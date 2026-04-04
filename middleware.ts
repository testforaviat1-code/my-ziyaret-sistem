import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROUTE_ROLES: Record<string, string[]> = {
  '/guvenlik-panel': ['guvenlik', 'admin'],
  '/idari-panel':    ['admin'],
  '/talep':          ['personel', 'guvenlik', 'admin'],
  '/dashboard':      ['personel', 'guvenlik', 'admin'],
  '/taleplerim':     ['personel', 'guvenlik', 'admin'],
  '/ziyaretci-formu': ['personel', 'guvenlik', 'admin'],
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const allowedRoles = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1]

  if (!allowedRoles) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profil } = await supabase
    .from('profiller')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!profil || !allowedRoles.includes(profil.rol)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/guvenlik-panel/:path*',
    '/idari-panel/:path*',
    '/taleplerim/:path*',
    '/ziyaretci-formu/:path*',
  ],
}