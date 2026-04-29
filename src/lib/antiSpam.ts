// Lightweight client-side anti-spam helpers.
// Not a replacement for proper server-side rate limiting, but blocks
// the vast majority of naive bots and prevents accidental floods.

const COOLDOWN_MS = 60_000; // 1 minute between submissions per form
const MIN_FILL_TIME_MS = 3_000; // form must be open at least 3s

export type AntiSpamCheck = { ok: boolean; reason?: string };

export function checkAntiSpam(opts: {
  formKey: string;
  honeypotValue: string;
  openedAt: number;
}): AntiSpamCheck {
  if (opts.honeypotValue && opts.honeypotValue.trim() !== "") {
    return { ok: false, reason: "Falha na verificação anti-spam." };
  }
  const elapsed = Date.now() - opts.openedAt;
  if (elapsed < MIN_FILL_TIME_MS) {
    return { ok: false, reason: "Aguarde alguns segundos antes de enviar." };
  }
  try {
    const last = Number(localStorage.getItem(`as:${opts.formKey}`) || 0);
    if (last && Date.now() - last < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
      return { ok: false, reason: `Aguarde ${wait}s antes de enviar novamente.` };
    }
  } catch {
    // ignore storage errors
  }
  return { ok: true };
}

export function markSubmitted(formKey: string) {
  try {
    localStorage.setItem(`as:${formKey}`, String(Date.now()));
  } catch {
    // ignore
  }
}

/**
 * Lightweight cooldown check without honeypot/openedAt requirements.
 * Use for quick mutations like report submissions where a full form
 * guard is overkill, but you still want to prevent rapid re-submits.
 */
export function checkCooldown(key: string, cooldownMs = COOLDOWN_MS): AntiSpamCheck {
  try {
    const last = Number(localStorage.getItem(`as:${key}`) || 0);
    if (last && Date.now() - last < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (Date.now() - last)) / 1000);
      return { ok: false, reason: `Aguarde ${wait}s antes de tentar novamente.` };
    }
  } catch {
    // ignore
  }
  return { ok: true };
}

/**
 * Per-key in-memory throttle for read queries (e.g. global search).
 * Returns true if the call should proceed, false if it's too soon.
 * Also enforces a max number of calls within a rolling window.
 */
const callLog = new Map<string, number[]>();
export function throttleQuery(key: string, opts?: { minIntervalMs?: number; maxPerWindow?: number; windowMs?: number }): boolean {
  const minInterval = opts?.minIntervalMs ?? 250;
  const maxPerWindow = opts?.maxPerWindow ?? 20;
  const windowMs = opts?.windowMs ?? 10_000;
  const now = Date.now();
  const log = callLog.get(key) || [];
  const recent = log.filter(t => now - t < windowMs);
  if (recent.length > 0 && now - recent[recent.length - 1] < minInterval) return false;
  if (recent.length >= maxPerWindow) return false;
  recent.push(now);
  callLog.set(key, recent);
  return true;
}

// Standard hidden honeypot input props. Real users won't fill this.
export const honeypotInputProps = {
  type: "text" as const,
  tabIndex: -1,
  autoComplete: "off",
  "aria-hidden": true,
  style: {
    position: "absolute" as const,
    left: "-10000px",
    width: "1px",
    height: "1px",
    opacity: 0,
    pointerEvents: "none" as const,
  },
};
