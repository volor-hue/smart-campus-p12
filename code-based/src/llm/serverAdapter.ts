import { AdapterError } from './errors';
import type { ExplanationAdapter, PromptPayload } from './types';

/**
 * SERVER-SIDE ADAPTER STUB — documented, NOT wired, NO key in the client.
 *
 * Intended deployment (not part of this practice): a serverless function
 *   POST /api/explain   body: { system, user }   (PromptPayload, no personal data)
 * The function reads LLM_API_KEY from the *server* environment, calls the
 * provider with a hard timeout and returns { explanation: string }.
 * The browser never sees the key; the client still validates the response
 * with validateExplanationOutput() and falls back on any failure.
 *
 * This stub is not used by the UI. Calling it without an endpoint fails
 * safely so the caller falls back to the deterministic explanation.
 */
export function createServerAdapter(endpoint?: string): ExplanationAdapter {
  return {
    name: 'Server adapter (stub)',
    async explain(payload: PromptPayload): Promise<unknown> {
      if (!endpoint) throw new AdapterError('Server adapter is not configured in this build.');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new AdapterError(`Server adapter returned HTTP ${res.status}.`);
      return res.json();
    },
  };
}
