/** Max Exertion = Resolve + Constitution + Charisma. */
export function exertionMax(resolve: number, constitution: number, charisma: number): number {
  return resolve + constitution + charisma;
}

/** Echo capacity = max(Strength, Dexterity) + Intellect + Authority. */
export function echoCapacity(
  strength: number,
  dexterity: number,
  intellect: number,
  authority: number,
): number {
  return Math.max(strength, dexterity) + intellect + authority;
}

export function totalEchoWeight(weights: readonly number[]): number {
  return weights.reduce((a, b) => a + b, 0);
}

export function isDecadent(echoCount: number): boolean {
  return echoCount === 0;
}

export function isOverCapacity(totalWeight: number, capacity: number): boolean {
  return totalWeight > capacity;
}
