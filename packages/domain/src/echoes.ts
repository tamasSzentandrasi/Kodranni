/** Echo capacity = max Exertion = Resolve + Constitution + Charisma. */
export function echoCapacity(resolve: number, constitution: number, charisma: number): number {
  return resolve + constitution + charisma;
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
