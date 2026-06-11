import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

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

  const close = () => {
    setExpanded(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {/* Cinema ticket card */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          expanded
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        style={{ filter: "drop-shadow(0 20px 40px rgba(229,9,20,0.35))" }}
      >
        <div className="relative flex w-[280px] sm:w-[320px]">
          {/* Main ticket body */}
          <div className="relative flex-1 bg-[#e50914] rounded-l-2xl overflow-hidden p-4 sm:p-5">
            {/* Notches */}
            <div className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-background rounded-full" />
            <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-background rounded-full" />

            <div className="flex items-start gap-3">
              {/* Icon plate */}
              <div className="flex-shrink-0 w-11 h-11 bg-white rounded-lg rotate-[-4deg] flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 fill-[#e50914]" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 7.007l-2.012 9.491c-.153.674-.554.839-1.12.521l-3.062-2.257-1.478 1.422c-.163.163-.3.3-.614.3l.219-3.111 5.662-5.116c.246-.219-.054-.341-.381-.123l-7.001 4.409-3.016-.944c-.655-.205-.667-.655.137-.969l11.77-4.535c.544-.205 1.02.121.896.896z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-bold tracking-[0.2em] text-red-100/80 mb-0.5 font-mono">
                  ADMIT ONE · GRUPO
                </span>
                <h3 className="text-lg sm:text-xl text-white leading-none mb-1 font-bold tracking-tight">
                  ENTRE NO GRUPO
                </h3>
                <p className="text-[10px] sm:text-[11px] text-red-50/90 leading-tight font-medium">
                  Lançamentos e suporte.
                </p>
              </div>
            </div>

            {/* Footer row */}
            <div className="mt-3 pt-3 border-t border-dashed border-red-200/30 flex justify-between items-center">
              <div className="text-[8px] text-red-100/60 font-bold tracking-tighter font-mono">
                #PIPOCAMAX-2026
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_6px_rgba(110,231,183,0.9)]" />
                <span className="text-[9px] font-bold text-white tracking-wider">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Ticket stub CTA */}
          <a
            href="https://t.me/+ABLySKDmGy4zNDcx"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-16 sm:w-20 bg-[#b8070f] rounded-r-2xl flex items-center justify-center overflow-hidden group active:scale-95 transition-transform"
            aria-label="Participar do grupo no Telegram"
          >
            {/* grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />
            {/* Notches */}
            <div className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-background rounded-full" />
            <div className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-background rounded-full" />

            <div className="relative flex flex-col items-center gap-1.5">
              <span
                className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                PARTICIPAR
              </span>
              <ArrowRight className="w-4 h-4 text-white -rotate-90 transition-transform group-hover:-translate-y-0.5" />
            </div>
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute -top-2 -right-2 w-6 h-6 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-10"
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label="Abrir convite do Telegram"
        className="relative group"
      >
        <span className="absolute inset-0 rounded-full bg-[#e50914] opacity-60 animate-ping" />
        <span className="absolute -inset-1 rounded-full bg-[#e50914]/30 blur-md" />
        <span className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#e50914] border-2 border-white/90 shadow-[0_8px_24px_-4px_rgba(229,9,20,0.7)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 fill-white drop-shadow">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-400 ring-2 ring-background" />
        </span>
      </button>
    </div>
  );
};
