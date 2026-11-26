import { canBook, rejectionReason, type Booking, type RejectionReason } from '@/utils/canBook';
import type { AvailabilityResult, ReasonCode } from './types';

/**
 * Maps the existing structured rejection reason onto a public reason code.
 * The checker already distinguishes blocked rooms and past start times, so no
 * change to canBook.ts is required (Practice #11 AC1).
 */
export function toReasonCode(reason: RejectionReason | null): ReasonCode {
  if (reason === null) return 'AVAILABLE';
  switch (reason.kind) {
    case 'blocked':
      return 'ROOM_BLOCKED';
    case 'not_integer':
      return 'INVALID_INPUT';
    case 'invalid_range':
      return 'INVALID_TIME';
    case 'past_start':
      return 'PAST_TIME';
    case 'too_long':
      return 'DURATION_TOO_LONG';
    case 'overlap':
      return 'OVERLAP';
  }
}

/**
 * Thin wrapper around the deterministic checker. `isAvailable` comes from
 * canBook (unchanged); the reason code is derived from rejectionReason.
 */
export function evaluateAvailability(
  roomLabel: string,
  start: number,
  end: number,
  now: number,
  blocked: boolean,
  existing: Booking[]
): AvailabilityResult {
  const isAvailable = canBook(start, end, now, blocked, existing);
  const reasonCode = toReasonCode(rejectionReason(start, end, now, blocked, existing));
  return { roomLabel, start, end, isAvailable, reasonCode };
}
