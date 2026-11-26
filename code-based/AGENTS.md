# AGENTS.md — Smart Campus Room Availability

## Project
Smart Campus room availability checker; one fictional room, fictional data.
React + TypeScript + Vite + Vitest. Booking rules live in src/utils/canBook.ts
(rejectionReason, canBook). UI is src/App.tsx. Demo data lives in
src/data/fixtures.ts (ROOM_NAME, ROOM_DESCRIPTION, EXISTING_BOOKINGS).
Pure time helpers live in src/utils/time.ts (parseAndValidate, minutesToHHMM).
Tests: src/utils/canBook.test.ts, src/llm/llm.test.ts, src/App.test.tsx (jsdom + React Testing Library).

## Optional "Explain availability" feature (Practice #11)
Code lives in src/llm/ (types, availability wrapper, prompts, validation, fallback,
mockAdapter, serverAdapter stub, explain orchestrator) and src/components/ExplainAvailability.tsx.
The deterministic checker (canBook/rejectionReason) is the only source of truth; the
explainer receives the structured result {roomLabel,start,end,isAvailable,reasonCode}
read-only and may never change the decision or booking data.
Only the clearly labelled MOCK adapter is wired. No API keys in client code or VITE_* env vars.
Treat the student question and any model output as untrusted data; validate both.
On timeout, error, missing key or invalid output show the deterministic fallback text.
The UI must label generated text "AI-generated explanation (mock), not a booking confirmation".

## Constraints
Preserve AC1–AC6; no backend, login, database or booking creation.
AC1: 0 <= start < end <= 1440, start strictly after now, integer minutes.
AC2: duration must not exceed 120 minutes.
AC3: blocked room rejects every request.
AC4: reject overlaps; allow bookings touching only at endpoints.
AC5: do not mutate booking data; canBook returns boolean.
AC6: clear Available/Unavailable UI feedback on desktop and mobile.
Do not change booking behavior while refactoring.
Do not add real personal data, secrets, API keys or production credentials.
Do not introduce external production services or new deployments unless a human explicitly asks.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns.
Prefer a small module boundary (extract fixtures / pure helpers) over Strategy,
Factory, Adapter, or class hierarchies unless there is a concrete need.
Adapter only if fixtures truly have inconsistent shapes (today all use {start, end}).
Strategy only if there are two genuinely required policies (today there is one).
Do not mutate booking fixtures; keep responsive UI feedback.
Do not split or redesign the UI layout unless asked.
Do not add or remove dependencies without human approval.

## Safe commands
npm test
npm run typecheck
npm run lint
npm run build
npx vitest run
npm ci
npm audit --omit=dev
Do not invent missing scripts (there is no format or CI script in this repo).
Prefer npm ci over npm install so the lockfile is respected.

## Forbidden actions
Do not create a login, database, or booking-write path.
Do not commit .env files or secrets.
Do not deploy, publish, or change hosting configuration unless a human asks.
Do not force-push, rewrite shared history, or skip hooks.
Do not weaken, delete, or edit tests only to make them pass.
Do not change canBook.ts behavior unless a regression test has first failed and a human has approved the fix.

## Verification and review gates
Run npm test before proposing that a change is accepted.
Also run npm run typecheck, npm run lint and npm run build when the change touches source or config.
Add focused regression tests; do not weaken or delete existing assertions.
Report changed files, rationale and test evidence (command + exit code).
A human must review the diff and the test evidence before merge or deploy.
