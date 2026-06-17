import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle2, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';

type BannerType = 'info' | 'warning' | 'success' | 'announcement';

interface BannerData {
  enabled: boolean;
  message: string;
  type: BannerType;
  link: string;
  linkLabel: string;
  version: string;
}

const KEYS = {
  enabled: 'announcement_enabled',
  message: 'announcement_message',
  type: 'announcement_type',
  link: 'announcement_link',
  linkLabel: 'announcement_link_label',
  version: 'announcement_version',
};

const STORAGE_PREFIX = 'pmx-announcement-dismissed:';

const TYPE_STYLES: Record<BannerType, { wrap: string; icon: typeof Info }> = {
  info: {
    wrap: 'bg-primary text-primary-foreground',
    icon: Info,
  },
  warning: {
    wrap: 'bg-amber-500 text-black',
    icon: AlertTriangle,
  },
  success: {
    wrap: 'bg-emerald-500 text-black',
    icon: CheckCircle2,
  },
  announcement: {
    wrap: 'bg-foreground text-background',
    icon: Megaphone,
  },
};

export async function loadAnnouncement(): Promise<BannerData | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('key,value')
    .in('key', Object.values(KEYS));
  if (!data) return null;
  const map = new Map<string, string>();
  for (const row of data as { key: string; value: string }[]) map.set(row.key, row.value);
  return {
    enabled: map.get(KEYS.enabled) === 'true',
    message: map.get(KEYS.message) ?? '',
    type: (map.get(KEYS.type) as BannerType) || 'announcement',
    link: map.get(KEYS.link) ?? '',
    linkLabel: map.get(KEYS.linkLabel) ?? 'Saiba mais',
    version: map.get(KEYS.version) ?? '1',
  };
}

export const SITE_ANNOUNCEMENT_KEYS = KEYS;

export function SiteAnnouncementBanner() {
  const [data, setData] = useState<BannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const d = await loadAnnouncement();
    setData(d);
    if (d) {
      const stored = localStorage.getItem(STORAGE_PREFIX + d.version);
      setDismissed(stored === '1');
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handler);
  }, []);

  const visible = !!(data && data.enabled && data.message.trim() && !dismissed);

  // Measure banner height and expose as CSS variable so the fixed navbar can offset itself.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible || !ref.current) {
      root.style.setProperty('--announcement-h', '0px');
      return;
    }
    const el = ref.current;
    const update = () => {
      root.style.setProperty('--announcement-h', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      root.style.setProperty('--announcement-h', '0px');
    };
  }, [visible, data?.message, data?.link, data?.linkLabel]);

  if (!visible || !data) return null;

  const { wrap, icon: Icon } = TYPE_STYLES[data.type] ?? TYPE_STYLES.announcement;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_PREFIX + data.version, '1');
    setDismissed(true);
  };

  return (
    <div
      ref={ref}
      className={`${wrap} fixed top-0 left-0 right-0 z-[60] w-full shadow-md`}
      role="status"
    >
      <div className="max-w-[1600px] mx-auto flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-2.5 pr-10 sm:pr-12">
        <Icon className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-[13px] sm:text-sm font-medium leading-snug flex-1 break-words">
          {data.message}
          {data.link && (
            <a
              href={data.link}
              target={data.link.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="ml-2 underline underline-offset-2 font-semibold hover:opacity-80 inline-block"
            >
              {data.linkLabel || 'Saiba mais'} →
            </a>
          )}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Fechar aviso"
        className="absolute right-1.5 sm:right-2 top-1.5 sm:top-1/2 sm:-translate-y-1/2 p-1.5 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
