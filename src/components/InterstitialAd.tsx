import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface InterstitialAdProps {
  html: string;
  seconds?: number;
  onClose: () => void;
}

/**
 * Full-frame interstitial that renders raw ad HTML inside a sandboxed iframe.
 * Shows a countdown and reveals the close button only after `seconds` elapse.
 */
export const InterstitialAd = ({ html, seconds = 5, onClose }: InterstitialAdProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fullHtml = `<!DOCTYPE html>
<html><head><style>
  html,body { margin:0; padding:0; width:100%; height:100%; background:#000; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  img, iframe { max-width:100%; max-height:100%; border:0; }
</style></head>
<body>${html}</body></html>`;
    doc.open();
    doc.write(fullHtml);
    doc.close();
  }, [html]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining]);

  return (
    <div className="absolute inset-0 z-20 bg-black flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-black/90 border-b border-white/10">
        <span className="text-xs text-white/70 font-medium">Publicidade</span>
        {remaining > 0 ? (
          <span className="text-xs text-white/60">Aguarde {remaining}s…</span>
        ) : (
          <button
            onClick={onClose}
            aria-label="Fechar anúncio e iniciar player"
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 transition"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Pular e assistir
          </button>
        )}
      </div>
      <iframe
        ref={iframeRef}
        title="Anúncio antes do player"
        className="flex-1 w-full border-0 bg-black"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-forms"
      />
    </div>
  );
};
