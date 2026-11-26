import { fallbackExplanation } from './fallback';
import { MissingKeyError, TimeoutError } from './errors';
import { DEFAULT_PROMPT_VARIANT, PROMPT_VARIANTS, type PromptVariantId } from './prompts';
import { validateExplainInput, validateExplanationOutput } from './validation';
import type { ExplainOutcome, ExplanationAdapter, FallbackReason } from './types';

export const DEFAULT_TIMEOUT_MS = 2500;

export interface ExplainOptions {
  adapter: ExplanationAdapter;
  timeoutMs?: number;
  variant?: PromptVariantId;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new TimeoutError(ms)), ms)),
  ]);
}

/**
 * Orchestrates: input validation -> prompt -> adapter (with timeout) ->
 * output validation -> explanation, or a deterministic fallback.
 * It never changes the availability decision: `result` is only read.
 */
export async function explainAvailability(
  result: unknown,
  question: string,
  { adapter, timeoutMs = DEFAULT_TIMEOUT_MS, variant = DEFAULT_PROMPT_VARIANT }: ExplainOptions
): Promise<ExplainOutcome> {
  const input = validateExplainInput(result, question);
  if (!input.ok) return { kind: 'rejected', error: input.error };

  const { result: r, question: q } = input.value;
  const payload = PROMPT_VARIANTS[variant](r, q);

  const fallback = (fallbackReason: FallbackReason, detail: string): ExplainOutcome => ({
    kind: 'explanation',
    source: 'fallback',
    adapterName: adapter.name,
    explanation: fallbackExplanation(r),
    fallbackReason,
    detail,
  });

  let raw: unknown;
  try {
    raw = await withTimeout(adapter.explain(payload, r), timeoutMs);
  } catch (err) {
    if (err instanceof TimeoutError) return fallback('timeout', err.message);
    if (err instanceof MissingKeyError) return fallback('missing_key', err.message);
    return fallback('adapter_error', err instanceof Error ? err.message : String(err));
  }

  const out = validateExplanationOutput(raw, r);
  if (!out.ok) return fallback('invalid_output', out.error);

  return { kind: 'explanation', source: 'model', adapterName: adapter.name, explanation: out.value };
}
