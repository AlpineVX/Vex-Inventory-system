# VEX Robotics Fleet & Inventory Command Center

<div align="center">

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Procedural_FX-ea580c?style=for-the-badge&logo=waveform&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![VEX Robotics](https://img.shields.io/badge/VEX_Robotics-V5_Ecosystem-dc2626?style=for-the-badge&logo=robot&logoColor=white)](https://www.vexrobotics.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**An industrial, real-time fleet telemetrics and hardware custody command center engineered for multi-team VEX Robotics competition clubs (Teams 654A–654V).**

[Live Application](https://vex-robotics-inventory.ai.studio/) • [System Architecture](#system-architecture) • [Hardware Specifications](#supported-vex-hardware-telemetry) • [Quick Start](#getting-started) • [Sheets Integration](#google-apps-script-enterprise-integration)

</div>

---

## Executive Overview

Developed over 200+ hours of competition pit operations and mechanical engineering requirements, **VEX Robotics Inventory Control** replaces ad-hoc spreadsheets, lost equipment, and tournament check-in friction with a sub-second, military-clean logistics platform.

Designed specifically around the **VEX V5 ecosystem**, the system bridges physical pit cabinets (Brain, Radio, Optical, Distance, Inertial, Rotational, and Pneumatics) with real-time digital custody tracking, automated Google Sheets sync, procedural Web Audio ergonomics, and official tournament custody inspection sheets.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   VEX ROBOTICS CLUB 654 COMMAND CENTER                           │
│                                                                                  │
│   TOTAL ITEMS       AVAILABLE STOCK    ACTIVE DEPLOYMENT   UTILIZATION           │
│   178 Units         123 in Cabinets    55 on Robots        31% Fleet Rate        │
│                                                                                  │
│   OVERDUE ALERTS    AUDIT LOGS         ACTIVE BORROWERS    MAINTENANCE           │
│   0 Flagged         207 Transactions   8 Teams Active      2 Flagged Units       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Capabilities

### ⚡ Rapid-Fire Borrower Kiosk
- **Self-Service Checkout & Return**: Single-click component selection (Type + Part Number stepper) eliminating typing fatigue in pit conditions.
- **Strict Accountability Guardrails**: Enforces student borrower email capture (`@ltisdschools.net` or school domain) and club team routing (`654A`, `654B`, `654C`, `654D`, `654E`, `654H`, `654J`, `654M`, `654S`, `654T`, `654V`).
- **Smart ID Normalization**: Automatically maps freehand input like `sol 1`, `4`, `DIST-4`, or `VEX-DIST-004` to standardized VEX catalog identifiers.

### 🔬 Authentic VEX V5 Telemetry Registry
- Built-in hardware specifications for all core VEX components:
  - **V5 Robot Brain (`276-4810`)**: Dual Cortex-A9 @ 667 MHz, 21 Smart Ports, 8 3-Wire ports (`<R11>`).
  - **V5 Robot Radio (`276-4831`)**: 2.4 GHz DSSS frequency hopping, VEXnet 3.0 / Bluetooth 4.2 (`<R11>`).
  - **Optical Sensor (`276-4833`)**: Ambient lux, RGBC classification, gesture tracking @ 100 Hz (`<R13>`).
  - **Distance Sensor (`276-4834`)**: Class 1 940nm VCSEL Time-of-Flight ToF rangefinder (`<R13>`).
  - **Inertial Sensor (`276-4840`)**: 6-DOF IMU with onboard Kalman filter, 3-axis gyro & accelerometer (`<R13>`).
  - **Rotational Sensor (`276-6010`)**: 4,096 tick/rev magnetic encoder for autonomous dead-wheel pods (`<R13>`).
  - **Pneumatics Solenoids (`276-8140`)**: 5/2 SMC solenoid valves with 100 PSI working limit (`<R12>`).

### 🔊 Procedural Web Audio Synthesis Engine
- Zero external audio files or network requests. Synthesizes mechanical clicks, double-frequency notification chirps, and dual-tone harmonic chimes in real time using the browser's native **Web Audio API** (`AudioContext`).
- Fully accessible with a one-click header mute toggle (`Key M`) and persistent `localStorage` synchronization.

### 🛡️ System Architecture & Telemetry Inspector
- Interactive diagnostics modal (`Key D` or Activity icon):
  - **Real-time byte consumption**: Monitors UTF-16 storage utilization across `localStorage` buckets.
  - **SHA-256 State Integrity Hash**: Cryptographically computes state consistency across client sessions.
  - **Round-Trip Latency Benchmark**: Live HTTP ping diagnostics to the backend proxy.
  - **Telemetry Export**: One-click JSON snapshot download for club leadership and mentor audits.

### 🖨️ Tournament Competition Custody Manifest
- Clean print stylesheet (`@media print` / `Ctrl+P` / `Key P`) that converts the dark-mode dashboard into an official high-contrast, black-and-white physical equipment manifest ready for tournament check-in inspectors and pit tables.

### ⌨️ Power-User Keyboard Command System
| Key | Action | Description |
|:---:|:---|:---|
| `1` | **Command Center** | Jump directly to fleet overview KPIs and telemetry |
| `2` | **Inventory Browser** | Browse catalog, search part IDs, and filter by cabinet |
| `3` | **Team Allocations** | View equipment held across all 11 competition teams |
| `4` | **Competition Pack List** | Check pit box spare quotas and tournament travel readiness |
| `5` | **Audit Logs** | Trace chronological chain of custody and deployment notes |
| `C` | **Check Out / In** | Launch self-service borrower station |
| `D` | **Diagnostics** | Open system telemetry, storage bytes & SHA-256 verification |
| `P` | **Print Manifest** | Generate referee-ready tournament custody printout |
| `M` | **Toggle Audio** | Enable or mute procedural Web Audio sound feedback |
| `?` | **Shortcuts** | Open keyboard hotkeys cheatsheet dialog |
| `Esc` | **Dismiss** | Close active modals, drawers, or notifications |

---

## System Architecture

```
                                  USER INTERFACE
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │  Dashboard KPIs  │  Catalog Browser  │  Team Lookups  │  Pack Lists  │  Audit Logs     │
 └──────────────┬─────────────────────────────┬─────────────────────────────┬─────────────┘
                │                             │                             │
                ▼                             ▼                             ▼
 ┌──────────────────────────┐  ┌──────────────────────────┐  ┌────────────────────────────┐
 │  Web Audio Synthesizer   │  │  Hardware Spec Registry  │  │  Power-User Hotkey Bus     │
 │  (Procedural Oscillators)│  │  (Official VEX V5 Specs) │  │  (Global Window Listener)  │
 └──────────────────────────┘  └──────────────────────────┘  └────────────────────────────┘
                │                             │                             │
                └─────────────────────────────┼─────────────────────────────┘
                                              ▼
                             ┌──────────────────────────────────┐
                             │    Reactive State Coordinator    │
                             │ (Normalized VEX IDs & Filtering) │
                             └────────────────┬─────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │ Local Storage Cache     │                     │ Express Gateway Proxy   │
         │ - Sub-1ms Read/Write    │                     │ - /api/sync & /api/logs │
         │ - SHA-256 State Hash    │                     │ - Request Sanitization  │
         │ - Offline Resilience    │                     │ - Health Ping Benchmark │
         └─────────────────────────┘                     └────────────┬────────────┘
                                                                      │
                                                                      ▼
                                                         ┌─────────────────────────┐
                                                         │ Google Apps Script API  │
                                                         │ - REST /exec Endpoint   │
                                                         │ - Google Sheets Storage │
                                                         │ - Concurrent Locking    │
                                                         └─────────────────────────┘
```

---

## Supported VEX Hardware Telemetry

| Component Category | Official Part # | Bus Interface / Protocol | Operating Range / Tolerance | Game Manual Rule |
|:---|:---:|:---|:---|:---:|
| **V5 Brain** | `276-4810` | Dual Cortex-A9 / VEXos / RS-485 | 7.2V – 12.8V Li-ion Smart Battery | `<R11>` Max 1 per robot |
| **V5 Radio** | `276-4831` | 2.4 GHz DSSS / VEXnet 3.0 / BLE | 16 RF channels, dynamic hopping | `<R11>` Direct line of sight |
| **Optical Sensor** | `276-4833` | V5 Smart Port (RS-485 bidirectional) | 10 mm – 100 mm proximity, 100 Hz | `<R13>` Legal Smart sensor |
| **Distance Sensor** | `276-4834` | V5 Smart Port (Class 1 Laser ToF) | 20 mm – 2,000 mm (VCSEL 940nm) | `<R13>` Class 1 IEC 60825-1 |
| **Inertial Sensor** | `276-4840` | V5 Smart Port (20-bit internal rate gyro) | ±2,000°/s 3-Axis Gyro & ±8G Accel | `<R13>` Rigid chassis mount |
| **Rotational Sensor**| `276-6010` | V5 Smart Port (Magnetic Encoder) | 360° continuous, 4,096 ticks/rev | `<R13>` Dead-wheel tracking |
| **Pneumatics Solenoid**| `276-8140`| V5 3-Wire / PCM Driver (5V DC) | 0 – 100 PSI (690 kPa), 12ms shift | `<R12>` Max 100 PSI working |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) *(recommended, `bun.lock` provided)* or **Node.js (v18+)**
- Modern evergreen browser supporting the Web Audio API and ES2022

### Quick Install

```bash
# Clone the repository
git clone https://github.com/your-organization/vex-robotics-inventory.git
cd vex-robotics-inventory

# Install dependencies
bun install
# or: npm install

# Start development server
bun run dev
# or: npm run dev
```

Open `http://localhost:3000` in your browser. The Express server serves Vite with hot-module reloading and hosts the backend API proxy at `/api/*`.

### Build & Verification Commands

| Command | Description |
|:---|:---|
| `bun run dev` | Launch local full-stack server on port 3000 with HMR |
| `bun run build` | Produce optimized, tree-shaken production bundle in `dist/` |
| `bun run lint` | Run strict TypeScript validation without emitting (`tsc --noEmit`) |
| `bun run start` | Run production Express server hosting built assets |
| `bun run create:qr-badges` | Recompile high-resolution QR badge assets for physical pit storage |

---

## Google Apps Script Enterprise Integration

The application operates out of the box with realistic seed telemetry. To connect your club's live Google Sheet, follow these steps:

1. Create a new Google Sheet with two tabs: `Inventory` and `AuditLogs`.
2. Open **Extensions > Apps Script** and deploy the following web app handler:

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName("Inventory");
  var logSheet = ss.getSheetByName("AuditLogs");

  var invData = invSheet ? invSheet.getDataRange().getValues() : [];
  var logData = logSheet ? logSheet.getDataRange().getValues() : [];

  var headers = invData[0] || [];
  var items = [];
  for (var i = 1; i < invData.length; i++) {
    var row = invData[i];
    items.push({
      itemId: row[0],
      itemName: row[1],
      category: row[2],
      location: row[3],
      status: row[4],
      currentUser: row[5],
      notes: row[6],
      lastUpdated: row[7]
    });
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    items: items,
    logs: []
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var invSheet = ss.getSheetByName("Inventory");
    var logSheet = ss.getSheetByName("AuditLogs");

    // Perform check-in or checkout row update
    // Append audit record to logSheet
    logSheet.appendRow([
      new Date().toISOString(),
      payload.action,
      payload.itemId,
      payload.team,
      payload.email,
      payload.notes
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Transaction logged successfully"
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Deploy as a **Web App** (Execute as: *Me*, Who has access: *Anyone*).
4. In the VEX Inventory web app, open **Settings (`Admin`)** and paste your Web App URL. The client will immediately execute a verification test and handshake.

---

## Security & Best Practices

- **Zero-Secret Client**: No private API keys or database passwords are ever exposed in client bundles.
- **Student Email Privacy**: Email addresses are collected solely for pit equipment accountability and forwarded over HTTPS directly to the club's authorized Sheets endpoint.
- **Admin Lock Protection**: Critical settings, bulk imports, and sheet re-links require PIN authentication or verified administrator credentials.

---

## Contributing

Contributions from VEX Robotics mentors, coaches, and team builders are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for details on code style, commit standards, and pull request procedures.

---

## License

This project is open source and licensed under the [MIT License](LICENSE).
Copyright © 2024–2026 VEX Robotics Competition Team 654.
