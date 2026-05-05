// Resilient fetch with multiple CORS proxy fallbacks, timeout and retries.
// Used by SyncManagement to talk to the WarezCDN API without CORS failures.

const PROXIES = [
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export interface ResilientOpts {
  timeoutMs?: number;
  retries?: number;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch a remote URL through several CORS proxies, falling back on failure.
 * Each proxy is retried `retries` times before moving on. Returns parsed JSON.
 */
export async function fetchJsonResilient<T = unknown>(
  url: string,
  opts: ResilientOpts = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const retries = opts.retries ?? 1;
  let lastErr: unknown = null;

  for (const proxy of PROXIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchWithTimeout(proxy(url), timeoutMs);
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
        // small backoff before retrying
        if (attempt < retries) await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha em todos os proxies');
}
