import type { NextConfig } from 'next';

/** Supabase API + Realtime için connect-src / img-src kaynakları */
function getSupabaseDirectiveHosts(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return 'https://*.supabase.co wss://*.supabase.co';
  }
  try {
    const origin = new URL(url).origin;
    const wsOrigin = origin.replace(/^https:/, 'wss:');
    return `${origin} ${wsOrigin}`;
  } catch {
    return 'https://*.supabase.co wss://*.supabase.co';
  }
}

const supabaseHosts = getSupabaseDirectiveHosts();

/**
 * CSP: Next.js (inline stil/script) + Supabase Auth/DB/Realtime.
 * Üretimde nonce tabanlı sıkılaştırma middleware ile eklenebilir.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabaseHosts.split(' ').filter((h) => h.startsWith('https://')).join(' ') || 'https://*.supabase.co'}`,
  `connect-src 'self' ${supabaseHosts}`,
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
