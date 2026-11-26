import { ROOM_NAME } from '@/data/fixtures';
import { minutesToHHMM } from './time';
import { validateRequest, type Booking, type ReasonCode } from './validation';

export interface ContractResult {
  available: boolean;
  reasonCode: ReasonCode;
  message: string;
}

/**
 * Pure deterministic availability engine.
 * Validation first (AC1, AC2, AC6), then blocked room (AC4), then overlap (AC3).
 * Never mutates existingBookings (AC5). Touching an endpoint is not an overlap.
 */
export function checkAvailability(input: {
  startTime: string | number;
  duration: string | number;
  isBlocked: boolean;
  existingBookings: Booking[];
  now: string | number;
}): ContractResult {
  const validated = validateRequest({
    startTime: input.startTime,
    duration: input.duration,
    now: input.now,
  });

  if (!validated.ok) {
    return {
      available: false,
      reasonCode: validated.reasonCode,
      message: validated.message,
    };
  }

  if (input.isBlocked) {
    return {
      available: false,
      reasonCode: 'blocked',
      message: `${ROOM_NAME} is blocked and unavailable for any booking.`,
    };
  }

  for (const booking of input.existingBookings) {
    if (validated.start < booking.end && booking.start < validated.end) {
      return {
        available: false,
        reasonCode: 'overlap',
        message:
          `Requested interval ${minutesToHHMM(validated.start)}–${minutesToHHMM(validated.end)} ` +
          `overlaps an existing booking ${minutesToHHMM(booking.start)}–${minutesToHHMM(booking.end)}.`,
      };
    }
  }

  return {
    available: true,
    reasonCode: 'available',
    message:
      `${ROOM_NAME} is available from ${minutesToHHMM(validated.start)} to ${minutesToHHMM(validated.end)} ` +
      `(${validated.duration} min).`,
  };
}

export type { Booking, ReasonCode };
