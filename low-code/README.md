# Low-code track — Node-RED + FlowFuse Dashboard 2.0

This folder is the Practice #12 low-code implementation of the shared Smart Campus availability contract.

**Completed by: 24B031863 Lashbayev Nurbek**

## Contents

- `package.json` / `package-lock.json` — `node-red@5.0.10` and `@flowfuse/node-red-dashboard@1.37.0`
- `settings.js` — binds the runtime to `127.0.0.1:1880`, uses `./data` as the Node-RED userDir
- `data/flows.json` — the visual flow (Dashboard page, rule engine, HTTP `/api/check`)

Runtime caches, `node_modules`, and Node-RED `.config.*` files are not included. After `npm ci`, Node-RED will load the dashboard from this project’s `node_modules` if you either install the dashboard into `data/` as well, or keep `settings.js` as provided and install dependencies as shown below.

## Run locally

Requires Node.js 22 or newer (Node-RED 5 requires `>=22.9`; tested on Node v24).

```bash
cd low-code
npm ci

# Make the dashboard visible to the userDir (Node-RED loads extra nodes from userDir/node_modules)
mkdir -p data
cd data && npm init -y >/dev/null && npm install @flowfuse/node-red-dashboard@1.37.0
cd ..

npx node-red -s ./settings.js
```

Open in a browser on this machine only:

| What | URL |
|------|-----|
| Editor | http://127.0.0.1:1880 |
| Dashboard | http://127.0.0.1:1880/dashboard/checker |
| HTTP API | `POST` or `GET` http://127.0.0.1:1880/api/check |

Example:

```bash
curl -sS -X POST http://127.0.0.1:1880/api/check \
  -H "Content-Type: application/json" \
  -d '{"startTime":"11:30","duration":60,"isBlocked":false,"now":"09:00"}'
```

Expected for T1:

```json
{"available":true,"reasonCode":"available","message":"Room 101 is available from 11:30 to 12:30 (60 min).","existingBookings":[{"start":600,"end":660}],"bookingsUnchanged":true}
```

## How the flow is wired

UI inputs (Start time, Duration, Room blocked, Reference time) and the HTTP nodes both enter **Normalize Inputs → Validation → Availability Rule Engine → Split To Outputs**. The same Function nodes serve the Dashboard and `/api/check`.

A small JavaScript Function node implements the overlap loop (visual Switch nodes cannot iterate a booking array). That limitation is recorded in the Practice #12 report.

## Security note

The editor and `GET /flows` are unauthenticated by default. `settings.js` binds `uiHost` to `127.0.0.1` so the port is not advertised on other interfaces. Do not expose port 1880 and do not disable that bind without adding `adminAuth`.

Completed by: 24B031863 Lashbayev Nurbek
