import { Share2, Send } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

const platforms = [
  { name: 'WhatsApp', color: 'bg-green-600 hover:bg-green-700', icon: '💬', getUrl: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
  { name: 'X', color: 'bg-neutral-800 hover:bg-neutral-900', icon: '𝕏', getUrl: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700', icon: 'f', getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'Telegram', color: 'bg-sky-500 hover:bg-sky-600', icon: 'telegram', getUrl: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'Copiar Link', color: 'bg-secondary hover:bg-secondary/80 text-foreground', icon: '🔗', getUrl: () => '' },
];

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: typeof platforms[0]) => {
    if (platform.name === 'Copiar Link') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    window.open(platform.getUrl(url, title), '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-foreground/10 text-foreground rounded-full text-xs font-medium hover:bg-foreground/15 border border-foreground/15 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" /> Compartilhar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[70] bg-popover border border-border rounded-xl p-2 shadow-2xl min-w-[200px] space-y-1">
            {platforms.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleShare(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors ${p.color}`}
              >
                <span className="text-sm w-5 text-center flex items-center justify-center">
                  {p.icon === 'telegram' ? <Send className="h-3.5 w-3.5" /> : p.icon}
                </span>
                {p.name === 'Copiar Link' && copied ? 'Copiado!' : p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
