import { minutesToHHMM } from '@/utils/time';
import { REASON_CODES, type AvailabilityResult } from './types';

export const MAX_QUESTION_LENGTH = 300;
export const MAX_EXPLANATION_LENGTH = 240;
export const MAX_SENTENCES = 2;

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Validates the explain request before anything is sent to an adapter.
 * - the structured result must be well-formed and internally consistent
 * - the optional student question must be <= 300 chars and contain no control characters
 */
export function validateExplainInput(
  result: unknown,
  question: string
): Validation<{ result: AvailabilityResult; question: string }> {
  if (typeof result !== 'object' || result === null) {
    return { ok: false, error: 'Run an availability check first.' };
  }
  const r = result as Partial<AvailabilityResult>;
  if (typeof r.roomLabel !== 'string' || r.roomLabel.trim() === '') {
    return { ok: false, error: 'Malformed result: missing room label.' };
  }
  if (!Number.isInteger(r.start) || !Number.isInteger(r.end)) {
    return { ok: false, error: 'Malformed result: start and end must be whole minutes.' };
  }
  if (typeof r.isAvailable !== 'boolean') {
    return { ok: false, error: 'Malformed result: isAvailable must be a boolean.' };
  }
  if (!REASON_CODES.includes(r.reasonCode as never)) {
    return { ok: false, error: 'Malformed result: unknown reason code.' };
  }
  if (r.isAvailable !== (r.reasonCode === 'AVAILABLE')) {
    return { ok: false, error: 'Malformed result: status and reason code disagree.' };
  }

  const q = question.trim();
  if (q.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Question is too long (${q.length} characters, max ${MAX_QUESTION_LENGTH}).`,
    };
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(q)) {
    return { ok: false, error: 'Question contains unsupported control characters.' };
  }
  return { ok: true, value: { result: r as AvailabilityResult, question: q } };
}

/**
 * Status *claims* (not single keywords): "not blocked" or "no booking overlaps" are not
 * claims of unavailability, and negated phrases are removed before looking for an
 * "available" claim (review finding F1/F2).
 */
const NEGATIVE_CLAIM =
  /\b(unavailable|not available|isn't available|not free|isn't free|cannot be (booked|used)|can't be (booked|used)|is (currently )?blocked|(it|time|slot|request|interval) overlaps|conflicts with)\b/gi;
const POSITIVE_CLAIM = /\b(is|are|it's|remains|still) (available|free|open)\b/i;
const CONFIRMATION =
  /\b(booking (is |has been )?confirmed|confirmed (your |the )?booking|(booked|reserved) for you)\b/i;

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

/**
 * Validates untrusted adapter output against the contract { explanation: string }
 * and against the deterministic result (AC2).
 */
export function validateExplanationOutput(
  raw: unknown,
  result: AvailabilityResult
): Validation<string> {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return { ok: false, error: 'Output is not valid JSON.' };
    }
  }
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Output is not an object.' };
  }
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).length !== 1 || typeof obj.explanation !== 'string') {
    return { ok: false, error: 'Output must be exactly { explanation: string }.' };
  }
  const text = obj.explanation.trim();
  if (text === '') return { ok: false, error: 'Explanation is empty.' };
  if (text.length > MAX_EXPLANATION_LENGTH) {
    return { ok: false, error: `Explanation is longer than ${MAX_EXPLANATION_LENGTH} characters.` };
  }
  if (countSentences(text) > MAX_SENTENCES) {
    return { ok: false, error: `Explanation has more than ${MAX_SENTENCES} sentences.` };
  }
  if (/<[^>]+>|https?:\/\//i.test(text)) {
    return { ok: false, error: 'Explanation contains markup or links.' };
  }

  // Factual agreement with the deterministic status.
  if (CONFIRMATION.test(text)) {
    return { ok: false, error: 'Explanation must not confirm a booking.' };
  }
  const hasNegativeClaim = new RegExp(NEGATIVE_CLAIM.source, 'i').test(text);
  if (result.isAvailable && hasNegativeClaim) {
    return { ok: false, error: 'Explanation contradicts the status (says unavailable).' };
  }
  // Remove negated phrases first, then any remaining "available" claim is a contradiction.
  if (!result.isAvailable && POSITIVE_CLAIM.test(text.replace(NEGATIVE_CLAIM, ' '))) {
    return { ok: false, error: 'Explanation contradicts the status (says available).' };
  }

  // No invented times: every HH:MM must be the requested start or end.
  const allowedTimes = new Set([minutesToHHMM(result.start), minutesToHHMM(result.end)]);
  for (const t of text.match(/\b\d{1,2}:\d{2}\b/g) ?? []) {
    if (!allowedTimes.has(t.padStart(5, '0'))) {
      return { ok: false, error: `Explanation mentions a time not in the facts (${t}).` };
    }
  }
  // No invented rooms.
  for (const room of text.match(/\broom\s+\w*\d\w*/gi) ?? []) {
    if (room.toLowerCase() !== result.roomLabel.toLowerCase()) {
      return { ok: false, error: `Explanation mentions a room not in the facts (${room}).` };
    }
  }
  return { ok: true, value: text };
}
