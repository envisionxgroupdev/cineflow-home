import { useEffect, useRef, useState } from "react";
import { useSiteCodes } from "./SiteScripts";

interface AdBannerProps {
  position: "top" | "middle" | "bottom";
  page: "home" | "movies" | "series" | "movie_detail" | "series_detail";
}

export function AdBanner({ position, page }: AdBannerProps) {
  const codes = useSiteCodes();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  const key = `ad_${page}_${position}`;
  const html = codes[key];

  useEffect(() => {
    if (!html || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fullHtml = `<!DOCTYPE html>
<html><head><style>
  body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 10px; overflow: hidden; background: transparent; }
  iframe, img { max-width: 100%; }
</style></head>
<body>${html}</body></html>`;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Auto-resize iframe to content height
    const checkHeight = () => {
      try {
        const body = doc.body;
        if (body) {
          const h = Math.max(body.scrollHeight, body.offsetHeight);
          if (h > 10) setHeight(h);
        }
      } catch (e) {}
    };

    // Check multiple times as ads load asynchronously
    const intervals = [100, 500, 1000, 2000, 3000, 5000];
    const timers = intervals.map(ms => setTimeout(checkHeight, ms));

    return () => { timers.forEach(clearTimeout); };
  }, [html]);

  if (!html) return null;

  return (
    <div className="w-full flex justify-center py-3">
      <iframe
        ref={iframeRef}
        className="border-0 max-w-[728px] w-full"
        style={{ height: height > 0 ? `${height}px` : '300px', background: 'transparent' }}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        title={`Ad ${page} ${position}`}
      />
    </div>
  );
}
