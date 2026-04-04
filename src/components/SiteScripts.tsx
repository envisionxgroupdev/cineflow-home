import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

export function SiteScripts() {
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
  const headScripts = codes.head_scripts;
  const bodyScripts = codes.body_scripts;

  // Extract just the content value if user pasted the full meta tag
  const gscContent = gsc?.includes('content="')
    ? gsc.match(/content="([^"]+)"/)?.[1] || gsc
    : gsc;

  return (
    <>
      <Helmet>
        {gaId && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
        )}
        {gaId && (
          <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}</script>
        )}
        {gscContent && (
          <meta name="google-site-verification" content={gscContent} />
        )}
      </Helmet>
      {headScripts && <InjectHead html={headScripts} />}
      {bodyScripts && <InjectBody html={bodyScripts} />}
    </>
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
