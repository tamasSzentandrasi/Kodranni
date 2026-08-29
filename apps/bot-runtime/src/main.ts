/**
 * Kodranni bot-runtime — gateway hatch only.
 * Default Discord is HTTP inside campaign-ui (`kodranni live --bot`).
 * Set KODRANNI_DISCORD_GATEWAY=1 to run this process.
 */
import { startBotRuntime } from './runtime.js';

try {
  const handle = await startBotRuntime();
  const shutdown = () => {
    void handle.stop().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
