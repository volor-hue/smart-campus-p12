/**
 * Shared types for the optional "Explain availability" feature.
 *
 * Trust boundary: the deterministic checker (src/utils/canBook.ts) decides
 * availability. Everything in src/llm only *explains* an already-made decision.
 */

export const REASON_CODES = [
  'AVAILABLE',
  'OVERLAP',
  'ROOM_BLOCKED',
  'INVALID_TIME',
  'PAST_TIME',
  'DURATION_TOO_LONG',
  'INVALID_INPUT',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

/** Structured, deterministic result — the only facts the explainer may use. */
export interface AvailabilityResult {
  roomLabel: string;
  /** minutes after midnight */
  start: number;
  /** minutes after midnight */
  end: number;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

/** Exact output contract expected from any (mock or real) LLM adapter. */
export interface ExplanationOutput {
  explanation: string;
}

export type MockMode = 'normal' | 'slow' | 'error' | 'no-key' | 'contradict';

/** Minimal payload sent to an adapter: system instruction + user prompt only. */
export interface PromptPayload {
  system: string;
  user: string;
}

export interface ExplanationAdapter {
  /** Human-readable name shown in the UI (e.g. "Mock adapter"). */
  readonly name: string;
  /** Returns untrusted raw output; callers must validate it. */
  explain(payload: PromptPayload, result: AvailabilityResult): Promise<unknown>;
}

export type FallbackReason =
  | 'timeout'
  | 'adapter_error'
  | 'missing_key'
  | 'invalid_output';

export type ExplainOutcome =
  | { kind: 'rejected'; error: string }
  | { kind: 'explanation'; source: 'model'; adapterName: string; explanation: string }
  | {
      kind: 'explanation';
      source: 'fallback';
      adapterName: string;
      explanation: string;
      fallbackReason: FallbackReason;
      detail: string;
    };
