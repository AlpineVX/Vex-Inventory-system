## Summary

Briefly describe what changed and why.

### Related Issue
Closes #(issue number)

---

## Checklist

- [ ] **TypeScript Check**: Ran `bun run lint` (`tsc --noEmit`) with zero errors.
- [ ] **Verification Suite**: Ran `bun run test` (`scripts/verify.ts`) and all ID, SSR, storage, and theme checks pass.
- [ ] **Production Build**: Ran `bun run build` cleanly.
- [ ] **React Hooks & Defensive Parsing**: All hooks are called unconditionally before early returns, and cached/sheet values are safely coerced.
- [ ] **Part ID Matching & Batch Queue**: Verified shorthand IDs (`VEXSOL-1`, `sol 1`, `VEXS-DIST-4`, `4`) and batch queue behavior in both Type + Part # and Search Catalog modes.
- [ ] **Student & Admin Rules**: Verified students still enter an email on check out/in while signed-in admins work smoothly.
- [ ] **Red, Black & White Theme + Mobile + PWA**: Preserved the red/black/white palette (no green/emerald), checked Phone View & Desktop View, offline behavior, and print output.
