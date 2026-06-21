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
 * Reactive hook — returns whether the CURRENT route is allowed to render ads.
 * Works outside <BrowserRouter> by patching history methods + listening to
 * popstate, so SiteScripts (which wraps the router) can use it.
 */
export function useIsAdAllowedRoute(): boolean {
  const getPath = () => (typeof window === 'undefined' ? '/' : window.location.pathname);
  const [allowed, setAllowed] = useState<boolean>(() => isAdAllowedPath(getPath()));

  useEffect(() => {
    const update = () => setAllowed(isAdAllowedPath(getPath()));

    // Patch history methods once so SPA navigations trigger a custom event.
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

  return allowed;
}
