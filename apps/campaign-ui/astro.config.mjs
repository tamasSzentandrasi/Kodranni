import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Live session UI: SSR against local SQLite SoT (tunnel hits this process).
// Archive still uses export-json + static rebuild when desired.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Tunnel rewrites Host to localhost; browser Origin is the public hostname.
  // Player POSTs are JSON + sheet HMAC / foundingOriginOk — not cookie forms.
  security: { checkOrigin: false },
  server: {
    port: 8742,
    host: '127.0.0.1',
  },
  vite: {
    ssr: {
      external: [
        'node:sqlite',
        '@kodranni/bot-runtime',
        '@kodranni/adapter-discord',
        'discord.js',
      ],
    },
    server: {
      // Cloudflare quick tunnels (*.trycloudflare.com) and LAN access hit this host.
      // Live UI is ST-started only — allow tunnel hostnames so mid-session share works.
      allowedHosts: true,
      watch: {
        ignored: ['**/data/**'],
      },
    },
  },
});
