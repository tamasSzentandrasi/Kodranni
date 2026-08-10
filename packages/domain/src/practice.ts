/**
 * Practice rules (Skills chapter).
 * - Primitive → no Practice (caller must not invoke Skill practice).
 * - Marks Practice only when Exertion was spent (with stated exceptions).
 */

export type PracticeRollKind = 'unopposed' | 'opposed';

export interface PracticeInput {
  kind: PracticeRollKind;
  /** True if a Skill was used (not Primitive). */
  usedSkill: boolean;
  /** Exertion dice spent on the roll (>0). */
  exertionSpent: boolean;
  marks: number;
  failures: number;
  /** Opposed only: marks − opponent marks. */
  margin?: number;
  /** Opposed only: did this character lose (margin < 0)? */
  lostOpposed?: boolean;
}

export interface PracticeResult {
  gained: number;
  reasons: string[];
}

export function practiceGain(input: PracticeInput): PracticeResult {
  if (!input.usedSkill) {
    return { gained: 0, reasons: ['primitive_or_no_skill'] };
  }

  let gained = 0;
  const reasons: string[] = [];

  if (input.kind === 'opposed') {
    const margin = input.margin ?? 0;
    if (margin === 0) {
      // No automatic margin Practice; fiction/ST may award separately.
      reasons.push('margin_zero_no_auto');
    } else if (input.exertionSpent && margin > 0) {
      gained += margin;
      reasons.push('opposed_margin_with_exertion');
    }
    if (input.lostOpposed) {
      gained += 2;
      reasons.push('opposed_loss_plus_2');
    }
    return { gained, reasons };
  }

  // Unopposed
  if (input.failures > input.marks) {
    gained += 2;
    reasons.push('unopposed_more_failures_plus_2');
  }
  if (input.exertionSpent) {
    const fromMarks = Math.floor(input.marks / 2);
    if (fromMarks > 0) {
      gained += fromMarks;
      reasons.push('unopposed_marks_half_floor');
    }
  }

  return { gained, reasons };
}

/** Base Practice thresholds before Foundation modifier. */
export function basePracticeThreshold(currentSkill: 0 | 1 | 2): number {
  switch (currentSkill) {
    case 0:
      return 24;
    case 1:
      return 48;
    case 2:
      return 72;
  }
}

/** Foundation 3 halves, 1 doubles, 2 base. */
export function practiceThreshold(currentSkill: 0 | 1 | 2, rulingFoundation: number): number {
  const base = basePracticeThreshold(currentSkill);
  if (rulingFoundation >= 3) return Math.floor(base / 2);
  if (rulingFoundation <= 1) return base * 2;
  return base;
}
