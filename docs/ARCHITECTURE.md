# System Architecture

An overview of how **VEX Robotics Team 654 — Parts Inventory** structures hardware identity, local state persistence, server proxying, and desktop/mobile views.

---

## High-Level Data Flow

1. **Client UI (`src/App.tsx`, `src/components/*`)**:
   - React 19 single-page app styled with Tailwind CSS v4 (`@theme` tokens strictly locked to Obsidian `#09090b`, Crimson Red `#c52329`, White `#f4f4f5`, and Amber `#f59e0b`).
   - Adaptive layout switches automatically at `< 768px` (or manually via the View Mode toggle) between Desktop (`Header`, `InventoryBrowser`) and Phone (`MobileTopHeader`, `MobileBottomNav`, `MobileInventoryList`).
   - Shared `MotionPrimitives.tsx` provides `SpotlightCard`, `useSlidingIndicator`, `AnimatedNumber`, `AnimatedRingGauge`, `SwipeableActionCard`, and `BackToTopButton`, honoring `prefers-reduced-motion`.
2. **Express Proxy & Static Server (`server.ts`)**:
   - Listens on port `3000`.
   - In development, mounts Vite middleware (`vite.middlewares`); in production (`NODE_ENV=production`), serves the built `dist/` bundle.
   - Exposes `/api/health`, `/api/sync`, and `/api/action`.
3. **Google Apps Script Bridge (`src/services/sheetApi.ts`)**:
   - Routes sync/post traffic through same-origin `/api/*` endpoints to avoid browser CORS and redirect restrictions on Apps Script `/exec` URLs.

---

## Canonical Part ID Normalization (`src/types.ts`)

Every user query, modal input, and spreadsheet row passes through `normalizeItemId(rawId, categoryHint)` and `classifyVexCategory(...)`:

| Category | Canonical Prefix | Shorthand Examples Resolved | Default Location |
|:---|:---|:---|:---|
| Brain | `VEXB-*` | `brain #2`, `b2`, `276-4810` | Cabinet 1 |
| Radio | `VEXR-*` | `radio 1`, `r1` | Cabinet 1 |
| Optical | `VEXS-O-*` | `opt3`, `optical 3` | Sensor Cabinet |
| Distance | `VEXS-DIST-*` | `DIST-4`, `VEX-DIST-004`, `4` *(with hint)* | Sensor Cabinet |
| Inertial | `VEXS-INER-*` | `iner 2`, `imu 2` | Sensor Cabinet |
| Rotational | `VEXS-ROT-*` | `rot-5`, `rotation 5` | Sensor Cabinet |
| Solenoids | `VEXSOL-*` | `sol 1`, `solenoid 001` | Pneumatics Cabinet |

---

## Browser Storage Keys

| Key | Purpose | Resilience Notes |
|:---|:---|:---|
| `vex_inventory_cache` | Last known hardware list (`InventoryItem[]`) | Sanitized on load; falls back cleanly to 179-part baseline |
| `vex_logs_cache` | Recent check-out / check-in audit rows (`AuditLog[]`) | Deduplicated on `timestamp + itemId + action` |
| `vex_api_url` | Active Google Apps Script `/exec` URL | Empty string `""` persists explicit disconnect |
| `vex_offline_sync_queue` | Queued checkouts/returns taken offline | Replayed sequentially once `navigator.onLine` returns |
| `vex_item_conditions_v1` | Local `Needs Repair` health flags | Merged onto live sheet sync rows so repair flags are not lost |
| `vex_pack_list_state` | Competition Pack List checked quantities & custom spares | Protected by `Array.isArray` validation on read |
| `vex_admin_settings` | Admin email allowlist, PIN, shared kiosk mode | Defaults to locked on startup (`isUnlocked: false`) |

---

## Security & Guardrails

- **SSRF Allowlist (`server.ts`)**: `validateGasProxyUrl` enforces `https://`, rejects loopback/private/link-local IPs (`127.0.0.1`, `10.*`, `172.16-31.*`, `192.168.*`, `169.254.*`), and allows only `script.google.com` or `script.googleusercontent.com`.
- **Automated Verification (`scripts/verify.ts`)**: Executed in CI via `bun run test`, validating ID parsing, disconnect persistence, SSR rendering of 16+ components and modals, JSON config validity, Express proxy rules, zero `emerald`/`green` classes, and zero `window.alert`/`confirm`/`open` calls.
- **PWA Precaching (`vite.config.ts`)**: Precaches static assets via Workbox while keeping `/api/*` `NetworkOnly` so live inventory sync data is never served stale by a service worker.
