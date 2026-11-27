# Changelog

All notable updates to **VEX Robotics Team 654 — Parts Inventory** are listed here.

## [1.3.0] - 2026-11-27

### Added
- **Live Pit Stock Health Strip (`CommandCenter`)**: 3-segment ratio bar showing Ready, Checked Out, and Needs Repair counts, plus 1-click drilldown for parts out 14+ days and a **QR Labels** header button.
- **Core Robot Kit Check (`TeamLookup`)**: Per-team checklist for `Brain`, `Radio`, `Sensors`, and `Solenoids` with 1-tap checkout when any core component is missing.
- **Part Inspector Stepping & Copy Rows (`InventoryBrowser`)**: Step forward and backward through filtered parts inside the details drawer (`←` / `→` arrow keys or header buttons), plus one-click TSV **Copy Rows** for spreadsheets.
- **Pack List Search & Completion Banner (`CompetitionPackList`)**: Instant keyword filtering alongside status tabs and a tournament-ready verification banner at `100%`.
- **Floating Back-to-Top Control (`MotionPrimitives`)**: Compact scroll-to-top button appearing smoothly on long inventory and log views.
- **GitHub Automation & Documentation Suite**: Added two-stage CI with live production `/api/health` smoke testing, CodeQL security scanning, automated PR area labeling, tag-based GitHub Release packaging, part catalog issue template, Code of Conduct, `.editorconfig`, and dedicated Google Sheets & Architecture guides under `docs/`.

---

## [1.2.0] - 2026-11-26

### Added
- **Command Palette (`⌘K` / `Ctrl+K`)**: Quick switcher to jump to any page, club team, part ID, sync action, label printer, or status panel.
- **Printable QR Bin Labels**: Interactive label sheet generator (`LabelPrinterModal`) supporting 3-column and 4-column sticker layouts with part names, IDs, and cabinet bin locations.
- **Part Health & Repair Flags**: Mark damaged parts as `Needs Repair` from the Parts Inventory, Mobile Cards, or Check In sheet, with warning banners during checkout.
- **Multi-Part Batch Queue**: Queue multiple hardware parts together inside Check Out / Check In across both **Type + Part #** and **Search Catalog** modes.
- **Offline Sync Queue & PWA Support**: Automatic local queue for checkouts made without venue Wi-Fi, auto-sync when connection returns, plus iOS/Desktop install support.
- **1-Tap Undo Toast**: Quickly undo recent checkouts or returns right from the confirmation notification.
- **Automated Verification (`scripts/verify.ts`)**: End-to-end checks for ID normalization, disconnect persistence, SSR rendering across all views, and design/asset guardrails.

### Fixed
- **Disconnect Persistence**: Disconnecting from Google Sheets in Settings now stays disconnected across page reloads until reconnected manually.
- **Connection Test Accuracy**: Failed Google Sheets sync tests now display the exact error instead of false success messages.
- **QR Label Picker Stability**: Searching, switching categories, or background syncing no longer resets already-checked labels.
- **Pagination & Performance**: Progressive row rendering in Full Parts Inventory and Activity Log keeps scrolling fast even with hundreds of items and log entries.
- **Mobile UI Polish**: Top-aligned mobile toast notifications so they never overlap the offline sync bar or bottom navigation, plus accurate pre-filter tab counts.

---

## [1.1.0] - 2026-11-20

### Added
- **Mobile Phone Layout**: Dedicated `MobileTopHeader`, `MobileBottomNav`, swipe-to-action part cards, and bottom-sheet checkout dialogs.
- **Interactive Part Inspector**: Slide-over specs and recent custody history drawer on desktop, plus expandable details accordion on mobile.
- **Competition Pack List Custom Spares**: Add custom pit spares and compare pack targets against live stock counts.

---

## [1.0.0] - 2026-11-10

### Added
- Initial release with Lake Travis Team 654 Red/Black/White dashboard, Type + Part # checkout, smart VEX ID normalization, Team Parts view, Activity Log CSV export, Admin PIN lock, and `LOGS`-only Google Apps Script proxy.
