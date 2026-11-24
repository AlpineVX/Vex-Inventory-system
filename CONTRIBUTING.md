# Contributing to VEX Robotics Inventory Control

Thank you for contributing to **VEX Robotics Inventory Control**! This platform is built for mentors, coaches, and student roboticists to maintain reliable hardware accountability across competition seasons.

---

## Code of Conduct

All contributors, student builders, and mentors are expected to maintain a respectful, collaborative, and constructive environment aligned with the VEX Robotics Code of Conduct.

---

## Development Setup

### Prerequisites
- [Bun](https://bun.sh/) *(recommended, matches `bun.lock`)* or Node.js v20+ with `npm`
- Modern browser supporting ES2022 and the Web Audio API

### Local Workflow
```bash
git clone https://github.com/your-organization/vex-robotics-inventory.git
cd vex-robotics-inventory
bun install
bun run dev
```

Open `http://localhost:3000` to run the Express API proxy and Vite frontend together.

### Branching & Commit Conventions
- **Branch naming**: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `refactor/<topic>`
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`

---

## Engineering Guidelines

### Component & ID Normalization (`src/types.ts`)
- All hardware component IDs must pass through `normalizeItemId(rawId, categoryHint)` and `classifyVexCategory(...)`.
- Respect `CATEGORY_PREFIX_MAP` prefixes:
  - `Brain` -> `VEXB`
  - `Radio` -> `VEXR`
  - `Sensors` -> `VEXS`
  - `Optical` -> `VEXS-O`
  - `Distance` -> `VEXS-DIST`
  - `Inertial` -> `VEXS-INER`
  - `Rotational` -> `VEXS-ROT`
  - `Solenoids` -> `VEXSOL`
- Always verify shorthand normalization (e.g., `sol 1`, `4`, `DIST-4`, `VEX-DIST-004`, `brain #2`).

### Club Team Roster (`CLUB_TEAMS`)
- Current official teams in `src/types.ts`: `654K`, `654J`, `654A`, `654B`, `654G`, `654T`, `654V`, `654Y`, `654X`, `654Z`, `654W`, and `RECF`.

### React & Form Hygiene
- Follow the **Rules of Hooks**: call all hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) unconditionally at the top of components before any early returns.
- Forms should use `noValidate` with explicit TypeScript validation after `.trim()` so cross-browser constraint popups (such as Safari pattern errors) do not interfere with valid trimmed input or optional admin fields.
- Coerce spreadsheet/cache string fields safely before calling `.toLowerCase()`, `.localeCompare()`, or date constructors.

### Styling & Audio
- Preserve the dark obsidian/zinc palette (`#0b0d10`, `#12161f`, `#161a22`, `#1e242c`) with amber (`#ea580c`, `amber-500`) and emerald (`#059669`, `emerald-400`) accents using Tailwind CSS utility classes.
- Keep `@media print` custody manifest output legible in black and white.
- All tactile audio effects live in `src/services/soundFx.ts` via Web Audio API oscillators (no external audio files) and must respect the global mute setting.

---

## Pre-PR Verification

Before opening a pull request, verify both type-checking and the production bundle pass cleanly:

```bash
bun run lint
bun run build
```
