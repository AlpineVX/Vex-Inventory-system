## Pull Request Overview

### Summary of Changes
Provide a brief summary of the changes made and the problem being solved.

### Related Issue
Closes #(issue number)

---

## Pre-Merge Quality Checklist

- [ ] **TypeScript Linting**: Passed `bun run lint` (or `npm run lint`) with zero errors.
- [ ] **Production Build**: Passed `bun run build` cleanly without warnings.
- [ ] **Rules of Hooks**: Verified all hooks execute unconditionally before any early returns.
- [ ] **ID Normalization**: Tested with both formal (`SOL-001`) and shorthand (`sol 1`, `1`) formats.
- [ ] **Palette Discipline**: Obsidian/zinc background with amber/emerald accents maintained.
- [ ] **Audio Feedback**: Web Audio synthesized sound toggles gracefully and obeys mute state.
- [ ] **Print Layout**: Verified that `@media print` renders cleanly in high-contrast black & white.
