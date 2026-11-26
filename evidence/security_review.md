# Task #07 — Security Review (Lecture #12)

**Completed by: 24B031863 Lashbayev Nurbek**  
**Date: 26 November 2026 (Asia/Almaty, UTC+5)**  
**Scope:** the Practice #12 code-based app in `/workspace/p12/code-based` and the Node-RED + FlowFuse Dashboard 2.0 app in `/workspace/p12/low-code`. All runtime checks were performed against `127.0.0.1` only. Third-party cloud services were not scanned.

Lecture #12 topics applied: SQL injection, XSS, broken authentication / sensitive-data exposure; SAST on source, DAST on running localhost apps, SCA on dependencies.

## 1. SCA — `npm audit`

Commands (run as `nurbek` on 26 November 2026, 14:54, UTC+5):

- `cd /workspace/p12/code-based && npm audit --json`
- `cd /workspace/p12/low-code && npm audit --json`
- both also run with `--omit=dev`

### Code-based (`vite-react-typescript-starter`)

| Scope | info | low | moderate | high | critical | total |
|---|---:|---:|---:|---:|---:|---:|
| All dependencies (466) | 0 | 1 | 7 | 9 | 2 | **19** |
| Production only (`--omit=dev`, 7 packages) | 0 | 0 | 0 | 0 | 0 | **0** |

The two **critical** findings are `vitest <=4.1.10` and `tinypool <=2.1.1` (the unit-test toolchain, not the production bundle). High findings (including `vite`, `js-yaml`, `minimatch`, `glob`, `cross-spawn`, `browserslist`) are likewise in the development/build graph. The shipped client bundle depends on `react`, `react-dom` and `lucide-react` only; `npm audit --omit=dev` reported **0 vulnerabilities**.

**Update responsibility:** the student / maintainer of this repository, by bumping devDependencies (especially Vitest and Vite) when a fix is available, and by re-running `npm audit` before any public deploy. No automated CI/SCA job is configured (open item).

### Low-code (Node-RED 5.0.10 + FlowFuse Dashboard 1.37.0)

| Scope | info | low | moderate | high | critical | total |
|---|---:|---:|---:|---:|---:|---:|
| All / production (533 packages, no separate dev tree) | 0 | 0 | 35 | 0 | 0 | **35** |

All 35 are **moderate**. They include `node-red >=4.1.9`, `@node-red/runtime`, `@node-red/registry`, and a large cluster of `npm` / `pacote` / `minimatch` / `sigstore` packages bundled with Node-RED. `npm audit` recommended `npm audit fix --force`, which would install **`node-red@4.1.8` (a breaking downgrade)** and was **not** applied.

**Update responsibility:** the student / operator who installed Node-RED must track Node-RED releases and dashboard updates. The platform vendor (OpenJS Foundation / FlowFuse) ships the dependency tree; there is no application-level lockfile review in CI.

Raw JSON is saved at `evidence/code_based_npm_audit.json` and `evidence/low_code_npm_audit.json`.

## 2. SAST

### Code-based

