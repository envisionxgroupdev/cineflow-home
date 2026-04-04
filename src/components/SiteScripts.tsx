import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SiteCodesContext = createContext<Record<string, string>>({});
export const useSiteCodes = () => useContext(SiteCodesContext);

function extractContent(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  const trimmed = tag.trim();
  // If it's a full meta tag, extract content attribute
  if (trimmed.startsWith('<')) {
    return trimmed.match(/content="([^"]+)"/)?.[1] || undefined;
  }
  // Otherwise treat as raw value
  return trimmed || undefined;
}

function useInjectMeta(name: string, content: string | undefined) {
  useEffect(() => {
    if (!content) return;
    const meta = document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [name, content]);
}

function useInjectScript(src: string, id: string) {
  useEffect(() => {
    if (!src || document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [src, id]);
}

function useInjectInlineScript(code: string, id: string) {
  useEffect(() => {
    if (!code || document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.textContent = code;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [code, id]);
}

export function SiteScripts({ children }: { children?: React.ReactNode }) {
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
        setCodes(map);
      }
    });
  }, []);

  const gaId = codes.google_analytics;
  const gsc = extractContent(codes.google_search_console);
  const bing = extractContent(codes.bing_webmaster);
  const yandex = extractContent(codes.yandex_webmaster);
  const headScripts = codes.head_scripts;
  const bodyScripts = codes.body_scripts;

  // Inject verification meta tags directly into DOM
  useInjectMeta('google-site-verification', gsc);
  useInjectMeta('msvalidate.01', bing);
  useInjectMeta('yandex-verification', yandex);

  // Inject Google Analytics
  useInjectScript(
    gaId ? `https://www.googletagmanager.com/gtag/js?id=${gaId}` : '',
    'ga-script'
  );
  useInjectInlineScript(
    gaId ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');` : '',
    'ga-config'
  );

  return (
    <SiteCodesContext.Provider value={codes}>
      {headScripts && <InjectHead html={headScripts} />}
      {bodyScripts && <InjectBody html={bodyScripts} />}
      {children}
    </SiteCodesContext.Provider>
  );
}

function InjectHead({ html }: { html: string }) {
  useEffect(() => {
    const container = document.createElement('div');
    container.innerHTML = html;
    const nodes: Node[] = [];
    container.childNodes.forEach(node => {
      const cloned = node.cloneNode(true);
      document.head.appendChild(cloned);
      nodes.push(cloned);
    });
    return () => { nodes.forEach(n => n.parentNode?.removeChild(n)); };
  }, [html]);
  return null;
}

function InjectBody({ html }: { html: string }) {
  useEffect(() => {
    const container = document.createElement('div');
    container.innerHTML = html;
    const nodes: Node[] = [];
    container.childNodes.forEach(node => {
      const cloned = node.cloneNode(true);
      document.body.appendChild(cloned);
      nodes.push(cloned);
    });
    return () => { nodes.forEach(n => n.parentNode?.removeChild(n)); };
  }, [html]);
  return null;
}
