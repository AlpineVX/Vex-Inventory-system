import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { normalizeItemId, classifyVexCategory } from '../src/types';
import { generateDefaultInventory, INITIAL_LOGS } from '../src/data/mockInventory';
import { saveStoredApiUrl, getStoredApiUrl, DEFAULT_GAS_URL } from '../src/services/sheetApi';
import { CommandCenter } from '../src/components/CommandCenter';
import { InventoryBrowser } from '../src/components/InventoryBrowser';
import { MobileInventoryList } from '../src/components/MobileInventoryList';
import { TeamLookup } from '../src/components/TeamLookup';
import { CompetitionPackList } from '../src/components/CompetitionPackList';
import { ActivityLogs } from '../src/components/ActivityLogs';
import { CheckInOutModal } from '../src/components/CheckInOutModal';
import { LabelPrinterModal } from '../src/components/LabelPrinterModal';
import { ToastContainer } from '../src/components/Toast';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`Verification failed: ${message}`);
  }
}

function testPartIdNormalization(): void {
  assert(normalizeItemId('sol 1') === 'VEXSOL-1', 'sol 1 -> VEXSOL-1');
  assert(normalizeItemId('4', 'Distance') === 'VEXS-DIST-4', '4 + Distance -> VEXS-DIST-4');
  assert(normalizeItemId('DIST-4') === 'VEXS-DIST-4', 'DIST-4 -> VEXS-DIST-4');
  assert(normalizeItemId('VEX-DIST-004') === 'VEXS-DIST-4', 'VEX-DIST-004 -> VEXS-DIST-4');
  assert(normalizeItemId('brain #2') === 'VEXB-2', 'brain #2 -> VEXB-2');
  assert(normalizeItemId('opt3') === 'VEXS-O-3', 'opt3 -> VEXS-O-3');
  assert(normalizeItemId('rot-5') === 'VEXS-ROT-5', 'rot-5 -> VEXS-ROT-5');
  assert(normalizeItemId('iner 2') === 'VEXS-INER-2', 'iner 2 -> VEXS-INER-2');

  assert(classifyVexCategory(undefined, undefined, 'VEXSOL-1') === 'Solenoids', 'VEXSOL-1 category');
  assert(classifyVexCategory(undefined, undefined, 'VEXS-DIST-4') === 'Distance', 'VEXS-DIST-4 category');
  assert(classifyVexCategory(undefined, undefined, 'VEXB-2') === 'Brain', 'VEXB-2 category');
}

function testStorageAndDisconnectPersistence(): void {
  const store: Record<string, string> = {};
  (globalThis as Record<string, unknown>).window = {};
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };

  assert(getStoredApiUrl() === DEFAULT_GAS_URL, 'Default URL on first visit');
  saveStoredApiUrl('');
  assert(getStoredApiUrl() === '', 'Explicit disconnect persists across reloads');
  saveStoredApiUrl(DEFAULT_GAS_URL);
  assert(getStoredApiUrl() === DEFAULT_GAS_URL, 'Reconnect restores URL');

  // Ensure corrupted pack list storage does not crash CompetitionPackList
  store['vex_pack_list_state'] = '{"corrupt":true}';
}

function testSsrViews(): void {
  const items = generateDefaultInventory();
  assert(items.length === 179, `Expected 179 starter parts, got ${items.length}`);

  const logs = INITIAL_LOGS;
  const noop = () => {};

  const renders: Array<[string, string]> = [
    [
      'CommandCenter',
      renderToString(
        React.createElement(CommandCenter, {
          items,
          logs,
          onNavigateToCategory: noop,
          onNavigateToTeam: noop,
          onNavigateTab: noop,
          onOpenCheckout: noop,
          isMobileMode: false,
        })
      ),
    ],
    [
      'InventoryBrowser (Desktop)',
      renderToString(
        React.createElement(InventoryBrowser, {
          items,
          logs,
          selectedCategory: 'All',
          onSelectCategory: noop,
          onOpenCheckout: noop,
          isMobileMode: false,
        })
      ),
    ],
    [
      'MobileInventoryList',
      renderToString(
        React.createElement(MobileInventoryList, {
          items,
          logs,
          selectedCategory: 'All',
          onSelectCategory: noop,
          onOpenCheckout: noop,
          isAdmin: false,
          onOpenAdminUnlock: noop,
        })
      ),
    ],
    [
      'TeamLookup (Desktop)',
      renderToString(
        React.createElement(TeamLookup, {
          items,
          selectedTeam: '654V',
          onSelectTeam: noop,
          onOpenCheckout: noop,
          onReturnItem: noop,
          onReturnAllForTeam: noop,
          isMobileMode: false,
        })
      ),
    ],
    [
      'TeamLookup (Mobile)',
      renderToString(
        React.createElement(TeamLookup, {
          items,
          selectedTeam: '654V',
          onSelectTeam: noop,
          onOpenCheckout: noop,
          onReturnItem: noop,
          onReturnAllForTeam: noop,
          isMobileMode: true,
        })
      ),
    ],
    [
      'CompetitionPackList',
      renderToString(React.createElement(CompetitionPackList, { items })),
    ],
    [
      'ActivityLogs (Desktop)',
      renderToString(React.createElement(ActivityLogs, { logs, isMobileMode: false })),
    ],
    [
      'ActivityLogs (Mobile)',
      renderToString(React.createElement(ActivityLogs, { logs, isMobileMode: true })),
    ],
    [
      'CheckInOutModal',
      renderToString(
        React.createElement(CheckInOutModal, {
          isOpen: true,
          onClose: noop,
          items,
          onSubmit: async () => {},
        })
      ),
    ],
    [
      'LabelPrinterModal',
      renderToString(
        React.createElement(LabelPrinterModal, {
          isOpen: true,
          onClose: noop,
          items,
        })
      ),
    ],
    [
      'ToastContainer',
      renderToString(
        React.createElement(ToastContainer, {
          toasts: [{ id: 'test-1', type: 'success', title: 'Saved' }],
          onDismiss: noop,
        })
      ),
    ],
  ];

  for (const [label, html] of renders) {
    assert(html.length > 0, `${label} rendered empty output`);
  }
}

function testRepositoryGuardrails(): void {
  const root = process.cwd();
  const requiredFiles = [
    '.env.example',
    'public/favicon.ico',
    'public/lake_travis_logo_transparent.png',
    'public/assets/aistudio/lt_logo_transparent.png',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/apple-touch-icon.png',
  ];

  for (const rel of requiredFiles) {
    assert(fs.existsSync(path.join(root, rel)), `Missing required asset: ${rel}`);
  }

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full));
      } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  };

  for (const filePath of walk(path.join(root, 'src'))) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert(!/\b(emerald|green)-[0-9]{2,3}\b/.test(content), `Disallowed green/emerald class in ${filePath}`);
    assert(!/\bwindow\.(alert|confirm|open)\s*\(/.test(content), `Disallowed browser dialog in ${filePath}`);
  }
}

testPartIdNormalization();
testStorageAndDisconnectPersistence();
testSsrViews();
testRepositoryGuardrails();

console.log('All VEX 654 Inventory checks passed.');
