import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface EmbedPlayerProps {
  src: string;
  title?: string;
  /** When src changes, the player resets loading state and reloads cleanly */
  resetKey?: string | number;
}

/**
 * Minimal embed player wrapper.
 * - Strict 16:9 frame on every screen
 * - On desktop, the frame is capped to the viewport height so subtitles and
 *   controls are never cropped below the fold.
 * - Loading spinner only (no overlays, no custom controls — iframe owns UX)
 */
export const EmbedPlayer = ({ src, title = 'Player', resetKey }: EmbedPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src, resetKey]);

  useEffect(() => {
    if (loaded) {
      const t = window.setTimeout(() => {
        try { iframeRef.current?.focus(); } catch { /* noop */ }
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [loaded]);

  return (
    <div className="w-full bg-black mx-auto" style={{ maxWidth: 'min(100%, calc((100vh - 180px) * 16 / 9))' }}>
      <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          ref={iframeRef}
          key={`${src}-${resetKey ?? ''}`}
          src={src}
          title={title}
          className="absolute inset-0 w-full h-full bg-black border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; clipboard-write"
          allowFullScreen
          referrerPolicy="origin"
          loading="eager"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
            <Loader2 className="h-9 w-9 text-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
