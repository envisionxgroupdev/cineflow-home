// Proxy edge function for media providers — replaces broken third-party CORS proxies.
// Also injects the TMDB API key server-side so it is never shipped to the browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Exact-match allowlist of hosts this proxy may contact.
const ALLOWED_HOSTS = new Set<string>([
  "warezcdn.lat",
  "warezcdn.site",
  "api.themoviedb.org",
]);

function isAllowedTarget(target: string): URL | null {
  try {
    const url = new URL(target);
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    const parsed = target ? isAllowedTarget(target) : null;
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inject TMDB API key server-side, never trust a client-supplied one.
    if (parsed.hostname === "api.themoviedb.org") {
      const tmdbKey = Deno.env.get("TMDB_API_KEY");
      if (!tmdbKey) {
        return new Response(
          JSON.stringify({ error: "TMDB_API_KEY is not configured on the server" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      parsed.searchParams.set("api_key", tmdbKey);
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    const res = await fetch(parsed.toString(), {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PipocaMax/1.0)" },
    });
    clearTimeout(t);

    const body = await res.text();
    const isUpstreamError = !res.ok;
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("content-type") || "application/json",
        "X-Upstream-Status": String(res.status),
        "Cache-Control": isUpstreamError ? "no-store" : "public, max-age=300",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
