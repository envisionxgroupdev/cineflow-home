// Proxy edge function for media providers — replaces broken third-party CORS proxies.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function isAllowedTarget(target: string) {
  try {
    const url = new URL(target);
    return url.hostname.endsWith("warezcdn.lat") || url.hostname === "api.themoviedb.org";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target || !isAllowedTarget(target)) {
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PipocaMax/1.0)" },
    });
    clearTimeout(t);

    const body = await res.text();
    // Always return HTTP 200 so the preview's error overlay doesn't trip on upstream 404s.
    // Callers inspect the JSON body (e.g. TMDB status_code) to decide success.
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("content-type") || "application/json",
        "X-Upstream-Status": String(res.status),
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
