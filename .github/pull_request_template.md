## Summary

Briefly describe what changed and why.

### Related Issue
Closes #(issue number)

---

## Checklist

- [ ] **TypeScript Check**: Ran `bun run lint` (`tsc --noEmit`) with zero errors.
- [ ] **Production Build**: Ran `bun run build` cleanly.
- [ ] **React Hooks**: All hooks are called unconditionally before any early returns.
- [ ] **Part ID Matching**: Checked shorthand and full IDs (`VEXSOL-1`, `sol 1`, `VEXS-DIST-4`, `4`).
- [ ] **Student & Admin Rules**: Verified students still enter an email on check out/in while signed-in admins work smoothly.
- [ ] **Red, Black & White Theme + Mobile**: Preserved the red/black/white palette (no green), tested Phone View & Desktop View, and kept print sheets readable.
