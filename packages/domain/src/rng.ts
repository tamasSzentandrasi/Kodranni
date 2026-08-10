/** Cryptographically strong RNG returning [0, 1). */
export type Rng = () => number;

export function cryptoRng(): Rng {
  return () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    // 2^32 → [0, 1)
    return buf[0] / 0x1_0000_0000;
  };
}

/** Deterministic RNG for tests (mulberry32). */
export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDie(sides: number, rng: Rng): number {
  if (sides < 2) throw new Error(`invalid die sides: ${sides}`);
  return Math.floor(rng() * sides) + 1;
}

export function rollDice(count: number, sides: number, rng: Rng): number[] {
  if (count < 1) throw new Error(`pool must be at least 1, got ${count}`);
  const faces: number[] = [];
  for (let i = 0; i < count; i++) faces.push(rollDie(sides, rng));
  return faces;
}