- `npm run lint` (ESLint 9): **clean** (0 errors, 0 warnings) after a one-line hooks fix.
- `npm run typecheck` (`tsc --noEmit`): **clean**.
- Search of `src/` for `eval(`, `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, hardcoded secrets, and `VITE_` API keys: **no production secrets and no `eval` / raw HTML injection**. A leftover Practice #11 comment in `src/llm/serverAdapter.ts` mentions `LLM_API_KEY` as a *server-side* environment variable; that adapter is **not wired** into the Practice #12 UI and no key is present in the client or `.env` files.
- Input validation lives in pure functions (`src/utils/validation.ts`) and does not interpolate untrusted input into HTML. React text interpolation escapes output by default.

### Low-code (`data/flows.json` and `settings.js`)

- Search for `eval(`, `innerHTML`, `document.write`, API keys, tokens, and passwords in `flows.json`: **no matches**.
- Function nodes contain only the deterministic contract logic (clock parsing, duration checks, overlap loop). There is no `eval` of user input.
- Decision widgets are `ui-text` with `format: "{{msg.payload}}"`. FlowFuse Dashboard / Vue interpolates this as **text**, not raw HTML.
- The room description is a static `ui-markdown` document with no user content.
- `settings.js` sets `credentialSecret: false`. No Node-RED credentials are stored for this exercise, but flow credentials would be stored unencrypted if they were added later. This is recorded as a configuration weakness.
- The editor has **no `adminAuth`**. Combined with the DAST finding below, this is the most important low-code issue.

## 3. DAST — safe manual runtime checks (localhost only)

All requests went to `127.0.0.1`. No third-party site was scanned.

### Code-based contract engine (via `vite-node` on `checkAvailability`)

| Payload | Result |
|---|---|
| `startTime="<script>alert(1)</script>"` | `invalid_start`; message does **not** echo the script |
| `duration="<script>alert(1)</script>"` | `invalid_duration`; message does **not** echo the script |
| `startTime="' OR 1=1 --"` | `invalid_start`; not treated as a successful query; message does not echo the payload |
| `startTime="99:99"` | `invalid_start` |
| `duration=-10` | `invalid_duration` |

There is no backend, database, or login, so classical SQLi and broken-authentication tests do not apply to a server. The risk is XSS in the UI; React escapes the deterministic messages, and messages do not reflect raw input.

### Low-code HTTP API (`POST /api/check`)

Identical payloads produced identical safe validation results (HTTP 200 + structured JSON, no script echo, bookings unchanged). Evidence: `evidence/dast_results.json`.

### Low-code Dashboard UI

Typing `<script>alert(1)</script>` into the Duration number widget did **not** fire a JavaScript `alert` (Playwright `dialog` listener: `DASH_ALERT_FIRED false`). The HTML did not contain a raw `<script>alert(1)</script>` tag. However, the Vuetify / Dashboard number input **silently coerced** the string to `1`, and the engine then returned **Available, 11:30–11:31 (1 min)** — see `screens/14_dast_xss_duration.png`. So: no XSS, but the widget hid the invalid input instead of showing `invalid_duration`. The HTTP API is the reliable path for those cases.

### Broken authentication / sensitive-data exposure (concrete Lecture #12 finding)

| URL | Auth | Result |
|---|---|---|
| `GET http://127.0.0.1:1880/flows` | **none** (`WWW-Authenticate` absent) | **HTTP 200**, `application/json`, ~35,010 bytes, 34 nodes including full Function-node source |
| `GET http://127.0.0.1:1880/` | **none** | **HTTP 200**, Node-RED editor |
| `GET http://127.0.0.1:1880/dashboard/checker` | **none** | **HTTP 200**, Dashboard 2.0 app |

Screenshot: `screens/15_dast_unauth_flows.png`.

This is the default Node-RED posture: the admin editor and the `/flows` API are unauthenticated unless `adminAuth` is configured. Anyone who can reach the port can read and (with POST `/flows`) **overwrite** the application. In this practice the process is bound to **`127.0.0.1` only**, which limits exposure to the local machine; it would be unsafe on `0.0.0.0` or a public host. Mitigation (not applied here, because we needed the editor for evidence): enable `adminAuth`, keep `uiHost: 127.0.0.1`, and do not expose port 1880.

## 4. Permissions, public sharing, secrets, connectors

| Check | Code-based | Low-code |
|---|---|---|
| Secrets in source / screenshots / client bundle | None found | None found; `credentialSecret: false` is a config risk if credentials are added later |
| Login / session / cookies | No login (intentional; fictional campus tool) | Editor and dashboard have no login by default (finding above) |
| Public sharing / hosting | Not published in this practice; previous P11 Bolt demo remains a public static site with fictional data only | Bound to localhost; not published |
| Connectors / datasources | None (no Google Sheets, no DB, no REST credentials) | None; fictional bookings are a constant in the Function node |
| Least privilege | Static files served locally; no admin API | Node-RED process can change its own flows; should not run as root (it ran as `nurbek`) |
| Output encoding | React text nodes | Vue `{{msg.payload}}` text widgets |

## 5. Summary

- Both implementations **reject** XSS-like and SQLi-like strings at the contract boundary and do not echo raw payloads.
- Production SCA is clean for the code-based app; the low-code app carries 35 moderate platform findings that require vendor updates.
- The important difference is **authentication of the admin surface**: Node-RED's editor and `/flows` API are open on localhost by default. That is a real Lecture #12 finding, not a theoretical one.

Completed by: 24B031863 Lashbayev Nurbek
