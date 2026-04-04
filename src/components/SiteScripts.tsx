import { useEffect, useState, createContext, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

const SiteCodesContext = createContext<Record<string, string>>({});
export const useSiteCodes = () => useContext(SiteCodesContext);

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
  const gsc = codes.google_search_console;
  const bing = codes.bing_webmaster;
  const yandex = codes.yandex_webmaster;
  const headScripts = codes.head_scripts;
  const bodyScripts = codes.body_scripts;

  const extractContent = (tag: string | undefined) => {
    if (!tag) return undefined;
    return tag.includes('content="') ? tag.match(/content="([^"]+)"/)?.[1] || tag : tag;
  };

  return (
    <SiteCodesContext.Provider value={codes}>
      <Helmet>
        {gaId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />}
        {gaId && <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}</script>}
        {extractContent(gsc) && <meta name="google-site-verification" content={extractContent(gsc)!} />}
        {extractContent(bing) && <meta name="msvalidate.01" content={extractContent(bing)!} />}
        {extractContent(yandex) && <meta name="yandex-verification" content={extractContent(yandex)!} />}
      </Helmet>
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
