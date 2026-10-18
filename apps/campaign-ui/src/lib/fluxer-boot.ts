/**
 * Fluxer gateway in this process so rolls stay on the hall's sqlite.
 * Go live on the Session tab is what starts it. Tests do not.
 */
import { startFluxerRuntime, type BotHandle } from '@kodranni/bot-runtime';

let handle: BotHandle | undefined;
let starting: Promise<BotHandle> | undefined;
let generation = 0;

function armShutdown(h: BotHandle): void {
  const stop = () => {
    void h.stop();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

export function fluxerRuntimeOn(): boolean {
  return Boolean(handle);
}

export async function ensureFluxerRuntime(): Promise<BotHandle> {
  if (handle) return handle;
  if (!starting) {
    const gen = generation;
    starting = startFluxerRuntime()
      .then((h) => {
        if (gen !== generation) {
          void h.stop();
          throw new Error('fluxer gateway closed');
        }
        handle = h;
        armShutdown(h);
        return h;
      })
      .catch((err) => {
        starting = undefined;
        throw err;
      });
  }
  return starting;
}

export async function stopFluxerRuntime(): Promise<void> {
  generation += 1;
  const current = handle;
  handle = undefined;
  starting = undefined;
  if (current) await current.stop();
}
