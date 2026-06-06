import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROUTE_ROLES: Record<string, string[]> = {
  "/guvenlik-panel": ["guvenlik", "admin"],
  "/idari-panel": ["admin"],
  "/taleplerim": ["personel", "guvenlik", "admin"],
  "/ziyaretci-formu": ["personel", "guvenlik", "admin"],
};

/** Supabase API + Realtime kaynakları (connect-src / img-src). */
function supabaseHosts(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "https://*.supabase.co wss://*.supabase.co";
  try {
    const origin = new URL(url).origin;
    return `${origin} ${origin.replace(/^https:/, "wss:")}`;
  } catch {
    return "https://*.supabase.co wss://*.supabase.co";
  }
}

function buildCSP(nonce: string): string {
  const hosts = supabaseHosts();
  const httpsHosts = hosts.split(" ").filter((h) => h.startsWith("https://")).join(" ") || "https://*.supabase.co";
  const frameAncestors = process.env.NEXT_PUBLIC_PORTAL_ANCESTORS?.trim() || "'self'";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${httpsHosts}`,
    `connect-src 'self' ${hosts}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const rnd = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...rnd));
  const csp = buildCSP(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);

  const { pathname } = request.nextUrl;
  const allowedRoles = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (!allowedRoles) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profil } = await supabase
    .from("profiller")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!profil || !allowedRoles.includes(profil.rol)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|ico)).*)",
  ],
};
