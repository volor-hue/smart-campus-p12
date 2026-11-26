# Smart Campus Room Availability Checker

KBTU Software Engineering — **Practice #12**: compare a **code-based** and a **low-code** implementation of the same fictional Smart Campus availability contract.

**Completed by: 24B031863 Lashbayev Nurbek**  
Instructor: B. Azimkhanov · Class time: Thursday, 14:00–16:50 (UTC+5) · Date: 26 November 2026

## Links

- Live demo (Practice #11 baseline): https://smart-campus-room-av-wgz3.bolt.host
- Bolt project: https://bolt.new/~/sb1-lc1kdi7n
- Shared contract: [`shared_contract.md`](shared_contract.md)
- Report PDF: [`submission/Practice12_Report_Lashbayev_24B031863.pdf`](submission/Practice12_Report_Lashbayev_24B031863.pdf)
- Screenshots PDF: [`submission/Practice12_Screenshots_Lashbayev_24B031863.pdf`](submission/Practice12_Screenshots_Lashbayev_24B031863.pdf)

## What this project does

A student checks whether **Room 101 (Library Study Room)** is free for a future start time and a duration. The system returns **Available**, **Unavailable**, or **Validation Error**, with a reason code and a readable message. It does not create bookings and never changes the fictional existing booking `10:00–11:00` (`[{ start: 600, end: 660 }]`). Deterministic tests use reference time `09:00`.

Both tracks implement the same six acceptance criteria (Slide 13) and the pre-defined T1–T8 cases in the shared contract.

## Repository structure

```
.
├── README.md
├── shared_contract.md          # user story, AC1–AC6, I/O contract, T1–T8 (written before implementation)
├── code-based/                 # React + TypeScript + Vite + Vitest
├── low-code/                   # Node-RED 5 + FlowFuse Dashboard 2.0
├── evidence/                   # test results, timings, SCA/DAST/SAST notes
├── screens/                    # 15 final screenshots (01–15)
└── submission/                 # report PDF, screenshots PDF, email draft
```

## How to run the code-based track

Requires Node.js 22+ (tested on Node v24).

```bash
cd code-based
npm ci          # or: npm install
npm test        # 60 tests, including T1–T8 in src/utils/contract.test.ts
npm run lint
npm run typecheck
npm run build
npm run dev     # Vite dev server
```

The UI uses **Start time**, **Duration (minutes)**, a **Room blocked** toggle, and a **reference current time** (default fixed `09:00`, optional live clock).

## How to run the low-code track

See [`low-code/README.md`](low-code/README.md). Short version:

```bash
cd low-code
npm ci
npx node-red -s ./settings.js
```

Then open:

- Editor: http://127.0.0.1:1880 (bound to localhost; no admin auth by default — see security notes)
- Dashboard: http://127.0.0.1:1880/dashboard/checker
- API: `POST http://127.0.0.1:1880/api/check` with JSON `{ "startTime": "11:30", "duration": 60, "isBlocked": false, "now": "09:00" }`

The dashboard button and `/api/check` share the same Validation and Availability Rule Engine nodes.

## T1–T8 results (measured)

| ID | Case | Expected | Code-based | Low-code |
|----|------|----------|------------|----------|
| T1 | 11:30 × 60 min, free | Available (`available`) | Pass | Pass |
| T2 | 10:30 × 60 min, overlap | Unavailable (`overlap`) | Pass | Pass |
| T3 | 11:30 × 60 min, blocked | Unavailable (`blocked`) | Pass | Pass |
| T4 | duration = 0 | Validation error (`invalid_duration`) | Pass | Pass |
| T5 | duration = 121 | Validation error (`duration_too_long`) | Pass | Pass |
| T6 | start 08:30, now 09:00 | Validation error (`past_start`) | Pass | Pass |
| T7 | 11:00 × 60 min, adjacent | Available (`available`) | Pass | Pass |
| T8 | bookings unchanged after T1–T7 | `[{ start: 600, end: 660 }]` | Pass | Pass |

**Score: code-based 8/8, low-code 8/8.** Full log: [`evidence/test_results.json`](evidence/test_results.json). The code-based suite as a whole is **60/60** (`npm test`).

## Lecture #12 security highlights

- **SCA:** `npm audit --omit=dev` is clean (0) for the code-based production graph. The low-code tree reports 35 *moderate* findings in Node-RED and bundled npm packages. Details in [`evidence/security_review.md`](evidence/security_review.md).
- **SAST:** ESLint and TypeScript are clean. No `eval`, no secrets, no client API keys.
- **DAST (localhost only):** XSS-like and SQLi-like strings are rejected by both contract engines and are not echoed in messages.
- **Concrete finding:** Node-RED’s admin editor and `GET /flows` are **unauthenticated by default**. In this practice the process is bound to `127.0.0.1` only. Do not expose port 1880 without `adminAuth`. See screenshot `screens/15_dast_unauth_flows.png`.

## Recommendation (short)

Keep the **code-based** app as the system of record (typed modules, Vitest, no open admin API). The Node-RED track is a fair, zero-cost low-code comparison of the same contract, but the editor must be locked down before any non-localhost use.

Completed by: 24B031863 Lashbayev Nurbek
