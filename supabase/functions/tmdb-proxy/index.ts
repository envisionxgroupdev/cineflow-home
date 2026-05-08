// TMDB proxy — keeps the TMDB API key on the server.
// Deploy with: supabase functions deploy tmdb-proxy --no-verify-jwt
// Set the secret with: supabase secrets set TMDB_API_KEY=xxxxx

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Allowlist of TMDB path prefixes the proxy will forward.
const ALLOWED_PREFIXES = [
  'search/movie',
  'search/tv',
  'discover/movie',
  'discover/tv',
  'movie/',
  'tv/',
  'genre/',
  'trending/',
];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
  if (!TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    // Path the client wants on TMDB, e.g. "movie/123" or "search/movie"
    const tmdbPath = (url.searchParams.get('path') || '').replace(/^\/+/, '');
    if (!tmdbPath || !isAllowed(tmdbPath)) {
      return new Response(JSON.stringify({ error: 'Path not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward all other query params to TMDB, then add api_key server-side.
    const forwarded = new URLSearchParams();
    for (const [k, v] of url.searchParams.entries()) {
      if (k === 'path') continue;
      forwarded.append(k, v);
    }
    forwarded.set('api_key', TMDB_API_KEY);

    const tmdbUrl = `${TMDB_BASE}/${tmdbPath}?${forwarded.toString()}`;
    const res = await fetch(tmdbUrl);
    const body = await res.text();

    return new Response(body, {
      status: res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
