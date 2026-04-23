import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import SEO from '@/components/SEO';

/**
 * The SEO component owns the per-route head tags. We verify:
 *   - <title> updates on mount
 *   - meta description / og / twitter mirror the props
 *   - canonical link resolves relative paths against the production origin
 *   - JSON-LD scripts are added on mount and removed on unmount (no leak)
 */
describe('components/SEO', () => {
  beforeEach(() => {
    cleanup();
    document.title = '';
    // Strip any leftover head tags from prior tests so assertions are stable.
    document.head
      .querySelectorAll('meta, link[rel="canonical"], script[data-seo="route"]')
      .forEach((el) => el.remove());
  });

  it('sets the document title', () => {
    render(<SEO title="My Page" />);
    expect(document.title).toBe('My Page');
  });

  it('upserts description on the description and og:description meta tags', () => {
    render(<SEO title="T" description="Hello world" />);
    const desc = document.head.querySelector('meta[name="description"]');
    const og = document.head.querySelector('meta[property="og:description"]');
    const tw = document.head.querySelector('meta[name="twitter:description"]');
    expect(desc?.getAttribute('content')).toBe('Hello world');
    expect(og?.getAttribute('content')).toBe('Hello world');
    expect(tw?.getAttribute('content')).toBe('Hello world');
  });

  it('resolves a relative canonicalPath against the production origin', () => {
    render(<SEO title="T" canonicalPath="/about" />);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://govtrack.climatrix.co.ke/about');
  });

  it('uses an absolute canonicalPath as-is', () => {
    render(<SEO title="T" canonicalPath="https://example.com/x" />);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://example.com/x');
  });

  it('injects a JSON-LD script and cleans it up on unmount', () => {
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: 'X' };
    const { unmount } = render(<SEO title="T" jsonLd={ld} />);
    const script = document.head.querySelector('script[data-seo="route"]');
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"Article"');
    unmount();
    expect(document.head.querySelector('script[data-seo="route"]')).toBeNull();
  });

  it('falls back to the default OG image when none is provided', () => {
    render(<SEO title="T" />);
    const og = document.head.querySelector('meta[property="og:image"]');
    expect(og?.getAttribute('content')).toBe('https://govtrack.climatrix.co.ke/og-preview.jpg');
  });

  it('respects an image override', () => {
    render(<SEO title="T" image="https://cdn.example.com/x.jpg" />);
    const og = document.head.querySelector('meta[property="og:image"]');
    expect(og?.getAttribute('content')).toBe('https://cdn.example.com/x.jpg');
  });
});
