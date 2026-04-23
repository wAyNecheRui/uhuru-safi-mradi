import { useEffect } from 'react';

/**
 * Lightweight per-route SEO updater.
 *
 * We avoid pulling in react-helmet to keep the bundle lean. This component
 * imperatively syncs the <title>, <meta name="description">, and
 * <link rel="canonical"> for the route it renders on, then restores nothing
 * (the next route's <SEO> takes over, or `index.html`'s defaults remain).
 *
 * For deep SEO needs (per-project Article schema, etc.) extend with a
 * `jsonLd` prop that injects a script tag.
 */
export interface SEOProps {
  title: string;
  description?: string;
  /** Pathless canonical (e.g. "/about") — domain is auto-prefixed. */
  canonicalPath?: string;
  /** Optional JSON-LD object to inject as application/ld+json. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Override og:image (absolute URL). */
  image?: string;
}

const SITE_URL = 'https://govtrack.climatrix.co.ke';
const DEFAULT_IMAGE = `${SITE_URL}/og-preview.jpg`;

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export const SEO = ({ title, description, canonicalPath, jsonLd, image }: SEOProps) => {
  useEffect(() => {
    // Title (kept under ~60 chars by callers)
    document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);

    const ogImage = image ?? DEFAULT_IMAGE;
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    if (canonicalPath) {
      const href = canonicalPath.startsWith('http')
        ? canonicalPath
        : `${SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
      upsertCanonical(href);
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', href);
    }

    // JSON-LD (cleaned up on unmount so we don't accumulate scripts)
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.dataset.seo = 'route';
      scriptEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, canonicalPath, image, jsonLd]);

  return null;
};

export default SEO;
