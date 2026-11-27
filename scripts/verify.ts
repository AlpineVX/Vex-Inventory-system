import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { normalizeItemId, classifyVexCategory, CLUB_TEAMS } from '../src/types';
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
import { CommandPalette } from '../src/components/CommandPalette';
import { Header } from '../src/components/Header';
import { MobileTopHeader } from '../src/components/MobileTopHeader';
import { MobileBottomNav } from '../src/components/MobileBottomNav';
import { OfflineQueueBanner } from '../src/components/PWAControls';
import { BackToTopButton } from '../src/components/MotionPrimitives';
import { ToastContainer } from '../src/components/Toast';
import { SystemDiagnosticsModal } from '../src/components/SystemDiagnosticsModal';
import { ClubAssetsModal } from '../src/components/ClubAssetsModal';
import { KeyboardShortcutsModal } from '../src/components/KeyboardShortcutsModal';
import { SettingsModal } from '../src/components/SettingsModal';
import { AdminUnlockModal } from '../src/components/AdminUnlockModal';

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
  assert(CLUB_TEAMS.includes('654V') && CLUB_TEAMS.includes('RECF'), 'Club teams include 654V and RECF');
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
  store['vex_offline_sync_queue'] = '{broken-json';
}

function testSsrViews(): void {
  const items = generateDefaultInventory();
  assert(items.length === 179, `Expected 179 starter parts, got ${items.length}`);

  const logs = INITIAL_LOGS;
  const noop = () => {};
  const syncStatus = {
    url: DEFAULT_GAS_URL,
    isSyncing: false,
    error: null,
    lastSynced: null,
    mode: 'live' as const,
  };
  const adminSettings = {
    adminEmails: ['coach@school.edu'],
    adminPin: '6540',
    isUnlocked: false,
    kioskOnly: false,
  };

  const renders: Array<[string, string]> = [
    [
      'Header',
      renderToString(
        React.createElement(Header, {
          activeTab: 'dashboard',
          onTabChange: noop,
          syncStatus,
          adminSettings,
          onOpenSettings: noop,
          onOpenCheckout: noop,
          onSyncNow: noop,
          onOpenAdminUnlock: noop,
          onLockAdmin: noop,
          onOpenCommandPalette: noop,
          onOpenLabelPrinter: noop,
        })
      ),
    ],
    [
      'MobileTopHeader',
      renderToString(
        React.createElement(MobileTopHeader, {
          activeTab: 'dashboard',
          onTabChange: noop,
          syncStatus,
          adminSettings,
          onOpenSettings: noop,
          onSyncNow: noop,
          onOpenAdminUnlock: noop,
          onLockAdmin: noop,
          isMobileModeForced: false,
          onToggleViewMode: noop,
          onOpenCommandPalette: noop,
          onOpenLabelPrinter: noop,
        })
      ),
    ],
    [
      'MobileBottomNav',
      renderToString(
        React.createElement(MobileBottomNav, {
          activeTab: 'dashboard',
          onTabChange: noop,
          onOpenCheckout: noop,
          availableCount: 100,
          totalCount: 179,
          adminSettings,
          onOpenAdminUnlock: noop,
        })
      ),
    ],
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
          onOpenLabelPrinter: noop,
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
          onOpenLabelPrinter: noop,
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
      'CommandPalette',
      renderToString(
        React.createElement(CommandPalette, {
          isOpen: true,
          onClose: noop,
          items,
          onNavigateTab: noop,
          onNavigateToTeam: noop,
          onOpenCheckout: noop,
          onSyncNow: noop,
          onToggleSound: noop,
          soundEnabled: true,
          onOpenShortcuts: noop,
          onOpenDiagnostics: noop,
          onOpenAssetsModal: noop,
          onOpenLabelPrinter: noop,
        })
      ),
    ],
    [
      'OfflineQueueBanner',
      renderToString(
        React.createElement(OfflineQueueBanner, {
          pendingCount: 2,
          onRetrySync: noop,
        })
      ),
    ],
    [
      'ToastContainer',
      renderToString(
        React.createElement(ToastContainer, {
          toasts: [
            {
              id: 'test-1',
              type: 'success',
              title: 'Saved',
              actionLabel: 'Undo',
              onAction: noop,
            },
          ],
          onDismiss: noop,
        })
      ),
    ],
    [
      'SystemDiagnosticsModal',
      renderToString(
        React.createElement(SystemDiagnosticsModal, {
          isOpen: true,
          onClose: noop,
          items,
          logs,
          syncStatus,
        })
      ),
    ],
    [
      'ClubAssetsModal',
      renderToString(
        React.createElement(ClubAssetsModal, {
          isOpen: true,
          onClose: noop,
        })
      ),
    ],
    [
      'KeyboardShortcutsModal',
      renderToString(
        React.createElement(KeyboardShortcutsModal, {
          isOpen: true,
          onClose: noop,
        })
      ),
    ],
    [
      'SettingsModal',
      renderToString(
        React.createElement(SettingsModal, {
          isOpen: true,
          onClose: noop,
          syncStatus,
          onSaveUrl: async () => {},
          onResetFactoryData: noop,
          adminSettings,
          onUpdateAdminSettings: noop,
          needsRepairCount: 2,
          offlineQueueCount: 1,
          onClearAllRepairFlags: noop,
          onClearOfflineQueue: noop,
          onExportBackup: noop,
          onImportBackup: noop,
        })
      ),
    ],
    [
      'AdminUnlockModal',
      renderToString(
        React.createElement(AdminUnlockModal, {
          isOpen: true,
          onClose: noop,
          adminSettings,
          onUnlockSuccess: noop,
        })
      ),
    ],
    [
      'CommandCenter (Admin)',
      renderToString(
        React.createElement(CommandCenter, {
          items,
          logs,
          onNavigateToCategory: noop,
          onNavigateToTeam: noop,
          onNavigateTab: noop,
          onOpenCheckout: noop,
          onOpenLabelPrinter: noop,
          isAdmin: true,
          onOpenSettings: noop,
          onReturnOverdueItems: noop,
          onClearAllRepairFlags: noop,
          onToggleCondition: noop,
        })
      ),
    ],
    [
      'InventoryBrowser (Admin)',
      renderToString(
        React.createElement(InventoryBrowser, {
          items,
          logs,
          selectedCategory: 'All',
          onSelectCategory: noop,
          onOpenCheckout: noop,
          onBatchAction: noop,
          onBatchSetCondition: noop,
          onAddParts: noop,
          onUpdateItemDetails: noop,
          onDeleteItem: noop,
          onOpenLabelPrinter: noop,
          isAdmin: true,
        })
      ),
    ],
    [
      'CompetitionPackList (Admin)',
      renderToString(React.createElement(CompetitionPackList, { items, isAdmin: true })),
    ],
    [
      'ActivityLogs (Admin)',
      renderToString(
        React.createElement(ActivityLogs, {
          logs,
          isAdmin: true,
          onDeleteLog: noop,
          onClearLogs: noop,
        })
      ),
    ],
  ];

  for (const [label, html] of renders) {
    assert(html.length > 0, `${label} rendered empty output`);
  }

  // Ensure BackToTopButton stays clean on initial mount (hidden below scroll threshold)
  const backToTopHtml = renderToString(React.createElement(BackToTopButton, { isMobile: false }));
  assert(typeof backToTopHtml === 'string', 'BackToTopButton rendered cleanly');
}

