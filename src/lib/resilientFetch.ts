// Resilient fetch — uses our Supabase edge proxy first (reliable),
// then falls back to public CORS proxies if needed.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PROXIES = [
  // Primary: our own edge function (no third-party dependency)
  (url: string) => `${SUPABASE_URL}/functions/v1/warez-proxy?url=${encodeURIComponent(url)}`,
  // Fallbacks (often blocked/down but kept just in case)
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export interface ResilientOpts {
  timeoutMs?: number;
  retries?: number;
}

async function fetchWithTimeout(url: string, timeoutMs: number, useAuth: boolean): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: useAuth
        ? { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        : undefined,
    });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJsonResilient<T = unknown>(
  url: string,
  opts: ResilientOpts = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const retries = opts.retries ?? 1;
  let lastErr: unknown = null;

  for (let p = 0; p < PROXIES.length; p++) {
    const proxy = PROXIES[p];
    const isOwn = p === 0;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchWithTimeout(proxy(url), timeoutMs, isOwn);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text) throw new Error('Resposta vazia');
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error('JSON inválido');
        }
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha em todos os proxies');
}
