# Contributing to VEX Robotics Team 654 Inventory

Thanks for helping improve the **VEX Robotics Team 654 Inventory** app. This tool is built for coaches, mentors, and students to keep track of VEX V5 brains, radios, sensors, and pneumatics across shop days and tournaments.

---

## Code of Conduct

All contributors, students, and mentors are expected to keep collaboration respectful and constructive in line with the VEX Robotics Code of Conduct.

---

## Local Setup

### Requirements
- [Bun](https://bun.sh/) *(recommended, matches `bun.lock`)* or **Node.js 20+**
- Any modern browser with Web Audio API support

### Quick Start
```bash
git clone https://github.com/your-organization/vex-robotics-inventory.git
cd vex-robotics-inventory
bun install
bun run dev
```

Visit `http://localhost:3000` to run both the Express API proxy and the Vite frontend.

### Branch & Commit Style
- **Branches**: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `refactor/<topic>`
- **Commits**: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`
- Update [`CHANGELOG.md`](CHANGELOG.md) under the latest release or an `[Unreleased]` section for user-facing changes.

---

## Code & Design Guidelines

### 1. Part ID Normalization (`src/types.ts`)
- Every part ID must run through `normalizeItemId(rawId, categoryHint)` and `classifyVexCategory(...)`.
- Keep prefixes consistent with `CATEGORY_PREFIX_MAP`:
  - `Brain` -> `VEXB`
  - `Radio` -> `VEXR`
  - `Sensors` -> `VEXS`
  - `Optical` -> `VEXS-O`
  - `Distance` -> `VEXS-DIST`
  - `Inertial` -> `VEXS-INER`
  - `Rotational` -> `VEXS-ROT`
  - `Solenoids` -> `VEXSOL`
- Always verify shorthand inputs (`sol 1`, `4`, `DIST-4`, `VEX-DIST-004`, `brain #2`).

### 2. Club Teams (`CLUB_TEAMS`)
- Official rosters in `src/types.ts`: `654K`, `654J`, `654A`, `654B`, `654G`, `654T`, `654V`, `654Y`, `654X`, `654Z`, `654W`, and `RECF`.

### 3. React, Forms & Defensive State
- Follow the **Rules of Hooks**: call all hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) unconditionally before early returns.
- Use `noValidate` on forms with explicit TypeScript validation after `.trim()` so browser constraint popups do not block valid trimmed inputs or optional admin fields.
- Safely coerce spreadsheet or cached string fields before calling `.toLowerCase()`, `.localeCompare()`, or `new Date(...)`.
- Preserve explicit user state across reloads (for example, disconnecting Google Sheets via `saveStoredApiUrl('')` and offline queue replay).

### 4. Lake Travis Red, Black & White Theme
- Match the club palette (`#09090b`, `#111114`, `#1a1a1f`, `#27272d`) with Team 654 **Crimson Red** (`#c52329`, `red-600`) and **White** (`#f4f4f5`, `zinc-100`) primary accents, using **Amber** (`amber-400`) for checked-out, low-stock, or repair warnings. **Do not use green or emerald.**
- Never use native browser dialogs (`window.alert`, `window.confirm`, `window.open`); use custom in-app modals or download helpers instead.
- Keep UI text plain, concise, and student-friendly (avoid sci-fi/corporate jargon or emoji clutter).
- Test both **Desktop View** and **Phone View** (including bottom-sheet modals, safe-area padding, and `44px` touch targets).
- Use `src/components/MotionPrimitives.tsx` for spring-animated tabs and spotlight cards, and ensure new animations respect `prefers-reduced-motion` in `src/index.css`.
- Keep `@media print` output clean in black and white (both inventory sheets and QR bin labels), and route sound effects through `src/services/soundFx.ts` so mute stays respected.

---

## Before Opening a Pull Request

Run all checks and confirm zero errors:

```bash
bun run lint
bun run test
bun run build
```
