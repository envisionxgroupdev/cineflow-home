import { useEffect, useState } from "react";

interface Props {
  /** When true, the splash fades out and unmounts after the exit animation. */
  done?: boolean;
  /** Optional tagline shown under the logo */
  tagline?: string;
}

/**
 * Full-screen branded loader: animated PipocaMax logo + progress bar.
 * Auto-progresses smoothly; jumps to 100% and fades out when `done` is true.
 */
export function SplashLoader({ done = false, tagline = "Carregando sua sessão de cinema..." }: Props) {
  const [progress, setProgress] = useState(8);
  const [hidden, setHidden] = useState(false);

  // Smooth fake progress: ease toward 90% while loading
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setProgress(p => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.06) : p));
    }, 120);
    return () => clearInterval(id);
  }, [done]);

  // On done: snap to 100, then fade out
  useEffect(() => {
    if (!done) return;
    setProgress(100);
    const t = setTimeout(() => setHidden(true), 550);
    return () => clearTimeout(t);
  }, [done]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      {/* Cinematic radial backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background))_85%)]" />

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-full bg-card border border-primary/40 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)] animate-[splash-bob_2.4s_ease-in-out_infinite]">
            <img
              src="/favicon.png"
              alt="PipocaMax"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.18em] text-foreground">
            PIPOCA<span className="text-gradient-cinema">MAX</span>
          </h1>
          <p className="text-xs text-muted-foreground tracking-wide">{tagline}</p>
        </div>

        {/* Progress bar */}
        <div className="w-64 md:w-80 h-1.5 rounded-full bg-secondary/70 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-[width] duration-200 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.7)]"
            style={{ width: `${progress}%` }}
          />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[splash-shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <p className="text-[11px] font-mono text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
      </div>

      <style>{`
        @keyframes splash-bob {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.04); }
        }
        @keyframes splash-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
