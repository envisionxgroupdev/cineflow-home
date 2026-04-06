import { useEffect, useRef } from "react";
import { useSiteCodes } from "./SiteScripts";

interface AdBannerProps {
  position: "top" | "middle" | "bottom";
  page: "home" | "movies" | "series";
}

function cloneAndActivate(node: Node): Node {
  if (node.nodeName === "SCRIPT") {
    const oldScript = node as HTMLScriptElement;
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach(attr => {
      let val = attr.value;
      // Add cache-busting to external script src to force re-execution
      if (attr.name === "src" && val) {
        const sep = val.includes("?") ? "&" : "?";
        val = `${val}${sep}_cb=${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
      newScript.setAttribute(attr.name, val);
    });
    newScript.textContent = oldScript.textContent;
    return newScript;
  }
  return node.cloneNode(true);
}

export function AdBanner({ position, page }: AdBannerProps) {
  const codes = useSiteCodes();
  const containerRef = useRef<HTMLDivElement>(null);
  const key = `ad_${page}_${position}`;
  const html = codes[key];

  useEffect(() => {
    if (!html || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = html;
    const nodes: Node[] = [];
    temp.childNodes.forEach(node => {
      const active = cloneAndActivate(node);
      container.appendChild(active);
      nodes.push(active);
    });

    return () => {
      nodes.forEach(n => n.parentNode?.removeChild(n));
    };
  }, [html]);

  if (!html) return null;

  return (
    <div className="w-full flex justify-center py-3">
      <div ref={containerRef} className="max-w-[728px] w-full" />
    </div>
  );
}
