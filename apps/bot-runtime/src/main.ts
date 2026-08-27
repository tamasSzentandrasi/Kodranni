/**
 * Kodranni bot-runtime — session chat loop (Discord first).
 * Prefer `kodranni session start --bot` so the kernel owns this in-process.
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
