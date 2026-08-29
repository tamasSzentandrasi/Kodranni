/**
 * HTTP Discord runtime in this process so BotContext (roll confirms) stays with sqlite.
 */
import { startBotRuntime, type BotHandle } from '@kodranni/bot-runtime';

let handle: BotHandle | undefined;
let starting: Promise<BotHandle | null> | undefined;

export function discordHttpEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KODRANNI_DISCORD_HTTP === '1' || env.KODRANNI_DISCORD_GATEWAY === '1';
}

function armShutdown(h: BotHandle): void {
  const stop = () => {
    void h.stop();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

export async function ensureDiscordRuntime(): Promise<BotHandle | null> {
  if (handle) return handle;
  if (!discordHttpEnabled()) return null;
  if (!starting) {
    starting = startBotRuntime()
      .then((h) => {
        handle = h;
        armShutdown(h);
        return h;
      })
      .catch((e) => {
        console.error(`discord runtime: ${e instanceof Error ? e.message : e}`);
        starting = undefined;
        return null;
      });
  }
  return starting;
}

export async function receiveDiscordInteraction(raw: unknown): Promise<void> {
  const h = await ensureDiscordRuntime();
  if (!h) throw new Error('discord runtime is not running');
  await h.receiveInteraction(raw);
}
