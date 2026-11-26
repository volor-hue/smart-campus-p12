import { useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { explainAvailability } from '@/llm/explain';
import { createMockAdapter } from '@/llm/mockAdapter';
import { MAX_QUESTION_LENGTH } from '@/llm/validation';
import type { AvailabilityResult, ExplainOutcome, MockMode } from '@/llm/types';

const MOCK_MODES: MockMode[] = ['normal', 'slow', 'error', 'no-key', 'contradict'];

const FALLBACK_LABEL: Record<string, string> = {
  timeout: 'the mock model timed out',
  adapter_error: 'the mock model returned an error',
  missing_key: 'no API key is configured',
  invalid_output: 'the mock output failed validation',
};

interface Props {
  result: AvailabilityResult;
  /** Shows the dev-only mock mode selector (defaults to Vite dev mode). */
  showDevTools?: boolean;
  timeoutMs?: number;
  mockDelayMs?: number;
}

/**
 * Optional "Explain availability" feature. Read-only with respect to the
 * deterministic result: it receives `result` and never changes it.
 */
export function ExplainAvailability({
  result,
  showDevTools = import.meta.env.DEV,
  timeoutMs,
  mockDelayMs,
}: Props) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<MockMode>('normal');
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<ExplainOutcome | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setOutcome(null);
    const adapter = createMockAdapter({ mode, delayMs: mockDelayMs });
    const next = await explainAvailability(result, question, { adapter, timeoutMs });
    setOutcome(next);
    setLoading(false);
  };

  return (
    <section
      aria-label="AI explanation"
      className="mt-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 p-4"
    >
      <label htmlFor="question-input" className="mb-1.5 block text-sm font-medium text-slate-700">
        Question for the explainer (optional)
      </label>
      <textarea
        id="question-input"
        rows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g. Why can't I book this slot?"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
      <p className="mt-1 text-xs text-slate-400">
        {question.trim().length}/{MAX_QUESTION_LENGTH} characters. Do not enter personal information.
      </p>

      {showDevTools && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <label htmlFor="mock-mode">Mock mode (dev only):</label>
          <select
            id="mock-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as MockMode)}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            {MOCK_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleExplain}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Explaining…' : 'Explain availability'}
      </button>

      {outcome?.kind === 'rejected' && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Explanation request rejected: {outcome.error}
        </p>
      )}

      {outcome?.kind === 'explanation' && (
        <div data-testid="explanation" className="mt-3 rounded-lg border border-violet-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600">
            <Info className="h-3.5 w-3.5" />
            AI-generated explanation (mock), not a booking confirmation
          </p>
          <p className="mt-1.5 text-sm italic text-slate-700">{outcome.explanation}</p>
          <p className="mt-1.5 text-xs text-slate-400">
            {outcome.source === 'model'
              ? `Source: ${outcome.adapterName}.`
              : `Deterministic fallback shown because ${FALLBACK_LABEL[outcome.fallbackReason]} (${outcome.detail})`}
          </p>
        </div>
      )}
    </section>
  );
}
