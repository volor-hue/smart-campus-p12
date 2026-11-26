import { minutesToHHMM } from '@/utils/time';
import type { AvailabilityResult } from './types';

/**
 * Deterministic, template-based explanation. Used when the adapter times out,
 * fails, has no key, or returns output that fails validation. It only uses
 * fields of the structured result, so it can never disagree with the checker.
 */
export function fallbackExplanation(r: AvailabilityResult): string {
  const span = `${minutesToHHMM(r.start)}–${minutesToHHMM(r.end)}`;
  switch (r.reasonCode) {
    case 'AVAILABLE':
      return `${r.roomLabel} is available for ${span} because no rule rejected the request.`;
    case 'OVERLAP':
      return `${r.roomLabel} is not available for ${span} because it overlaps an existing booking.`;
    case 'ROOM_BLOCKED':
      return `${r.roomLabel} is not available for ${span} because the room is currently blocked.`;
    case 'INVALID_TIME':
      return `${r.roomLabel} is not available for ${span} because the time range is invalid.`;
    case 'PAST_TIME':
      return `${r.roomLabel} is not available for ${span} because the start time is not after the current time.`;
    case 'DURATION_TOO_LONG':
      return `${r.roomLabel} is not available for ${span} because the request is longer than 120 minutes.`;
    case 'INVALID_INPUT':
      return `${r.roomLabel} is not available for ${span} because the input is invalid.`;
  }
}
