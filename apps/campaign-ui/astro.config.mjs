import { defineConfig } from 'astro/config';

// Live session UI — no Project Pages base; tunnel hits this process directly.
// Archive export can set base later per campaign.
export default defineConfig({
  output: 'static',
  server: {
    port: 8742,
    host: true,
  },
  vite: {
    server: {
      watch: {
        ignored: ['**/data/**'],
      },
    },
  },
});
