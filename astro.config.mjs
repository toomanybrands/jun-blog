// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  // 배포 후 실제 도메인으로 바꾸세요 (예: https://jun-blog.vercel.app)
  site: 'https://jun-blog.vercel.app',
  integrations: [pagefind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});