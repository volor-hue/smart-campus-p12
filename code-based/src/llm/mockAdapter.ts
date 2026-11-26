import { minutesToHHMM } from '@/utils/time';
import { AdapterError, MissingKeyError } from './errors';
import type { AvailabilityResult, ExplanationAdapter, MockMode, PromptPayload } from './types';

/**
 * MOCK LLM ADAPTER — no network, no API key, no real model.
 * It builds a short explanation from the structured result only, so it can be
 * used in class for free. Modes simulate real-world failures:
 *   normal      -> valid JSON explanation after a short delay
 *   slow        -> answers after `slowDelayMs` (longer than the explain timeout)
 *   error       -> rejects like an HTTP 500 from a provider
 *   no-key      -> rejects with MissingKeyError (server has no key configured)
 *   contradict  -> returns text that contradicts the status (simulates a model
 *                  that obeyed an injected instruction); must be rejected by
 *                  output validation
 */
export interface MockAdapterOptions {
  mode?: MockMode;
  delayMs?: number;
  slowDelayMs?: number;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function mockSentence(r: AvailabilityResult): string {
  const span = `from ${minutesToHHMM(r.start)} to ${minutesToHHMM(r.end)}`;
  switch (r.reasonCode) {
    case 'AVAILABLE':
      return `Good news: ${r.roomLabel} is available ${span}, and no rule rejected your request. You can go ahead and plan to use it.`;
    case 'OVERLAP':
      return `${r.roomLabel} is not available ${span} because that time overlaps an existing booking. Please try a slot that starts after the booking ends or ends before it starts.`;
    case 'ROOM_BLOCKED':
      return `${r.roomLabel} is not available ${span} because the room is currently blocked. Please try again when it is unblocked.`;
    case 'PAST_TIME':
      return `${r.roomLabel} is not available ${span} because the start time is not after the current time. Please choose a later start time.`;
    case 'DURATION_TOO_LONG':
      return `${r.roomLabel} is not available ${span} because requests may last at most 120 minutes. Please choose a shorter slot.`;
    case 'INVALID_TIME':
      return `${r.roomLabel} is not available ${span} because the time range is invalid. Please check the start and end times.`;
    case 'INVALID_INPUT':
      return `${r.roomLabel} cannot be checked because the input is invalid. Please enter whole minutes.`;
  }
}

export function createMockAdapter(options: MockAdapterOptions = {}): ExplanationAdapter {
  const { mode = 'normal', delayMs = 300, slowDelayMs = 5000 } = options;
  return {
    name: `Mock adapter (${mode})`,
    async explain(_payload: PromptPayload, result: AvailabilityResult): Promise<unknown> {
      switch (mode) {
        case 'no-key':
          await delay(Math.min(delayMs, 50));
          throw new MissingKeyError();
        case 'error':
          await delay(delayMs);
          throw new AdapterError('Simulated provider failure (HTTP 500).');
        case 'slow':
          await delay(slowDelayMs);
          return JSON.stringify({ explanation: mockSentence(result) });
        case 'contradict':
          await delay(delayMs);
          return JSON.stringify({
            explanation: result.isAvailable
              ? `${result.roomLabel} is unavailable and blocked for everyone.`
              : `Booking confirmed: ${result.roomLabel} is available for you.`,
          });
        case 'normal':
        default:
          await delay(delayMs);
          return JSON.stringify({ explanation: mockSentence(result) });
      }
    },
  };
}
