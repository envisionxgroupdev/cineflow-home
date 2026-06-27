import { useEffect, useRef, useState } from "react";
import { Gift, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdAllowedRoute } from "@/lib/adRoutes";
import { SITE_SETTINGS_UPDATED_EVENT } from "@/lib/siteSettingsEvents";

const STORAGE_KEY = "pmx-adpopup-next";
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const FIRST_DELAY_MS = 8 * 1000; // first appearance after 8s

/**
 * Floating popup with a CTA button. When the user clicks the button,
 * the admin-provided ad HTML/JS opens in a popup window and a few
 * camouflaged hidden iframes also render the ad so each user click
 * generates multiple ad impressions/clicks. The popup then re-appears
 * every 5 minutes.
 */
export function AdPopup() {
  const adAllowed = useIsAdAllowedRoute();
  const [adCode, setAdCode] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const hiddenHostRef = useRef<HTMLDivElement>(null);

  // Load ad code from site_settings
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ad_popup")
        .maybeSingle();
      if (!cancelled) setAdCode(((data as { value?: string } | null)?.value || "").trim());
    };
    load();
    const handler = () => load();
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handler);
    };
  }, []);

  // Schedule show/re-show
  useEffect(() => {
    if (!adAllowed || !adCode) {
      setVisible(false);
      return;
    }

    let timer: number | undefined;

    const scheduleNext = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(true), Math.max(0, delay));
    };

    const nextAt = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
    const now = Date.now();
    if (!nextAt) {
      scheduleNext(FIRST_DELAY_MS);
    } else if (nextAt <= now) {
      setVisible(true);
    } else {
      scheduleNext(nextAt - now);
    }

    return () => window.clearTimeout(timer);
  }, [adAllowed, adCode]);

  const armNext = () => {
    const next = Date.now() + INTERVAL_MS;
    sessionStorage.setItem(STORAGE_KEY, String(next));
    setVisible(false);
  };

  const fireAd = () => {
    if (!adCode) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Oferta</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}</style></head><body>${adCode}</body></html>`;

    // 1) Visible popup window (user-gesture, always allowed)
    try {
      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=650");
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
      }
    } catch {}

    // 2) Camouflaged extra impressions via hidden iframes (~4 more)
    const host = hiddenHostRef.current;
    if (host) {
      host.innerHTML = "";
      for (let i = 0; i < 4; i++) {
        const iframe = document.createElement("iframe");
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin",
        );
        iframe.style.cssText = "position:absolute;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
        iframe.srcdoc = html;
        host.appendChild(iframe);
      }
      // clean up after a bit
      window.setTimeout(() => { if (host) host.innerHTML = ""; }, 30000);
    }

    armNext();
  };

  if (!adAllowed || !adCode || !visible) {
    return (
      <div
        ref={hiddenHostRef}
        aria-hidden
        style={{ position: "fixed", left: -9999, top: -9999, width: 1, height: 1, overflow: "hidden" }}
      />
    );
  }

  return (
    <>
      <div
        ref={hiddenHostRef}
        aria-hidden
        style={{ position: "fixed", left: -9999, top: -9999, width: 1, height: 1, overflow: "hidden" }}
      />
      <div
        className="fixed z-[70] bottom-4 right-4 max-w-[320px] w-[calc(100vw-2rem)] sm:w-[320px] animate-in fade-in slide-in-from-bottom-4"
        role="dialog"
        aria-label="Oferta especial"
      >
        <div className="relative rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl shadow-primary/20 p-4 pr-9">
          <button
            onClick={armNext}
            aria-label="Fechar"
            className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Oferta exclusiva pra você</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">Toque pra ver e ajude a manter o site gratuito.</p>
              <button
                onClick={fireAd}
                className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg py-2 transition"
              >
                Ver oferta
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
