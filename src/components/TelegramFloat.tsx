import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "telegram-float-dismissed";

export const TelegramFloat = () => {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1";
    setHidden(false);
    if (!dismissed) {
      const t = setTimeout(() => setExpanded(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3">
      {/* Floating button */}
      <a
        href="https://t.me/+ABLySKDmGy4zNDcx"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Entrar no grupo do Telegram"
        className="relative group"
        onMouseEnter={() => setExpanded(true)}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#229ED9] opacity-60 animate-ping" />
        <span className="absolute -inset-1 rounded-full bg-[#229ED9]/30 blur-md" />

        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1E88C7] shadow-[0_8px_24px_-4px_rgba(34,158,217,0.6)] ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white drop-shadow">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          {/* Online dot */}
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-background" />
        </span>
      </a>

      {/* Expandable card */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl shadow-[#229ED9]/20 backdrop-blur-xl transition-all duration-500 ease-out ${
          expanded ? "max-w-[280px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
        }`}
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[#229ED9]/30 blur-2xl" />

        <div className="relative flex items-start gap-3 py-3 pl-3 pr-7 min-w-[240px]">
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2AABEE]">Telegram</span>
              <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
              </span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-foreground leading-tight">
              Entre no nosso grupo
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
              Lançamentos, novidades e suporte em primeira mão.
            </p>
            <a
              href="https://t.me/+ABLySKDmGy4zNDcx"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2AABEE] hover:text-[#56c1f1] transition-colors"
            >
              Participar agora →
            </a>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
              try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
            }}
            aria-label="Fechar"
            className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