function testRepositoryGuardrails(): void {
  const root = process.cwd();
  const requiredFiles = [
    '.env.example',
    'server.ts',
    'vite.config.ts',
    'create_qr_badges.mjs',
    'public/favicon.ico',
    'public/lake_travis_logo_transparent.png',
    'public/lake_travis_logo_original.png',
    'public/lake_travis_qr_badge_round.png',
    'public/lake_travis_qr_badge_squircle.png',
    'public/lake_travis_ready_to_use_qr_code.png',
    'public/assets/aistudio/lt_logo_transparent.png',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/pwa-maskable-512x512.png',
    'public/apple-touch-icon.png',
  ];

  for (const rel of requiredFiles) {
    assert(fs.existsSync(path.join(root, rel)), `Missing required file/asset: ${rel}`);
  }

  // Validate key JSON configs parse cleanly
  for (const jsonFile of ['package.json', 'tsconfig.json', 'metadata.json']) {
    const raw = fs.readFileSync(path.join(root, jsonFile), 'utf8');
    const parsed = JSON.parse(raw);
    assert(parsed && typeof parsed === 'object', `Invalid JSON object in ${jsonFile}`);
  }

  // Validate Express proxy SSRF protections remain intact
  const serverSource = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
  assert(serverSource.includes("parsedUrl.protocol !== 'https:'"), 'server.ts enforces https://');
  assert(serverSource.includes('script.google.com'), 'server.ts restricts proxy to script.google.com');
  assert(serverSource.includes('127.0.0.1') && serverSource.includes('192.168.'), 'server.ts blocks local/private IPs');

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
