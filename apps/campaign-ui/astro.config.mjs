import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Live session UI: SSR against local SQLite SoT (tunnel hits this process).
// Archive still uses export-json + static rebuild when desired.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    port: 8742,
    host: true,
  },
  vite: {
    ssr: {
      external: ['node:sqlite'],
    },
    server: {
      watch: {
        ignored: ['**/data/**'],
      },
    },
  },
});
