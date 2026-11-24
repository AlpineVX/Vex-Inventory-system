## Pull Request Overview

### Summary of Changes
Provide a concise summary of the changes made and the problem solved.

### Related Issue
Closes #(issue number)

---

## Pre-Merge Quality Checklist

- [ ] **TypeScript Linting**: Passed `bun run lint` (or `npm run lint`) with zero errors.
- [ ] **Production Build**: Passed `bun run build` cleanly.
- [ ] **Rules of Hooks**: All React hooks execute unconditionally before any early returns.
- [ ] **ID Normalization & Data Hygiene**: Verified shorthand and canonical IDs (`VEXSOL-1`, `sol 1`, `VEXS-DIST-4`, `4`) and safe string/date handling.
- [ ] **Admin & Member Accountability**: Verified regular members still require a valid email while unlocked admins can check out and check in cleanly.
- [ ] **Visual & Print Integrity**: Obsidian/zinc dark theme with amber/emerald accents and `@media print` custody sheet remain intact.
