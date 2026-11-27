# Google Sheets & Apps Script Setup

This guide explains how coaches and club leads connect **VEX Robotics Team 654 Inventory** to a live Google Sheet without risking accidental formula overwrites.

---

## How Syncing Works (`LOGS`-Only Design)

Many club spreadsheets use Google Sheets formulas across individual hardware tabs (`OPTICAL`, `DISTANCE`, `INERTIAL`, `ROTATIONAL`, `SOLENOIDS`, `RADIO`, `BRAIN`) to compute each part's current holder and availability from a master `LOGS` ledger.

To protect those formulas:

- **`GET /api/sync`** forwards a read request (`doGet`) to your deployed Google Apps Script Web App URL and reads all hardware tabs plus recent rows from `LOGS`.
- **`POST /api/action`** appends a single row (`doPost`) **only to the `LOGS` tab**:

| Column | Field | Example |
|:---|:---|:---|
| `Timestamp` | ISO 8601 date/time | `2026-11-27T18:45:00.000Z` |
| `Item ID` | Canonical VEX ID | `VEXSOL-1` |
| `Action` | `Check Out` or `Check In` | `Check Out` |
| `Team` | Club team code | `654V` |
| `Notes` | Subsystem or condition note | `Pneumatics clamp actuator` |
| `Borrower Email` | Student school email (optional for admin) | `student@school.org` |
| `Category` | Normalized hardware category | `Solenoids` |
| `Number` | Extracted part number | `1` |

Formula-driven hardware tabs are **never modified directly**.

---

## Step-by-Step Deployment

1. Open your Club 654 inventory Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Open the web app, unlock **Admin Mode**, open **Google Sheet & Admin Settings > Backend Code**, and copy the generated `Code.gs` script.
4. Paste `Code.gs` into the Apps Script editor and save (`Ctrl+S` / `⌘S`).
5. Click **Deploy > New deployment**.
6. Under **Select type**, pick **Web app**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
7. Click **Deploy**, authorize the script for your Google account, and copy the Web App URL ending in **`/exec`**.
8. In the web app, go to **Settings > API Endpoint**, paste the `/exec` URL, and click **Save & Sync**.

> **Important:** Always paste the deployed `/exec` URL (`https://script.google.com/macros/s/.../exec`), not the `docs.google.com/spreadsheets/...` sheet link or `/edit` script URL.

---

## Offline Queue & Background Sync

- If a tablet or laptop loses Wi-Fi inside a tournament venue, checkouts and returns are saved immediately in local browser storage (`vex_offline_sync_queue`) and shown in the pending sync banner.
- As soon as Wi-Fi returns (or when you tap **Sync Now**), pending entries replay sequentially through `/api/action` and refresh the live table.
- Disconnecting the Google Sheet URL in **Settings** persists across page reloads (`localStorage.vex_inventory_gas_url = "__DISCONNECTED__"`) until an admin reconnects manually.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|:---|:---|:---|
| `Authentication required by Google` | Apps Script access set to `Only myself` | Re-deploy or edit deployment and set **Who has access** to **`Anyone`**. |
| `You entered the Google Sheet spreadsheet link` | Pasted `docs.google.com` link instead of Web App URL | Open **Deploy > Manage deployments** in Apps Script and copy the `/exec` URL. |
| `Script function not found` | Missing `doGet()` or `doPost()` in Apps Script | Copy the latest `Code.gs` from **Settings > Backend Code**, save, and deploy a **New version**. |
| Items synced, but a part shows `Needs Repair` | Local pit repair flag persisted | Repair flags intentionally survive sync merges; clear the flag from the **Part Details** drawer or **Needs Repair** badge. |
