import { Share2, Send, Link as LinkIcon, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

const platforms = [
  { name: 'WhatsApp', color: 'bg-green-600 hover:bg-green-700', icon: '💬', getUrl: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
  { name: 'Telegram', color: 'bg-sky-500 hover:bg-sky-600', icon: 'telegram', getUrl: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'X', color: 'bg-neutral-800 hover:bg-neutral-900', icon: '𝕏', getUrl: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700', icon: 'f', getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
];

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleShare = (p: typeof platforms[0]) => {
    window.open(p.getUrl(url, title), '_blank', 'noopener,noreferrer,width=600,height=500');
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {} document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-foreground/10 text-foreground rounded-full text-xs font-medium hover:bg-foreground/15 border border-foreground/15 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" /> Compartilhar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-popover border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Compartilhar</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {platforms.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleShare(p)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-white text-[10px] font-medium transition-colors ${p.color}`}
                >
                  <span className="h-7 w-7 flex items-center justify-center text-base">
                    {p.icon === 'telegram' ? <Send className="h-4 w-4" /> : p.icon}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2 bg-secondary/60 border border-border rounded-lg">
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={url}
                onFocus={e => e.currentTarget.select()}
                className="flex-1 bg-transparent text-xs text-foreground outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:brightness-110'}`}
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Copiado</> : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
