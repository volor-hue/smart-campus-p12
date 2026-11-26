# Shared Requirement and Acceptance-Criteria Sheet

**Practice work #12 — Compare code-based and low-code solutions**  
**Completed by: 24B031863 Lashbayev Nurbek**  
**Defined before either implementation was changed (Task #02).**  
**Date: 26 November 2026 (Asia/Almaty, UTC+5)**

## Shared User Story

As a student on a fictional campus, I want to check whether **Room 101 (Library Study Room)** is available for a future start time and a chosen duration, so that I can see a clear **Available**, **Unavailable**, or **Validation Error** decision with a reason code and a readable message — without creating a booking and without changing any existing booking data.

## Shared Acceptance Criteria (Slide 13, verbatim)

- **AC1:** Start time must be in the future.
- **AC2:** Duration must be greater than zero and at most 120 minutes.
- **AC3:** Overlapping bookings are unavailable.
- **AC4:** Blocked room is unavailable.
- **AC5:** Display a clear decision without changing existing bookings.
- **AC6:** Invalid input receives understandable feedback.

## Input Contract

Both implementations accept the same inputs:

| Field | Name | Type / format | Notes |
|---|---|---|---|
| Start time | `startTime` | `HH:MM` (24-hour) or integer minutes from midnight (0–1440) | Required |
| Duration | `duration` | integer minutes | Must be a whole number; `> 0` and `<= 120` (AC2) |
| Room blocked flag | `isBlocked` | boolean | When `true`, every request is unavailable (AC4) |
| Existing bookings | `existingBookings` | array of `{ start, end }` in minutes | Fixed fictional data; never written to |
| Reference current time | `now` | `HH:MM` or integer minutes | Deterministic tests use `09:00` = `540`. UI may also use a live clock. |

### Fictional room and bookings (frozen)

- Room: **Room 101** — **Library Study Room**
- Existing bookings: **10:00–11:00**, encoded as `[{ start: 600, end: 660 }]`
- No real personal data, login, payment, or production database
- The optional Practice #11 “Explain availability” feature is **not required** and is not part of this common contract

## Output Contract

Both implementations return the same JSON-shaped result:

```json
{
  "available": true,
  "reasonCode": "available",
  "message": "Room 101 is available from 11:30 to 12:30 (60 min)."
}
```

| Field | Type | Meaning |
|---|---|---|
| `available` | boolean | `true` only when the room can be booked for the requested interval |
| `reasonCode` | string | Machine-readable code (see below) |
| `message` | string | Human-readable explanation shown in the UI |

### Reason codes

| `reasonCode` | `available` | When it is used |
|---|---|---|
| `available` | `true` | Interval is valid, room is not blocked, and it does not overlap an existing booking (touching an endpoint is allowed) |
| `overlap` | `false` | Interval overlaps an existing booking (AC3) |
| `blocked` | `false` | Room is blocked (AC4) |
| `invalid_duration` | `false` | Duration is missing, not an integer, or `<= 0` (AC2, AC6) |
| `duration_too_long` | `false` | Duration is greater than 120 minutes (AC2, AC6) |
| `past_start` | `false` | Start time is not strictly after `now` (AC1, AC6) |
| `invalid_start` | `false` | Start time is missing or not `HH:MM` / integer minutes (AC6) |
| `invalid_now` | `false` | Reference current time is missing or invalid (AC6) |
| `invalid_range` | `false` | Start plus duration extends past 24:00 (AC6) |

Validation is evaluated first (AC1, AC2, AC6), then the blocked-room rule (AC4), then overlap (AC3). Existing bookings must not be mutated (AC5). Intervals that only touch an existing booking at an endpoint do **not** overlap.

## Pre-defined Eight-Case Test Suite (T1–T8)

These cases were specified **before** the Practice #12 implementations were written. All cases use `now = 09:00` (`540`) and `existingBookings = [{ start: 600, end: 660 }]`.

| ID | Inputs | Expected status | Expected `reasonCode` | Expected decision |
|---|---|---|---|---|
| **T1** | `start=11:30` (`690`), `duration=60`, `blocked=false` | Available | `available` | Valid free interval 11:30–12:30 |
| **T2** | `start=10:30` (`630`), `duration=60`, `blocked=false` | Unavailable | `overlap` | 10:30–11:30 overlaps 10:00–11:00 |
| **T3** | `start=11:30` (`690`), `duration=60`, `blocked=true` | Unavailable | `blocked` | Blocked room rejects a otherwise-valid request |
| **T4** | `start=11:30` (`690`), `duration=0`, `blocked=false` | Validation error | `invalid_duration` | Duration must be greater than zero |
| **T5** | `start=11:30` (`690`), `duration=121`, `blocked=false` | Validation error | `duration_too_long` | Duration must be at most 120 minutes |
| **T6** | `start=08:30` (`510`), `duration=60`, `blocked=false`, `now=09:00` | Validation error | `past_start` | Start time is in the past relative to `now` |
| **T7** | `start=11:00` (`660`), `duration=60`, `blocked=false` | Available | `available` | Adjacent interval 11:00–12:00 touches 11:00 only; not an overlap |
| **T8** | After running T1–T7 | — | — | `existingBookings` is strictly unchanged: deep-equal to `[{ start: 600, end: 660 }]` |

Completed by: 24B031863 Lashbayev Nurbek
