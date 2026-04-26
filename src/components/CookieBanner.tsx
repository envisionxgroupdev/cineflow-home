import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "pipocamax_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para não competir com o splash inicial
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch { /* storage indisponível */ }
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch { /* ignore */ }
    setVisible(false);
  };

  const reject = () => {
    try { localStorage.setItem(STORAGE_KEY, "rejected"); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="relative bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-black/40 p-5">
        <button
          onClick={reject}
          aria-label="Fechar aviso"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-display tracking-wider text-foreground">COOKIES & PRIVACIDADE</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Usamos cookies para melhorar sua experiência, lembrar preferências e analisar o tráfego.
              Saiba mais na nossa <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reject}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={accept}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
