import { useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, RefreshCw, Monitor, Sparkles } from 'lucide-react';

interface EmbedPlayerProps {
  src: string;
  title?: string;
  /** When src changes, the player resets loading state and reloads cleanly */
  resetKey?: string | number;
}

/**
 * High-quality embed player wrapper:
 * - Loading overlay until iframe is ready
 * - Native fullscreen button
 * - Theater mode (wider container) toggle
 * - Reload button (helps if stream stalls)
 * - Proper `allow` flags for autoplay, fullscreen, PiP, encrypted-media
 * - HD quality tip overlay (auto-hides)
 */
export const EmbedPlayer = ({ src, title = 'Player', resetKey }: EmbedPlayerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Reset state when source changes
  useEffect(() => {
    setLoaded(false);
    setShowTip(true);
    const t = setTimeout(() => setShowTip(false), 6000);
    return () => clearTimeout(t);
  }, [src, resetKey, reloadKey]);

  // Track native fullscreen state
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback: try fullscreen on iframe directly
      try { await iframeRef.current?.requestFullscreen(); } catch {}
    }
  };

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div
      className={`transition-all duration-300 ${
        theater ? 'fixed inset-x-0 top-16 bottom-0 z-40 bg-black/95 px-2 sm:px-6 py-4 overflow-y-auto' : ''
      }`}
    >
      <div
        ref={wrapperRef}
        className={`relative bg-black ${theater ? 'max-w-[1600px] mx-auto rounded-xl overflow-hidden' : ''}`}
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
            onLoad={() => setLoaded(true)}
          />

          {/* Loading overlay */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/95 pointer-events-none">
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Carregando player…</p>
            </div>
          )}

          {/* HD tip */}
          {loaded && showTip && (
            <div className="absolute top-3 left-3 max-w-[260px] sm:max-w-xs bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 pointer-events-none">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug text-white/90">
                Para a melhor qualidade, toque na engrenagem ⚙️ do player e selecione <strong>HD/1080p</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Floating action bar (outside iframe so it stays clickable) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 z-10">
          <button
            onClick={reload}
            title="Recarregar player"
            className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheater((t) => !t)}
            title={theater ? 'Sair do modo cinema' : 'Modo cinema'}
            className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
              theater ? 'bg-primary text-primary-foreground' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {theater && (
        <p className="text-center text-xs text-white/60 mt-3">
          Modo cinema ativo · clique no monitor para voltar
        </p>
      )}
    </div>
  );
};
