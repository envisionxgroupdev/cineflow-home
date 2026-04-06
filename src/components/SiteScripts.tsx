import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';

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
    let active = true;

    const loadCodes = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (!active || !data) return;

      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setCodes(map);
    };

    const handleSettingsUpdated = () => {
      void loadCodes();
    };

    void loadCodes();
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      active = false;
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, []);

  const headScripts = codes.head_scripts;
  const bodyScripts = codes.body_scripts;

  return (
    <SiteCodesContext.Provider value={codes}>
      {headScripts && <InjectHead html={headScripts} />}
      {bodyScripts && <InjectBody html={bodyScripts} />}
      {children}
    </SiteCodesContext.Provider>
  );
}

function cloneAndActivate(node: Node): Node {
  if (node.nodeName === 'SCRIPT') {
    const oldScript = node as HTMLScriptElement;
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.textContent = oldScript.textContent;
    return newScript;
  }
  return node.cloneNode(true);
}

function InjectHead({ html }: { html: string }) {
  useEffect(() => {
    const container = document.createElement('div');
    container.innerHTML = html;
    const nodes: Node[] = [];
    container.childNodes.forEach(node => {
      const active = cloneAndActivate(node);
      document.head.appendChild(active);
      nodes.push(active);
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
      const active = cloneAndActivate(node);
      document.body.appendChild(active);
      nodes.push(active);
    });
    return () => { nodes.forEach(n => n.parentNode?.removeChild(n)); };
  }, [html]);
  return null;
}
