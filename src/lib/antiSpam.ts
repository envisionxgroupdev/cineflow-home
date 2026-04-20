// Lightweight client-side anti-spam helpers.
// Not a replacement for proper server-side rate limiting, but blocks
// the vast majority of naive bots and prevents accidental floods.

const COOLDOWN_MS = 60_000; // 1 minute between submissions per form
const MIN_FILL_TIME_MS = 3_000; // form must be open at least 3s

export type AntiSpamCheck =
  | { ok: true }
  | { ok: false; reason: string };

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
