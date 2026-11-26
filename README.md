<div align="center">

<img src="public/lake_travis_logo_transparent.png" alt="Lake Travis VEX Robotics Club 654 Logo" width="120" />

# VEX Robotics Team 654 — Parts Inventory

**Fast part checkout, team equipment tracking, and tournament pack lists for Lake Travis VEX Robotics (Club 654).**

[![React 19](https://img.shields.io/badge/React-19.0-111114?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-111114?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-c52329?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-111114?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-111114?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![VEX V5](https://img.shields.io/badge/VEX-V5_Hardware-c52329?style=for-the-badge)](https://www.vexrobotics.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-f4f4f5?style=for-the-badge)](LICENSE)

[Overview](#overview) · [Features](#features) · [Shortcuts](#keyboard-shortcuts) · [Architecture](#how-it-works) · [VEX Parts](#supported-vex-v5-parts) · [Setup](#getting-started) · [Google Sheets](#google-sheets-sync)

</div>

---

## Overview

Built for day-to-day shop use and tournament pits, this app replaces messy manual spreadsheet edits with a clean **red, black, and white** inventory tracker for all **Club 654** teams (`654K`, `654J`, `654A`, `654B`, `654G`, `654T`, `654V`, `654Y`, `654X`, `654Z`, `654W`, and `RECF`).

Students can check parts in and out in seconds from a shop laptop or phone, while coaches and leads get team-by-team breakdowns, packing checklists, and non-destructive Google Sheets syncing.

```text
+-----------------------------------------------------------------------------+
|                        VEX ROBOTICS CLUB 654 STORAGE                        |
|                                                                             |
|  CABINET 1               PNEUMATICS CABINET       SENSOR CABINET            |
|  · V5 Brains (VEXB)      · Solenoids (VEXSOL)     · Optical (VEXS-O)        |
|  · V5 Radios (VEXR)                               · Distance (VEXS-DIST)    |
|                                                   · Inertial (VEXS-INER)    |
|                                                   · Rotational (VEXS-ROT)   |
+-----------------------------------------------------------------------------+
```

---

## Features

### Quick Check Out & Check In
- **Pick Type + Part #**: Select a part category and tap or increment the part number, or search the full list (`CheckInOutModal`).
- **Smart ID Matching**: Typing `sol 1`, `4`, `DIST-4`, `VEX-DIST-004`, `brain #2`, or `opt3` automatically resolves to the official ID (`VEXSOL-1`, `VEXS-DIST-4`, `VEXB-2`, `VEXS-O-3`).
- **Student Accountability + Admin Mode**: Students enter their school email when checking parts out or back in. Coaches and leads can sign into **Admin Mode** (via PIN or email) to do quick 1-click returns, bulk actions, and settings changes.

### Five Focused Views
| View | What It Does |
|:---|:---|
| **Overview** | Live stock totals, category breakdown, cabinet lookup, quick borrow shortcuts, overdue alerts, and recent checkouts. |
| **Parts Inventory** | Search all 279 parts (`/` or `⌘K`), filter by category or team, sort naturally (`VEXS-DIST-2` before `VEXS-DIST-10`), bulk-edit (admin), and export CSV. |
| **Team Parts** | View everything checked out to a specific team (`654K`–`654W` + `RECF`), print a team parts sheet, or return parts in one batch. |
| **Pack List** | Track tournament pit box spares against live available stock, with custom spare items and low-stock warnings. |
| **Activity Log** | Searchable history of every checkout and return with filters by team, action, or email, plus CSV export. |

### Built for Both Desktop and Phone
- **Responsive Mobile Layout**: Switches smoothly to `MobileTopHeader`, `MobileBottomNav`, expandable `MobileInventoryList` cards, and bottom-sheet modals with safe-area padding.
- **Manual Layout Toggle**: Switch between **Phone View** and **Desktop View** anytime from the header or footer.
- **Smooth Motion & Sound**: Spring-animated pill tabs, hover spotlight cards, animated ring gauges (`MotionPrimitives.tsx`), and optional browser sound effects (`M` to mute), all respecting `prefers-reduced-motion`.
- **Clean Print Sheets (`P` / `Ctrl+P`)**: Black-and-white print styles turn dark tables into clean paper checklists.
- **Club Logos & QR Badges**: Downloadable club logos and print-ready QR code badges via `ClubAssetsModal` and `create_qr_badges.mjs`.

---

## Keyboard Shortcuts

| Key | Action | What It Opens |
|:---:|:---|:---|
| `1` | **Overview** | Main dashboard and quick finder |
| `2` | **Parts Inventory** | Full searchable parts table |
| `3` | **Team Parts** | Parts checked out by team |
| `4` | **Pack List** | Competition pit box checklist |
| `5` | **Activity Log** | Checkout and return history |
| `/` or `⌘K` | **Search** | Focus the search bar |
| `C` | **Check Out / In** | Open the Check Out / Check In sheet |
| `D` | **App Status** | Cache size, sync check, and server ping |
| `M` | **Sound** | Toggle click and confirmation sounds |
| `P` | **Print** | Print current inventory sheet (`Ctrl+P`) |
| `?` | **Shortcuts** | Open shortcuts help window |
| `Esc` | **Close** | Close open modals or clear focus |

---

## How It Works

```mermaid
flowchart LR
    subgraph Client["React 19 + TypeScript + Tailwind v4"]
        Views["Overview · Inventory · Teams · Pack List · Log"]
        Modals["Check Out/In · Admin · Settings · Status · Logos"]
        Services["sheetApi.ts · soundFx.ts · normalizeItemId()"]
        Cache[("Browser Storage Cache")]
        Views --> Modals --> Services
        Services <--> Cache
    end

    subgraph Server["Express Server (server.ts · Port 3000)"]
        Health["GET /api/health"]
        Sync["GET /api/sync"]
        Action["POST /api/action"]
    end

    subgraph Google["Google Sheets + Apps Script"]
        GAS["Web App (/exec)"]
        Tabs["Part Tabs + LOGS Tab"]
        GAS <--> Tabs
    end

    Services -->|"Same-origin proxy"| Server
    Sync -->|"doGet()"| GAS
    Action -->|"doPost()"| GAS
```

- **Safe Proxy**: `server.ts` validates Google Apps Script URLs with `new URL()`, enforces `https://`, blocks local/private network addresses, and only forwards requests to `script.google.com` or `script.googleusercontent.com`.
- **Offline Ready**: Works immediately out of the box with local browser caching; corrupted spreadsheet fields are sanitized safely on load.

---

## Supported VEX V5 Parts

| Category | ID Prefix | VEX Part # | Interface | Operating Spec | Manual Rule | Storage |
|:---|:---:|:---:|:---|:---|:---:|:---|
| **V5 Brain** | `VEXB-*` | `276-4810` | Dual Cortex-A9 / VEXos / 21 Smart Ports | 7.2V – 12.8V Smart Battery | `<R11>` Max 1 per robot | Cabinet 1 |
| **V5 Radio** | `VEXR-*` | `276-4831` | 2.4 GHz DSSS / VEXnet 3.0 / BLE 4.2 | 16 RF channels | `<R11>` Clear line of sight | Cabinet 1 |
| **Optical Sensor** | `VEXS-O-*` | `276-4833` | V5 Smart Port (RS-485) | 10 mm – 100 mm, 100 Hz | `<R13>` Legal Smart sensor | Sensor Cabinet |
| **Distance Sensor** | `VEXS-DIST-*` | `276-4834` | V5 Smart Port (Class 1 Laser) | 20 mm – 2,000 mm | `<R13>` Class 1 IEC 60825-1 | Sensor Cabinet |
| **Inertial Sensor** | `VEXS-INER-*` | `276-4840` | V5 Smart Port (6-DOF IMU) | +/-2,000 deg/s, +/-8G | `<R13>` Flat rigid mount | Sensor Cabinet |
| **Rotational Sensor** | `VEXS-ROT-*` | `276-6010` | V5 Smart Port (Magnetic) | 360 deg, 4,096 ticks/rev | `<R13>` Tracking pods | Sensor Cabinet |
| **Pneumatic Solenoid** | `VEXSOL-*` | `276-8140` | V5 3-Wire / PCM (5V DC) | 0 – 100 PSI, 12ms shift | `<R12>` Max 100 PSI | Pneumatics Cabinet |

---

## Getting Started

### Requirements
- [Bun](https://bun.sh/) *(recommended, `bun.lock` included)* or **Node.js 20+**
- Any modern browser

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-organization/vex-robotics-inventory.git
cd vex-robotics-inventory

# 2. Install packages
bun install
# or: npm install

# 3. Start Express + Vite on http://localhost:3000
bun run dev
# or: npm run dev
```

### Scripts

| Command | What It Runs |
|:---|:---|
| `bun run dev` | Full-stack Express + Vite server on port `3000` |
| `bun run lint` | TypeScript check (`tsc --noEmit`) |
| `bun run build` | Production Vite build into `dist/` |
| `bun run start` | Production Express server |
| `bun run create:qr-badges` | Regenerates QR badge PNGs in `public/qr_badges/` |

---

## Google Sheets Sync

When connected to Google Sheets, the app uses a **LOGS-only** setup so your formula-driven category tabs are never overwritten:

- **`doGet(e)`**: Reads your hardware tabs (`OPTICAL`, `DISTANCE`, `INERTIAL`, `ROTATIONAL`, `SOLENOIDS`, `RADIO`, `BRAIN`) and `LOGS` tab.
- **`doPost(e)`**: Appends a single row to `LOGS` (`Timestamp`, `Item ID`, `Action`, `Team`, `Notes`, `Borrower Email`, `Category`, `Number`).

<details>
<summary><strong>Step-by-step Google Apps Script setup &amp; API endpoints</strong></summary>

1. Open your club Google Sheet and go to **Extensions > Apps Script**.
2. In the web app, sign into **Admin Mode**, open **Settings > Backend Code**, and copy the `Code.gs` script.
3. Click **Deploy > New deployment > Web app**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Paste the `/exec` URL into **Settings > API Endpoint** and click **Connect & Sync**.

| Endpoint | Method | Purpose |
|:---|:---:|:---|
| `/api/health` | `GET` | Health & ping check (`{ status: "ok", timestamp }`) |
| `/api/sync` | `GET` | Fetches and sanitizes inventory & log rows from `?url=<GAS_EXEC_URL>` |
| `/api/action` | `POST` | Validates and posts a checkout/return row to Google Apps Script |

</details>

---

## Project Structure

<details>
<summary><strong>Click to expand repository layout</strong></summary>

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml          # Structured bug report form
│   │   ├── feature_request.yml     # Feature proposal form
│   │   └── config.yml              # Issue chooser configuration
│   ├── workflows/
│   │   └── ci.yml                  # Automated Bun install, TypeScript check, build & server check
│   ├── dependabot.yml              # Weekly npm & GitHub Actions dependency updates
│   └── pull_request_template.md    # Pre-merge checklist
├── public/                         # Club logos, favicon.ico, and generated QR badges
├── src/
│   ├── components/
│   │   ├── ActivityLogs.tsx        # Searchable checkout/return history + CSV export
│   │   ├── AdminUnlockModal.tsx    # PIN / email admin sign-in modal
│   │   ├── CheckInOutModal.tsx     # Check out / check in modal & bottom sheet
│   │   ├── ClubAssetsModal.tsx     # Club logos & QR badge downloads
│   │   ├── CommandCenter.tsx       # Overview dashboard, quick finder & drilldowns
│   │   ├── CompetitionPackList.tsx # Pit box packing list & low-stock alerts
│   │   ├── Header.tsx              # Desktop header navigation & quick tools
│   │   ├── InventoryBrowser.tsx    # Desktop table, filters, bulk actions & CSV export
│   │   ├── KeyboardShortcutsModal.tsx # Keyboard shortcuts reference modal
│   │   ├── MobileBottomNav.tsx     # Mobile bottom navigation bar
│   │   ├── MobileInventoryList.tsx # Mobile expandable part cards
│   │   ├── MobileTopHeader.tsx     # Compact mobile header & drawer
│   │   ├── MotionPrimitives.tsx    # Spring pill tabs, spotlight cards & gauges
│   │   ├── SettingsModal.tsx       # Google Sheet URL, admin PIN/emails & Code.gs
│   │   ├── SystemDiagnosticsModal.tsx # App status, cache usage & connection test
│   │   ├── TeamLookup.tsx          # Per-team parts breakdown & batch returns
│   │   └── Toast.tsx               # Toast notifications
│   ├── data/
│   │   ├── mockInventory.ts        # Starter 279-part inventory & pack list
│   │   └── vexSpecs.ts             # VEX V5 part specs & manual rules
│   ├── services/
│   │   ├── sheetApi.ts             # Proxy/direct Google Sheets client & Code.gs
│   │   └── soundFx.ts              # Web Audio sound effects
│   ├── App.tsx                     # Root state, routing, shortcuts & layout switcher
│   ├── index.css                   # Tailwind v4 theme, animations & print styles
│   └── types.ts                    # Shared types, ID normalizer & classifiers
├── create_qr_badges.mjs            # QR badge image generator script
├── server.ts                       # Express proxy + Vite/static server (port 3000)
├── CONTRIBUTING.md                 # Development & style guidelines
├── SECURITY.md                     # Security notes & reporting policy
└── LICENSE                         # MIT License
```

</details>

---

## Contributing & Security

- **Contributing**: See [`CONTRIBUTING.md`](CONTRIBUTING.md) for code style, color tokens, ID rules, and verification commands.
- **Security**: See [`SECURITY.md`](SECURITY.md) for proxy URL rules, admin boundaries, and vulnerability reporting.

---

## Credits & License

Built by **Trishanth Yakkala** for **VEX Robotics Team 654**.  
Released under the [MIT License](LICENSE).
