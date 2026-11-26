import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  Unlock,
  XCircle,
} from 'lucide-react';
import { ROOM_DESCRIPTION, ROOM_NAME, EXISTING_BOOKINGS } from '@/data/fixtures';
import { checkAvailability, type ContractResult } from '@/utils/availability';
import { minutesToHHMM } from '@/utils/time';

type NowMode = 'fixed' | 'live';

function liveClockMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

function formatLiveLabel(minutes: number): string {
  return `${minutesToHHMM(minutes)} (live)`;
}

function App() {
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [nowMode, setNowMode] = useState<NowMode>('fixed');
  const [fixedNow, setFixedNow] = useState('09:00');
  const [result, setResult] = useState<ContractResult | null>(null);

  const liveNow = liveClockMinutes();
  const referenceNow = nowMode === 'live' ? minutesToHHMM(liveNow) : fixedNow;

  const clearResult = () => setResult(null);

  const handleCheck = () => {
    const nowValue = nowMode === 'live' ? liveClockMinutes() : fixedNow;
    const next = checkAvailability({
      startTime,
      duration,
      isBlocked,
      existingBookings: EXISTING_BOOKINGS,
      now: nowValue,
    });
    setResult(next);
  };

  const status = result
    ? result.available
      ? 'available'
      : result.reasonCode === 'overlap' || result.reasonCode === 'blocked'
        ? 'unavailable'
        : 'validation'
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-4 sm:py-6">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 text-center sm:mb-5">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 sm:h-14 sm:w-14">
            <Building2 className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            Smart Campus Room Availability Checker
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Check whether Room 101 is free for a future start time and duration.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 sm:p-6">
          <section className="mb-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800 sm:text-lg">{ROOM_NAME}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">{ROOM_DESCRIPTION}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 sm:text-sm">
                  <CalendarCheck className="h-3.5 w-3.5 text-blue-500" />
                  Existing: {EXISTING_BOOKINGS.map((booking) => `${minutesToHHMM(booking.start)}–${minutesToHHMM(booking.end)}`).join(', ')}
                </span>
                <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {isBlocked ? (
                      <Lock className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-emerald-500" />
                    )}
                    Room blocked
                  </span>
                  <input
                    id="blocked-input"
                    type="checkbox"
                    checked={isBlocked}
                    aria-label="Room blocked"
                    onChange={(event) => {
                      setIsBlocked(event.target.checked);
                      clearResult();
                    }}
                    className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Clock className="h-4 w-4" />
              Request
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="start-input" className="mb-1 block text-sm font-medium text-slate-700">
                  Start time
                </label>
                <input
                  id="start-input"
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    clearResult();
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label htmlFor="duration-input" className="mb-1 block text-sm font-medium text-slate-700">
                  Duration (minutes)
                </label>
                <input
                  id="duration-input"
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={1}
                  max={120}
                  value={duration}
                  onChange={(event) => {
                    setDuration(event.target.value);
                    clearResult();
                  }}
                  placeholder="e.g. 60"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label htmlFor="now-input" className="mb-1 block text-sm font-medium text-slate-700">
                  Reference current time
                </label>
                {nowMode === 'fixed' ? (
                  <input
                    id="now-input"
                    type="time"
                    value={fixedNow}
                    onChange={(event) => {
                      setFixedNow(event.target.value);
                      clearResult();
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p
                    id="now-input"
                    data-testid="live-now"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    {formatLiveLabel(liveNow)}
                  </p>
                )}
              </div>
            </div>
            <fieldset className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
              <legend className="sr-only">Reference time mode</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="now-mode"
                  value="fixed"
                  checked={nowMode === 'fixed'}
                  onChange={() => {
                    setNowMode('fixed');
                    clearResult();
                  }}
                />
                Fixed reference time (default 09:00)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="now-mode"
                  value="live"
                  checked={nowMode === 'live'}
                  onChange={() => {
                    setNowMode('live');
                    clearResult();
                  }}
                />
                Use live clock{nowMode === 'live' ? ` — ${referenceNow}` : ''}
              </label>
            </fieldset>
          </section>

          <button
            type="button"
            onClick={handleCheck}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <Search className="h-5 w-5" />
            Check Availability
          </button>

          {result && status === 'validation' && (
            <div
              role="alert"
              data-testid="status-badge"
              className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Validation Error</p>
                <p data-testid="reason-code" className="mt-1 font-mono text-xs text-amber-700">
                  reason code: {result.reasonCode}
                </p>
                <p data-testid="message" className="mt-1 text-sm text-amber-800">
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {result && status !== 'validation' && (
            <div
              role="status"
              data-testid="status-badge"
              className={`mt-4 flex items-start gap-4 rounded-xl p-4 ${
                status === 'available'
                  ? 'border border-emerald-200 bg-emerald-50'
                  : 'border border-rose-200 bg-rose-50'
              }`}
            >
              {status === 'available' ? (
                <CheckCircle2 className="mt-0.5 h-8 w-8 flex-shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-8 w-8 flex-shrink-0 text-rose-500" />
              )}
              <div>
                <p
                  className={`text-xl font-bold ${
                    status === 'available' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {status === 'available' ? 'Available' : 'Unavailable'}
                </p>
                <p data-testid="reason-code" className="mt-1 font-mono text-xs text-slate-500">
                  reason code: {result.reasonCode}
                </p>
                <p
                  data-testid="message"
                  className={`mt-1 text-sm ${
                    status === 'available' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {result.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          This tool only checks availability — it does not create, save, or confirm any booking.
          Fictional data only. Completed by: 24B031863 Lashbayev Nurbek.
        </p>
      </div>
    </div>
  );
}

export default App;
