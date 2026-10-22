import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Live session UI: SSR against local SQLite SoT (tunnel hits this process).
// Archive still uses export-json + static rebuild when desired.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Tunnel rewrites Host to loopback while the browser Origin is the public name.
  // Player posts rely on JSON and the sheet HMAC. kod_edit and kod_desk are
  // SameSite=Lax, so a cross-site form does not send them.
  security: { checkOrigin: false },
  server: {
    port: 8742,
    host: '127.0.0.1',
  },
  vite: {
    ssr: {
      // Workspace packages stay in the hall bundle. The kernel rebuilds when
      // those sources are newer than dist. node:sqlite, sharp, and discord.js
      // are the real externals.
      external: ['node:sqlite', 'sharp', 'discord.js'],
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
