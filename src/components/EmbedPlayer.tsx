import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InterstitialAd } from './InterstitialAd';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';

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
 * - Optional 5s interstitial ad before the iframe mounts (configured in admin
 *   under "Anúncios → Player → Interstitial").
 */
export const EmbedPlayer = ({ src, title = 'Player', resetKey }: EmbedPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [interstitialHtml, setInterstitialHtml] = useState<string>('');
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Load interstitial HTML once + on settings update
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ad_interstitial_player')
        .maybeSingle();
      if (!cancelled) setInterstitialHtml(data?.value || '');
    };
    load();
    const onUpdate = () => load();
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, onUpdate);
    };
  }, []);

  // Show interstitial whenever src/resetKey changes (if configured)
  useEffect(() => {
    setLoaded(false);
    setShowInterstitial(Boolean(interstitialHtml.trim()));
  }, [src, resetKey, interstitialHtml]);

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
        {!showInterstitial && (
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
        )}
        {!showInterstitial && !loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
            <Loader2 className="h-9 w-9 text-primary animate-spin" />
          </div>
        )}
        {showInterstitial && (
          <InterstitialAd
            html={interstitialHtml}
            seconds={5}
            onClose={() => setShowInterstitial(false)}
          />
        )}
      </div>
    </div>
  );
};
