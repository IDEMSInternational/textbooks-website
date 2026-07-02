// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Deployment subpath (GitHub Pages project site). Defined as a const so both
// Astro's `base` and the markdown link plugin below stay in sync.
const base = '/textbooks-website';

/**
 * remark plugin: prefix `base` onto root-absolute internal links in markdown
 * content (`href="/join"` → `href="/textbooks-website/join"`), so links authored
 * in `.md` pages respect the deployment subpath the way `import.meta.env.BASE_URL`
 * does in `.astro` files. Handles both markdown link syntax and raw-HTML
 * `<a href>` / `<img src>`. Skips external URLs, protocol-relative `//`, anchors,
 * and links already under `base`.
 */
function remarkBaseLinks() {
  const prefix = base.replace(/\/$/, '');
  /** @param {string=} url */
  const rewrite = (url) =>
    url &&
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith(prefix + '/')
      ? prefix + url
      : url;
  /** @param {any} node */
  const walk = (node) => {
    if (node.type === 'link' && node.url) {
      node.url = rewrite(node.url);
    } else if ((node.type === 'html' || node.type === 'raw') && node.value) {
      node.value = node.value.replace(
        /\b(href|src)="(\/[^"]*)"/g,
        (/** @type {string} */ _m, /** @type {string} */ attr, /** @type {string} */ url) =>
          `${attr}="${rewrite(url)}"`,
      );
    }
    if (node.children) node.children.forEach(walk);
  };
  /** @param {any} tree */
  return (tree) => walk(tree);
}

// https://astro.build/config
//
// Deployment notes:
// - Fully static site (`output: 'static'` is implicit) — works on GitHub Pages
//   and Cloudflare Pages with no adapter.
// - `site` + `base` are set for GitHub Pages under the project subpath
//   (https://jfmcquade.github.io/textbooks-website). All internal links respect
//   `base`: `.astro` files via `import.meta.env.BASE_URL`, markdown pages via the
//   `remarkBaseLinks` plugin above.
// - To deploy at a domain root instead (Cloudflare Pages, a custom domain, or a
//   user/organisation GitHub page), set `base` to '/' and update `site`.
export default defineConfig({
  site: 'https://jfmcquade.github.io',
  base,

  markdown: {
    remarkPlugins: [remarkBaseLinks],
  },

  // MDX powers component-driven content pages (e.g. Product): authors write
  // markdown prose and drop in design-system components (Section, Card, …).
  // It extends the markdown config above by default, so `remarkBaseLinks`
  // applies to `.mdx` prose links too. Plain `.md` pages are unaffected.
  integrations: [mdx()],
});
