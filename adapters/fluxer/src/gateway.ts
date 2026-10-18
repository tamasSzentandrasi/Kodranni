/**
 * Thin Fluxer gateway. Identify has no intent mask. Tests pass a fake socket.
 * Nothing here dials unless start() is called with that socket constructor.
 */

export const FLUXER_GATEWAY_URL = 'wss://gateway.fluxer.app/?v=1&encoding=json';

export interface FluxerDispatch {
  t: string;
  d: unknown;
  s: number | null;
}

export interface FluxerSocket {
  send(data: string): void;
  close(): void;
  addEventListener(
    type: 'open' | 'message' | 'close' | 'error',
    fn: (ev: { data?: unknown; code?: number }) => void,
  ): void;
}

export interface FluxerGateway {
  start(): Promise<void>;
  stop(): void;
  onDispatch(handler: (event: FluxerDispatch) => void): void;
}

function payloadText(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data);
  return '';
}

/** The gateway token is the raw secret. An HTTP "Bot " prefix is not part of it. */
export function fluxerGatewayToken(value: string): string {
  return value.trim().replace(/^Bot\s+/i, '');
}

export function createFluxerGateway(opts: {
  token: string;
  url?: string;
  /** Saved guild. Identify marks that guild active from the start. */
  guildId?: string;
  WebSocket: new (url: string) => FluxerSocket;
}): FluxerGateway {
  const token = fluxerGatewayToken(opts.token);
  const guildId = opts.guildId?.trim() ?? '';
  const url = opts.url ?? FLUXER_GATEWAY_URL;
  let stopped = false;
  let ready = false;
  let seq: number | null = null;
  let socket: FluxerSocket | undefined;
  let heart: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let dispatch: ((event: FluxerDispatch) => void) | undefined;
  let failStart: ((err: Error) => void) | undefined;
  let finishStart: (() => void) | undefined;
  let giveUp: ReturnType<typeof setTimeout> | undefined;

  function clearHeart(): void {
    if (heart) clearInterval(heart);
    heart = undefined;
  }

  function send(body: unknown): void {
    socket?.send(JSON.stringify(body));
  }

  function identify(): void {
    send({
      op: 2,
      d: {
        token,
        properties: { os: 'linux', browser: 'kodranni', device: 'kodranni' },
        ...(guildId ? { initial_guild_id: guildId } : {}),
      },
    });
  }

  function open(): void {
    if (stopped) return;
    clearHeart();
    const current = new opts.WebSocket(url);
    socket = current;
    const mine = () => socket === current;
    current.addEventListener('message', (ev) => {
      if (!mine()) return;
      let packet: { op?: unknown; d?: unknown; s?: unknown; t?: unknown };
      try {
        packet = JSON.parse(payloadText(ev.data)) as typeof packet;
      } catch {
        return;
      }
      const op = packet.op;
      if (op === 10) {
        const hello = packet.d as { heartbeat_interval?: unknown } | null;
        const interval = Number(hello?.heartbeat_interval);
        const every = Number.isFinite(interval) && interval >= 1000 ? interval : 41_250;
        clearHeart();
        heart = setInterval(() => send({ op: 1, d: seq }), every);
        heart.unref?.();
        identify();
        return;
      }
      if (op === 11) return;
      if (op === 1) {
        send({ op: 1, d: seq });
        return;
      }
      if (op === 9) {
        identify();
        return;
      }
      if (op === 7) {
        current.close();
        return;
      }
      if (op !== 0) return;
      if (typeof packet.s === 'number') seq = packet.s;
      const name = typeof packet.t === 'string' ? packet.t : '';
      if (name === 'READY' && !ready) {
        ready = true;
        attempts = 0;
        if (giveUp) clearTimeout(giveUp);
        giveUp = undefined;
        finishStart?.();
        finishStart = undefined;
        failStart = undefined;
      }
      if (name) dispatch?.({ t: name, d: packet.d, s: seq });
    });
    current.addEventListener('close', () => {
      if (!mine()) return;
      clearHeart();
      socket = undefined;
      if (stopped) return;
      if (!ready) {
        if (giveUp) clearTimeout(giveUp);
        giveUp = undefined;
        failStart?.(new Error('fluxer gateway closed'));
        failStart = undefined;
        finishStart = undefined;
        return;
      }
      attempts += 1;
      if (attempts > 5) return;
      retry = setTimeout(() => open(), Math.min(15_000, 1000 * attempts));
      retry.unref?.();
    });
    current.addEventListener('error', () => {
      if (!mine() || ready) return;
      failStart?.(new Error('fluxer gateway failed'));
      failStart = undefined;
      finishStart = undefined;
    });
  }

  return {
    onDispatch(handler) {
      dispatch = handler;
    },
    start() {
      if (!token) return Promise.reject(new Error('fluxer token is missing'));
      if (ready) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        finishStart = resolve;
        failStart = reject;
        giveUp = setTimeout(() => {
          if (ready) return;
          failStart?.(new Error('fluxer gateway did not become ready'));
          failStart = undefined;
          finishStart = undefined;
          socket?.close();
        }, 15_000);
        giveUp.unref?.();
        open();
      });
    },
    stop() {
      stopped = true;
      ready = false;
      clearHeart();
      if (giveUp) clearTimeout(giveUp);
      giveUp = undefined;
      if (retry) clearTimeout(retry);
      retry = undefined;
      failStart?.(new Error('fluxer gateway closed'));
      failStart = undefined;
      finishStart = undefined;
      const current = socket;
      socket = undefined;
      current?.close();
    },
  };
}
