// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
//
// Deployment notes:
// - Fully static site (`output: 'static'` is implicit) — works on GitHub Pages
//   and Cloudflare Pages with no adapter.
// - `site` + `base` are set for GitHub Pages under the project subpath
//   (https://jfmcquade.github.io/textbooks-website). All internal links use
//   `import.meta.env.BASE_URL`, so they respect `base` automatically.
// - To deploy at a domain root instead (Cloudflare Pages, a custom domain, or a
//   user/organisation GitHub page), remove `base` and update `site`.
export default defineConfig({
  site: 'https://jfmcquade.github.io',
  base: '/textbooks-website',

  // No integrations needed: plain CSS + a tiny island of vanilla JS keeps the
  // JS footprint well under target. See README for the styling rationale.
});
