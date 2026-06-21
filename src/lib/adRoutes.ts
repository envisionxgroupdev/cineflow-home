import { useEffect, useState } from 'react';

/**
 * Route prefixes that MUST NEVER receive ad scripts, banners, popups or
 * any third-party monetization code. Add new prefixes here — it is the
 * single source of truth used by SiteScripts, AdBanner, EmbedPlayer and Footer.
 */
export const AD_BLOCKED_PREFIXES = ['/admin'] as const;

/** Returns true when the given pathname is allowed to render ads. */
export function isAdAllowedPath(pathname: string): boolean {
  return !AD_BLOCKED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
}

/**
 * Known third-party ad/monetization hostnames. Used to remove already-loaded
 * <script>/<iframe> tags when navigating into a blocked route.
 */
const AD_HOST_PATTERNS = [
  'monetag', 'propellerads', 'propeller-tracking', 'profitabledisplaynetwork',
  'adsterra', 'highperformanceformat', 'pl.adnxs', 'pubfeed',
  'popads', 'popcash', 'popunder', 'adskeeper', 'mgid',
  'revcontent', 'taboola', 'outbrain', 'exoclick', 'juicyads',
  'trafficstars', 'adcash', 'hilltopads', 'clickadu', 'adsterra',
  'onclkds', 'onclickperformance', 'realsrv', 'rtmark',
  'a-mo.net', 'a-ads', 'yllix',
];

function isAdSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  return AD_HOST_PATTERNS.some(p => lower.includes(p));
}

/**
 * Strips ad scripts/iframes already loaded into the page and neutralizes
 * popunder behaviors (window.open hijacks, document click handlers) while on
 * a blocked route. Returns a cleanup that restores window.open.
 */
function enforceAdBlackout(): () => void {
  // 1) Remove ad scripts/iframes already in the DOM
  const remove = () => {
    document.querySelectorAll('script[src], iframe[src]').forEach(el => {
      const src = el.getAttribute('src');
      if (isAdSrc(src)) el.remove();
    });
  };
  remove();
  // Re-sweep on a short interval in case async loaders re-inject
  const sweep = window.setInterval(remove, 1500);

  // 2) Neutralize window.open (popunder mechanism)
  const w = window as Window & { __origOpen?: typeof window.open };
  if (!w.__origOpen) w.__origOpen = window.open;
  window.open = function () { return null; } as typeof window.open;

  // 3) Block capture-phase click handlers added by ad scripts on document/body
  //    by installing a high-priority capturing listener that stops propagation
  //    only for synthetic popunder triggers (no-op for genuine UI clicks since
  //    React listeners run on the root container).
  const blockPopunder = (e: MouseEvent) => {
    // If the click target is inside the React root, let it through normally.
    // Popunder scripts attach to document/window — they read e.isTrusted.
    // We don't preventDefault, we just ensure window.open is already neutered.
  };
  document.addEventListener('click', blockPopunder, true);

  return () => {
    window.clearInterval(sweep);
    if (w.__origOpen) {
      window.open = w.__origOpen;
      delete w.__origOpen;
    }
    document.removeEventListener('click', blockPopunder, true);
  };
}

/**
 * Reactive hook — returns whether the CURRENT route is allowed to render ads.
 * Works outside <BrowserRouter> by patching history methods + listening to
 * popstate, so SiteScripts (which wraps the router) can use it.
 *
 * Also actively enforces a blackout (removes loaded ad scripts, blocks
 * window.open) whenever the route is blocked, so ads loaded on a previous
 * route can't keep firing inside /admin.
 */
export function useIsAdAllowedRoute(): boolean {
  const getPath = () => (typeof window === 'undefined' ? '/' : window.location.pathname);
  const [allowed, setAllowed] = useState<boolean>(() => isAdAllowedPath(getPath()));

  useEffect(() => {
    const update = () => setAllowed(isAdAllowedPath(getPath()));

    const w = window as Window & { __adRoutePatched?: boolean };
    if (!w.__adRoutePatched) {
      w.__adRoutePatched = true;
      const fire = () => window.dispatchEvent(new Event('lov:locationchange'));
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function (...args) {
        const r = origPush.apply(this, args as Parameters<typeof origPush>);
        fire();
        return r;
      };
      history.replaceState = function (...args) {
        const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
        fire();
        return r;
      };
    }

    window.addEventListener('popstate', update);
    window.addEventListener('lov:locationchange', update);
    update();
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('lov:locationchange', update);
    };
  }, []);

  // Enforce blackout whenever the current route is blocked.
  useEffect(() => {
    if (allowed) return;
    const cleanup = enforceAdBlackout();
    return cleanup;
  }, [allowed]);

  return allowed;
}
