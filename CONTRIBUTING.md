# Contributing to VEX Robotics Inventory Control

Thank you for contributing to the VEX Robotics Fleet & Inventory Command Center! This project is maintained by mentors, coaches, and student roboticists to ensure 100% hardware accountability during competitive tournament seasons.

---

## Code of Conduct

All contributors, student builders, and mentors are expected to uphold a respectful, inclusive, and collaborative environment aligned with the VEX Robotics Code of Conduct.

---

## Development Workflow

### 1. Prerequisites
- [Bun](https://bun.sh/) (preferred) or Node.js v18+ with `npm`
- Modern browser with Web Audio API support

### 2. Local Setup
```bash
git clone https://github.com/your-organization/vex-robotics-inventory.git
cd vex-robotics-inventory
bun install
bun run dev
```

### 3. Branching & Commits
- Use semantic branch names:
  - `feat/hardware-sensor-spec`
  - `fix/kiosk-id-normalization`
  - `docs/apps-script-guide`
- Follow conventional commits (`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`).

---

## Engineering Guidelines

### Component & ID Normalization
- All hardware component IDs must pass through `normalizeItemId(rawId, categoryHint)`.
- Never bypass the `CATEGORY_PREFIX_MAP` rules (e.g. `Brain` -> `BRAIN`, `Radio` -> `RAD`, `Sensors` -> `SEN`, `Optical` -> `OPT`, `Distance` -> `DIST`, `Inertial` -> `INERT`, `Rotational` -> `ROT`, `Solenoids` -> `SOL`).
- Always test with common student shorthand (e.g., `sol 1`, `4`, `DIST-4`, `VEX-DIST-004`).

### React & Hook Hygiene
- Adhere strictly to the **Rules of Hooks**: all hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) must be called at the very top of components, never conditionally or after early returns (`if (!isOpen) return null;`).

### Styling & Theming
- Maintain the obsidian/zinc dark palette (`#0b0d10`, `#12161f`, `#161a22`, `#1e242c`) with amber (`#ea580c`, `amber-500`) and emerald (`#059669`, `emerald-400`) accents.
- Use Tailwind CSS utility classes; avoid inline styles.
- Support clean high-contrast printing with `@media print` rules.

### Audio Ergonomics
- Audio feedback uses the procedural Web Audio synthesizer in `src/services/soundFx.ts`.
- Do not import external `.mp3` or `.wav` binary assets.
- Respect the global mute state: always verify that user preferences in `soundEnabled` are checked.

---

## Verification Before Pull Requests

Always run verification before submitting:
```bash
bun run lint
bun run build
```

Ensure both commands succeed with exit code `0`.
