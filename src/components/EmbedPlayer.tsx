import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, RefreshCw, Monitor, Sparkles, X } from 'lucide-react';

interface EmbedPlayerProps {
  src: string;
  title?: string;
  /** When src changes, the player resets loading state and reloads cleanly */
  resetKey?: string | number;
}

const HIDE_DELAY = 2500;

/**
 * High-quality embed player wrapper with cinema & fullscreen UX:
 * - Cinema mode: true full-viewport overlay, body scroll locked, ESC to exit
 * - Fullscreen: native, auto landscape lock on mobile when possible
 * - Auto-hiding controls on inactivity, always visible on hover/tap
 * - Touch-friendly controls (44px) on mobile
 * - Loading overlay, reload, HD tip
 */
export const EmbedPlayer = ({ src, title = 'Player', resetKey }: EmbedPlayerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const immersive = theater || isFullscreen;

  // Reset when source changes
  useEffect(() => {
    setLoaded(false);
    setShowTip(true);
    const t = window.setTimeout(() => setShowTip(false), 5000);
    return () => window.clearTimeout(t);
  }, [src, resetKey, reloadKey]);

  // Auto-hide controls
  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (!immersive) {
      setControlsVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      return;
    }
    bumpControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [immersive, bumpControls]);

  // Track native fullscreen state
  useEffect(() => {
    const onFs = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Try lock landscape on mobile when entering fullscreen
      if (fs && screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })
          .lock?.('landscape')
          .catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Lock body scroll in theater + ESC to exit
  useEffect(() => {
    if (!theater) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTheater(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [theater]);

  // Auto-focus iframe when it loads so keyboard controls work
  useEffect(() => {
    if (loaded) {
      const t = window.setTimeout(() => {
        try { iframeRef.current?.focus(); } catch {}
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [loaded, reloadKey]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      try { await iframeRef.current?.requestFullscreen(); } catch {}
    }
  };

  const reload = () => {
    setLoaded(false);
    setReloadKey((k) => k + 1);
  };

  const exitTheater = () => setTheater(false);

  return (
    <>
      {/* Backdrop for cinema mode (separate so it sits below the player but above page) */}
      {theater && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm animate-in fade-in"
          onClick={exitTheater}
        />
      )}

      <div
        className={
          theater
            ? 'fixed inset-0 z-[61] flex items-center justify-center p-2 sm:p-6 pointer-events-none'
            : ''
        }
      >
        <div
          ref={wrapperRef}
          onMouseMove={immersive ? bumpControls : undefined}
          onTouchStart={immersive ? bumpControls : undefined}
          onClick={(e) => {
            if (theater) e.stopPropagation();
            if (immersive) bumpControls();
          }}
          className={`relative bg-black group ${
            theater
              ? 'w-full max-w-[1600px] max-h-full rounded-xl overflow-hidden shadow-2xl pointer-events-auto'
              : ''
          } ${immersive && !controlsVisible ? 'cursor-none' : ''}`}
        >
          {/* 16:9 frame */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              ref={iframeRef}
              key={`${src}-${reloadKey}`}
              src={src}
              title={title}
              className="absolute inset-0 w-full h-full bg-black"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; clipboard-write"
              allowFullScreen
              referrerPolicy="origin"
              loading="eager"
              // Sandbox restricts the third-party player from reading parent-page
              // cookies/localStorage or navigating the top window, while still
              // allowing scripts/playback/popups required by the embed.
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setLoaded(true)}
            />

            {/* Loading overlay */}
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black pointer-events-none">
                <Loader2 className="h-9 w-9 text-primary animate-spin" />
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Carregando player…</p>
              </div>
            )}

            {/* HD tip */}
            {loaded && showTip && controlsVisible && (
              <div className="absolute top-3 left-3 max-w-[240px] sm:max-w-xs bg-black/75 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 pointer-events-none">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug text-white/90">
                  Para a melhor qualidade, toque na engrenagem ⚙️ do player e selecione <strong>HD/1080p</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Floating action bar */}
          <div
            className={`absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-full p-1 z-10 transition-opacity duration-300 ${
              immersive && !controlsVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <button
              onClick={reload}
              title="Recarregar player"
              aria-label="Recarregar player"
              className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheater((t) => !t)}
              title={theater ? 'Sair do modo cinema' : 'Modo cinema'}
              aria-label="Modo cinema"
              className={`h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-full transition-colors ${
                theater ? 'bg-primary text-primary-foreground' : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/20'
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              aria-label="Tela cheia"
              className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {theater && (
              <button
                onClick={exitTheater}
                title="Fechar (Esc)"
                aria-label="Fechar"
                className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-destructive/80 active:bg-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Theater hint */}
          {theater && controlsVisible && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/80 pointer-events-none">
              Modo cinema · pressione <kbd className="px-1 mx-0.5 rounded bg-white/15">Esc</kbd> para sair
            </div>
          )}
        </div>
      </div>
    </>
  );
};
