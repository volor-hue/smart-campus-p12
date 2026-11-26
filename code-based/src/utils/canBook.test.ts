import { describe, it, expect } from 'vitest';
import { canBook, type Booking } from './canBook';

const existing: Booking[] = [{ start: 600, end: 660 }];

describe('canBook', () => {
  it('returns false for NaN start', () => {
    expect(canBook(NaN, 700, 540, false, existing)).toBe(false);
  });

  it('returns false for NaN end', () => {
    expect(canBook(700, NaN, 540, false, existing)).toBe(false);
  });

  it('returns false for non-integer start (600.5)', () => {
    expect(canBook(600.5, 660, 540, false, [])).toBe(false);
  });

  it('returns true for a valid interval after the existing booking (control)', () => {
    expect(canBook(660, 720, 540, false, existing)).toBe(true);
  });

  it('returns false for an interval overlapping the existing booking (control)', () => {
    expect(canBook(630, 690, 540, false, existing)).toBe(false);
  });

  it('returns true for a duration of exactly 120 minutes', () => {
    expect(canBook(700, 820, 540, false, [])).toBe(true);
  });

  it('returns false for a duration of 121 minutes', () => {
    expect(canBook(700, 821, 540, false, [])).toBe(false);
  });

  it('returns false when the room is blocked, even for a valid interval', () => {
    expect(canBook(700, 760, 540, true, [])).toBe(false);
  });

  it('allows intervals that only touch an existing booking at either endpoint', () => {
    expect(canBook(660, 720, 540, false, existing)).toBe(true);
    expect(canBook(541, 600, 540, false, existing)).toBe(true);
  });

  it('returns true when end is exactly 1440 and the interval is otherwise valid', () => {
    expect(canBook(1320, 1440, 540, false, [])).toBe(true);
  });

  it('does not mutate the existing bookings array', () => {
    const bookings: Booking[] = [
      { start: 600, end: 660 },
      { start: 800, end: 860 },
    ];
    const snapshot = structuredClone(bookings);
    Object.freeze(bookings);
    Object.freeze(bookings[0]);
    Object.freeze(bookings[1]);
    expect(canBook(700, 760, 540, false, bookings)).toBe(true);
    expect(bookings).toEqual(snapshot);
  });
});
