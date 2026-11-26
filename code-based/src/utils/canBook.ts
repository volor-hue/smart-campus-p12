export interface Booking {
  start: number;
  end: number;
}

export type RejectionReason =
  | { kind: 'blocked' }
  | { kind: 'not_integer' }
  | { kind: 'invalid_range' }
  | { kind: 'past_start' }
  | { kind: 'too_long' }
  | { kind: 'overlap'; booking: Booking };

/**
 * Evaluates all booking rules and returns a structured rejection reason,
 * or null when the room is available. This is the single source of truth
 * for the rules; canBook delegates to it.
 *
 * AC1: 0 <= start < end <= 1440, start strictly after now, integer minutes
 * AC2: duration (end - start) must not exceed 120 minutes
 * AC3: reject every request when the room is blocked
 * AC4: reject overlap with any existing booking; touching endpoints do NOT overlap
 */
export function rejectionReason(
  start: number,
  end: number,
  now: number,
  blocked: boolean,
  existing: Booking[]
): RejectionReason | null {
  if (blocked) return { kind: 'blocked' };
  if (!Number.isInteger(start) || !Number.isInteger(end)) return { kind: 'not_integer' };
  if (start < 0 || end > 1440 || start >= end) return { kind: 'invalid_range' };
  if (start <= now) return { kind: 'past_start' };
  if (end - start > 120) return { kind: 'too_long' };
  for (const booking of existing) {
    if (start < booking.end && booking.start < end) return { kind: 'overlap', booking };
  }
  return null;
}

/**
 * Pure decision function — returns true if available, false otherwise.
 * Delegates to rejectionReason so the rules live in one place.
 * Never mutates `existing`.
 */
export function canBook(
  start: number,
  end: number,
  now: number,
  blocked: boolean,
  existing: Booking[]
): boolean {
  return rejectionReason(start, end, now, blocked, existing) === null;
}
