/** A face ≥ 5 is a Mark of Success. */
export function isMark(face: number): boolean {
  return face >= 5;
}

export function countMarks(faces: readonly number[]): number {
  let n = 0;
  for (const f of faces) if (isMark(f)) n += 1;
  return n;
}

export function countFailures(faces: readonly number[]): number {
  return faces.length - countMarks(faces);
}
