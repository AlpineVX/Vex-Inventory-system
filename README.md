# VEX Inventory System

A responsive inventory-control application for VEX Robotics teams. It helps teams
track hardware, check items in and out, view team allocations, assemble competition
packs, and review activity history. The app works with its built-in sample inventory
and can synchronize with a Google Apps Script web app backed by Google Sheets.

## Live app

Visit [vex-robotics-inventory.ai.studio](https://vex-robotics-inventory.ai.studio/).

## Features

- Browse, search, filter, and export VEX inventory.
- Check items in and out with team, user, and notes metadata.
- View team allocations, competition pack status, and activity logs.
- Use a phone-friendly or desktop layout.
- Cache inventory and logs in the browser for continued local use.
- Synchronize inventory and actions through a Google Apps Script endpoint.

## Tech stack

- React 19 and TypeScript
- Vite and Tailwind CSS
- Express server for local development, production static serving, and Sheets proxying
- Google Apps Script / Google Sheets integration (optional)

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (the repository includes `bun.lock`), or a recent Node.js
  release with a package manager such as npm.
- A Google Apps Script web-app URL only when live Sheets synchronization is needed.

### Install and run

```bash
bun install
bun run dev
```

The app is available at `http://localhost:3000` by default. The `dev` command starts
the Express server, which in turn serves Vite with hot-module reloading.

If using npm instead:

```bash
npm install
npm run dev
```

### Common commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server. |
| `bun run build` | Build the production client into `dist/`. |
| `bun run start` | Serve the app using the Express server. |
| `bun run lint` | Type-check the project without emitting files. |
| `bun run preview` | Preview a Vite production build. |
| `bun run clean` | Remove generated build output. |
| `bun run create:qr-badges` | Regenerate QR badge image assets. |

## Google Sheets synchronization

The application runs in sample-data mode when a live endpoint is unavailable. To
enable synchronization, deploy a Google Apps Script project as a web app and enter
its `/exec` URL through the in-app settings screen. The endpoint must be accessible
to the people using the app.

The app expects the GET response to contain either `inventory` or `items`, plus an
optional `logs` array. Check-in and check-out actions are sent through the same
endpoint by the server-side proxy. The proxy provides clearer errors for common
deployment and permissions mistakes.

> Do not commit a private Sheets URL, credentials, or other secrets. Local browser
> preferences and cached inventory are stored in `localStorage`.

## Configuration

Copy the example environment file only when your deployment needs those values:

```bash
cp .env.example .env
```

`PORT` and `NODE_ENV` are read by the Express server. The included `.env.example`
also documents values used by the original AI Studio deployment workflow; they are
not required for ordinary local development.

## Project structure

```text
src/
  components/     UI views, modals, navigation, and notifications
  data/           Sample inventory and activity data
  services/       Browser cache and Google Apps Script client
  types.ts        Shared domain types and inventory helpers
public/           Team and QR badge assets
server.ts         Express server and Google Apps Script proxy
create_qr_badges.mjs  Asset-generation utility
```

## Asset generation

QR badge source assets live under `public/assets/aistudio/`. To rebuild the derived
files in `public/qr_badges/`, run:

```bash
bun run create:qr-badges
```

This task needs the `sharp` and `qrcode` dependencies installed.

## Notes for maintainers

- Keep generated folders such as `dist/`, `build/`, and `.aistudio/` out of commits.
- Preserve the existing inventory-ID normalization rules when changing sheet parsing.
- There is currently no automated test suite; run `bun run lint` and `bun run build`
  before sharing changes.

## License

No repository-wide license has been selected yet. Add one before distributing the
project outside the team.
