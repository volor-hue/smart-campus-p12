import { minutesToHHMM } from './time';

export type ReasonCode =
  | 'available'
  | 'overlap'
  | 'blocked'
  | 'invalid_duration'
  | 'duration_too_long'
  | 'past_start'
  | 'invalid_start'
  | 'invalid_now'
  | 'invalid_range';

export interface Booking {
  start: number;
  end: number;
}

export interface ValidatedRequest {
  ok: true;
  start: number;
  end: number;
  duration: number;
  now: number;
}

export interface ValidationFailure {
  ok: false;
  available: false;
  reasonCode: ReasonCode;
  message: string;
}

export type ValidationResult = ValidatedRequest | ValidationFailure;

/**
 * Accepts HH:MM (24-hour, including 24:00) or an integer number of minutes
 * from midnight (0–1440).
 */
export function parseClock(
  value: string | number,
  fieldName: string
): { ok: true; minutes: number } | { ok: false; message: string } {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return { ok: false, message: `${fieldName} must be an integer number of minutes or HH:MM.` };
    }
    if (value < 0 || value > 1440) {
      return { ok: false, message: `${fieldName} must be between 00:00 and 24:00 (0–1440 minutes).` };
    }
    return { ok: true, minutes: value };
  }

  const raw = String(value).trim();
  if (raw === '') {
    return { ok: false, message: `Please enter a value for ${fieldName}.` };
  }

  if (raw === '24:00') {
    return { ok: true, minutes: 1440 };
  }

  const hm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw);
  if (hm) {
    return { ok: true, minutes: Number.parseInt(hm[1], 10) * 60 + Number.parseInt(hm[2], 10) };
  }

  if (/^-?\d+$/.test(raw)) {
    const minutes = Number.parseInt(raw, 10);
    if (minutes < 0 || minutes > 1440) {
      return { ok: false, message: `${fieldName} must be between 00:00 and 24:00 (0–1440 minutes).` };
    }
    return { ok: true, minutes };
  }

  return {
    ok: false,
    message: `${fieldName} must be HH:MM or an integer number of minutes from midnight.`,
  };
}

export function parseDuration(
  value: string | number
): { ok: true; duration: number } | { ok: false; reasonCode: 'invalid_duration' | 'duration_too_long'; message: string } {
  let duration: number;
  if (typeof value === 'number') {
    duration = value;
  } else {
    const raw = String(value).trim();
    if (raw === '') {
      return { ok: false, reasonCode: 'invalid_duration', message: 'Please enter a duration in minutes.' };
    }
    if (!/^-?\d+$/.test(raw)) {
      return { ok: false, reasonCode: 'invalid_duration', message: 'Duration must be a whole number of minutes.' };
    }
    duration = Number.parseInt(raw, 10);
  }

  if (!Number.isFinite(duration) || !Number.isInteger(duration)) {
    return { ok: false, reasonCode: 'invalid_duration', message: 'Duration must be a whole number of minutes.' };
  }
  if (duration <= 0) {
    return { ok: false, reasonCode: 'invalid_duration', message: 'Duration must be greater than 0 minutes.' };
  }
  if (duration > 120) {
    return {
      ok: false,
      reasonCode: 'duration_too_long',
      message: `Duration must be at most 120 minutes (requested ${duration}).`,
    };
  }
  return { ok: true, duration };
}

/**
 * Validates start time, duration and reference time (AC1, AC2, AC6).
 * Blocked-room and overlap rules are applied later by the availability engine.
 */
export function validateRequest(input: {
  startTime: string | number;
  duration: string | number;
  now: string | number;
}): ValidationResult {
  const nowParsed = parseClock(input.now, 'Reference current time');
  if (!nowParsed.ok) {
    return { ok: false, available: false, reasonCode: 'invalid_now', message: nowParsed.message };
  }
  if (nowParsed.minutes >= 1440) {
    return {
      ok: false,
      available: false,
      reasonCode: 'invalid_now',
      message: 'Reference current time must be between 00:00 and 23:59.',
    };
  }

  const startParsed = parseClock(input.startTime, 'Start time');
  if (!startParsed.ok) {
    return { ok: false, available: false, reasonCode: 'invalid_start', message: startParsed.message };
  }

  const durationParsed = parseDuration(input.duration);
  if (!durationParsed.ok) {
    return {
      ok: false,
      available: false,
      reasonCode: durationParsed.reasonCode,
      message: durationParsed.message,
    };
  }

  const start = startParsed.minutes;
  const duration = durationParsed.duration;
  const end = start + duration;
  if (end > 1440) {
    return {
      ok: false,
      available: false,
      reasonCode: 'invalid_range',
      message: `Start time ${minutesToHHMM(start)} plus duration ${duration} minutes extends past 24:00.`,
    };
  }

  if (start <= nowParsed.minutes) {
    return {
      ok: false,
      available: false,
      reasonCode: 'past_start',
      message: `Start time ${minutesToHHMM(start)} must be after the current time ${minutesToHHMM(nowParsed.minutes)}.`,
    };
  }

  return { ok: true, start, end, duration, now: nowParsed.minutes };
}
