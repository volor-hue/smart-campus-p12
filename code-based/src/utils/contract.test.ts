import { describe, expect, it } from 'vitest';
import { checkAvailability } from './availability';
import type { Booking } from './validation';

const NOW = '09:00';
const BOOKINGS: Booking[] = [{ start: 600, end: 660 }];

function run(
  startTime: string | number,
  duration: string | number,
  isBlocked = false,
  existingBookings: Booking[] = BOOKINGS,
  now: string | number = NOW
) {
  return checkAvailability({ startTime, duration, isBlocked, existingBookings, now });
}

describe('P12 shared contract T1–T8 (defined before implementation)', () => {
  it('T1: valid free interval 11:30–12:30 -> Available (available)', () => {
    const result = run('11:30', 60, false);
    expect(result).toEqual({
      available: true,
      reasonCode: 'available',
      message: 'Room 101 is available from 11:30 to 12:30 (60 min).',
    });
    // The same case also accepts integer minutes from midnight.
    expect(run(690, 60).reasonCode).toBe('available');
  });

  it('T2: overlap with 10:00–11:00 -> Unavailable (overlap)', () => {
    const result = run('10:30', 60, false);
    expect(result.available).toBe(false);
    expect(result.reasonCode).toBe('overlap');
    expect(result.message).toBe(
      'Requested interval 10:30–11:30 overlaps an existing booking 10:00–11:00.'
    );
  });

  it('T3: blocked room -> Unavailable (blocked)', () => {
    const result = run('11:30', 60, true);
    expect(result.available).toBe(false);
    expect(result.reasonCode).toBe('blocked');
    expect(result.message).toBe('Room 101 is blocked and unavailable for any booking.');
  });

  it('T4: duration = 0 -> Validation error (invalid_duration)', () => {
    const result = run('11:30', 0, false);
    expect(result.available).toBe(false);
    expect(result.reasonCode).toBe('invalid_duration');
    expect(result.message).toBe('Duration must be greater than 0 minutes.');
  });

  it('T5: duration = 121 -> Validation error (duration_too_long)', () => {
    const result = run('11:30', 121, false);
    expect(result.available).toBe(false);
    expect(result.reasonCode).toBe('duration_too_long');
    expect(result.message).toBe('Duration must be at most 120 minutes (requested 121).');
  });

  it('T6: past start 08:30 with now=09:00 -> Validation error (past_start)', () => {
    const result = run('08:30', 60, false, BOOKINGS, '09:00');
    expect(result.available).toBe(false);
    expect(result.reasonCode).toBe('past_start');
    expect(result.message).toBe('Start time 08:30 must be after the current time 09:00.');
  });

  it('T7: adjacent non-overlapping interval 11:00–12:00 -> Available (available)', () => {
    const result = run('11:00', 60, false);
    expect(result).toEqual({
      available: true,
      reasonCode: 'available',
      message: 'Room 101 is available from 11:00 to 12:00 (60 min).',
    });
  });

  it('T8: existingBookings is strictly unchanged after T1–T7', () => {
    const existingBookings: Booking[] = [{ start: 600, end: 660 }];
    const snapshot = structuredClone(existingBookings);
    Object.freeze(existingBookings);
    Object.freeze(existingBookings[0]);

    run('11:30', 60, false, existingBookings);
    run('10:30', 60, false, existingBookings);
    run('11:30', 60, true, existingBookings);
    run('11:30', 0, false, existingBookings);
    run('11:30', 121, false, existingBookings);
    run('08:30', 60, false, existingBookings, '09:00');
    run('11:00', 60, false, existingBookings);

    expect(existingBookings).toEqual(snapshot);
    expect(existingBookings).toEqual([{ start: 600, end: 660 }]);
  });
});
