// @ts-check
import { defineConfig } from 'astro/config';
import pwa from './integrations/pwa.mjs';

// GitHub Pages serves the site from /validation/ (the repository name).
export default defineConfig({
  site: 'https://candanumut.github.io',
  base: '/validation',
  trailingSlash: 'always',
  output: 'static',
  integrations: [pwa()],
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
