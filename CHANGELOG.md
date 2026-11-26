# Changelog

All notable updates to **VEX Robotics Team 654 — Parts Inventory** are listed here.

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
