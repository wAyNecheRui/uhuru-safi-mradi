// Shared CORS helper with origin allowlist for financial / sensitive endpoints.
// SECURITY: Replaces wildcard 'Access-Control-Allow-Origin: *' on edge functions
// that handle money, PII, or privileged actions.
//
// Reflects the request Origin only when it matches a trusted domain.
// Falls back to 'null' (browser will block) for unknown origins.

const ALLOWED_ORIGIN_SUFFIXES = [
  'lovable.app',           // preview & published Lovable subdomains
  'lovableproject.com',    // legacy preview hosts
  'climatrix.co.ke',       // production custom domain
];

const ALLOWED_EXACT_ORIGINS = new Set<string>([
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://govtrack.climatrix.co.ke',
]);

const BASE_HEADERS = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
};

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_EXACT_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_ORIGIN_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

/**
 * Build CORS headers scoped to the trusted allowlist.
 * Use this for edge functions handling payments, PII, or privileged actions.
 */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : 'null';
  return {
    ...BASE_HEADERS,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
