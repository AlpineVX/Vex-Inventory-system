/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  InventoryItem,
  AuditLog,
  VexCategory,
  ActiveTab,
  SyncStatus,
  AdminSettings,
  DEFAULT_ADMIN_EMAILS,
  DEFAULT_ADMIN_PIN,
  getCategoryDefaultLocation,
  normalizeItemId,
} from './types';
import {
  generateDefaultInventory,
  INITIAL_LOGS,
} from './data/mockInventory';
import {
  getStoredApiUrl,
  saveStoredApiUrl,
  getCachedInventory,
  saveCachedInventory,
  getCachedLogs,
  saveCachedLogs,
  getLastSyncTime,
  fetchLiveInventory,
  postInventoryAction,
} from './services/sheetApi';
import { Header } from './components/Header';
import { CommandCenter } from './components/CommandCenter';
import { InventoryBrowser } from './components/InventoryBrowser';
import { TeamLookup } from './components/TeamLookup';
import { CompetitionPackList } from './components/CompetitionPackList';
import { ActivityLogs } from './components/ActivityLogs';
import { CheckInOutModal } from './components/CheckInOutModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminUnlockModal } from './components/AdminUnlockModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // 1. Core State
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const version = typeof window !== 'undefined' ? localStorage.getItem('vex_schema_ver') : null;
    if (version !== 'v7') {
      const fresh = generateDefaultInventory();
      if (typeof window !== 'undefined') {
        localStorage.setItem('vex_schema_ver', 'v7');
      }
      saveCachedInventory(fresh);
      return fresh;
    }
    const cached = getCachedInventory();
    return cached && cached.length > 0 ? cached : generateDefaultInventory();
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const version = typeof window !== 'undefined' ? localStorage.getItem('vex_schema_ver_logs') : null;
    if (version !== 'v4') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vex_schema_ver_logs', 'v4');
      }
      saveCachedLogs(INITIAL_LOGS);
      return INITIAL_LOGS;
    }
    const cached = getCachedLogs();
    return cached && cached.length > 0 ? cached : INITIAL_LOGS;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    const url = getStoredApiUrl();
    return {
      url,
      isSyncing: false,
      error: null,
      lastSynced: getLastSyncTime(),
      mode: url ? 'live' : 'mock',
    };
  });

  // Admin access control state
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vex_admin_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            isUnlocked: false, // Default to locked on startup so regular people can only check out/in
          };
        } catch (e) {
          console.error('Failed to parse admin settings', e);
        }
      }
    }
    return {
      adminEmails: [...DEFAULT_ADMIN_EMAILS],
      adminPin: DEFAULT_ADMIN_PIN,
      isUnlocked: false,
      kioskOnly: false,
    };
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<VexCategory | 'All'>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('654V');

  // Modal states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutTargetItem, setCheckoutTargetItem] = useState<InventoryItem | undefined>(undefined);
  const [checkoutDefaultAction, setCheckoutDefaultAction] = useState<'Check Out' | 'Check In'>('Check Out');
  const [checkoutPresetTeam, setCheckoutPresetTeam] = useState<string>('654V');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAdminUnlockModalOpen, setIsAdminUnlockModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveCachedInventory(items);
  }, [items]);

  useEffect(() => {
    saveCachedLogs(logs);
  }, [logs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vex_admin_settings', JSON.stringify(adminSettings));
    }
  }, [adminSettings]);

  // Live Sync execution
  const handleLiveSync = async (apiUrl: string, showToastOnSuccess = true) => {
    if (!apiUrl) {
      addToast('info', 'Offline Mode Active', 'Using local inventory cache. Configure Google Sheet URL in Settings.');
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const data = await fetchLiveInventory(apiUrl);
      if (data.inventory && data.inventory.length > 0) {
        setItems(data.inventory);
        saveCachedInventory(data.inventory);
      }

      if (data.logs && data.logs.length > 0) {
        // Merge incoming sheet logs with local logs, deduplicating and sorting NEWEST-FIRST
        setLogs((prevLogs) => {
          const map = new Map<string, AuditLog>();

          // Seed with previous logs
          prevLogs.forEach((l) => {
            const key = `${l.timestamp}_${l.itemId}_${l.action}`;
            map.set(key, l);
          });

          // Add newly incoming sheet logs
          data.logs.forEach((l) => {
            const key = `${l.timestamp}_${l.itemId}_${l.action}`;
            map.set(key, l);
          });

          // Sort descending (newest timestamp first so recent checkouts appear at the very top)
          const merged = Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime() || 0;
            const timeB = new Date(b.timestamp).getTime() || 0;
            return timeB - timeA;
          });

          saveCachedLogs(merged);
          return merged;
        });
      }

      const now = new Date();
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSynced: now,
        error: null,
        mode: 'live',
      }));

      if (showToastOnSuccess) {
        addToast(
          'success',
          'Google Sheet Synced',
          `Successfully refreshed ${data.inventory.length} items from live spreadsheet.`
        );
      }
    } catch (err: any) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message,
      }));
      addToast('error', 'Sync Failed', err.message);
    }
  };

  // Sync on initial mount if URL exists
  useEffect(() => {
    if (syncStatus.url) {
      handleLiveSync(syncStatus.url, false);
    }
  }, []);

  // URL save from Settings Modal
  const handleSaveApiUrl = async (newUrl: string) => {
    saveStoredApiUrl(newUrl);
    setSyncStatus((prev) => ({ ...prev, url: newUrl, mode: newUrl ? 'live' : 'mock' }));
    if (newUrl) {
      await handleLiveSync(newUrl, true);
    } else {
      addToast('info', 'Disconnected from Google Sheet', 'Switched back to local inventory storage.');
    }
  };

  // Admin access handlers
  const handleOpenAdminUnlock = () => {
    setIsAdminUnlockModalOpen(true);
  };

  const handleUnlockAdminSuccess = () => {
    setAdminSettings((prev) => ({ ...prev, isUnlocked: true }));
    addToast(
      'success',
      'Admin Privileges Unlocked',
      'You now have full access to spreadsheet API settings, data reset, and admin functions.'
    );
  };

  const handleLockAdmin = () => {
    setAdminSettings((prev) => ({ ...prev, isUnlocked: false }));
    addToast(
      'info',
      'Member Mode Active',
      'Admin privileges locked. Regular checkout and check-in station active.'
    );
  };

  const handleOpenSettingsProtected = () => {
    if (!adminSettings.isUnlocked) {
      setIsAdminUnlockModalOpen(true);
      addToast(
        'info',
        'Admin Access Required',
        'Please enter the Admin PIN or an authorized admin email to access settings.'
      );
    } else {
      setIsSettingsModalOpen(true);
    }
  };

  // Check In / Check Out submission
  const handleSubmitAction = async (payload: {
    action: 'Check Out' | 'Check In';
    itemId: string;
    team: string;
    notes: string;
    email: string;
    category?: string;
  }) => {
    const isOut = payload.action === 'Check Out';
    const normalizedId = normalizeItemId(payload.itemId);
    const targetClean = normalizedId.toUpperCase();
    const targetCleanNoDash = targetClean.replace(/[-\s]/g, '');

    // Find matched item for log description only - DO NOT mutate inventory items directly
    const matchedItem = items.find((i) => {
      const curClean = normalizeItemId(i.itemId).toUpperCase();
      const curNoDash = curClean.replace(/[-\s]/g, '');
      return curClean === targetClean || curNoDash === targetCleanNoDash;
    });

    // 1. Add entry strictly to audit logs (LOGS sheet source of truth)
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      itemId: normalizedId,
      itemName: matchedItem?.itemName || `${payload.category || 'Component'} #${normalizedId}`,
      action: payload.action,
      team: payload.team,
      notes: payload.notes || (isOut ? 'Checked out' : 'Returned'),
      userEmail: payload.email,
      category: matchedItem?.category || payload.category,
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveCachedLogs(updatedLogs);

    // 2. Post record to Google Apps Script (appends ONLY to LOGS sheet)
    if (syncStatus.url) {
      try {
        await postInventoryAction(syncStatus.url, payload);
        addToast(
          'success',
          'Logged to LOGS Sheet',
          `Added ${payload.action} for ${normalizedId} to LOGS sheet. Spreadsheet formulas will update item status automatically.`
        );
        // Refresh live formula-computed items & logs from Google Sheet
        handleLiveSync(syncStatus.url, false);
      } catch (err: any) {
        addToast(
          'error',
          'Google Sheet Notice',
          `Log saved locally, but Google Sheet returned: ${err.message}`
        );
      }
    } else {
      addToast(
        'success',
        'Log Added',
        `Recorded ${payload.action} for ${normalizedId} in LOGS.`
      );
    }
  };

  // Fast single return from Team view
  const handleReturnItem = async (item: InventoryItem) => {
    await handleSubmitAction({
      action: 'Check In',
      itemId: item.itemId,
      team: item.currentUser,
      notes: 'Returned from Team Hardware Lookup',
      email: adminSettings.adminEmails[0] || 'admin@vex.club',
      category: item.category,
    });
  };

  // Batch return all items for a team
  const handleReturnAllForTeam = async (team: string, itemsToReturn: InventoryItem[]) => {
    if (itemsToReturn.length === 0) return;

    for (const item of itemsToReturn) {
      await handleSubmitAction({
        action: 'Check In',
        itemId: item.itemId,
        team,
        notes: `Batch return for Team ${team}`,
        email: adminSettings.adminEmails[0] || 'admin@vex.club',
        category: item.category,
      });
    }

    addToast('success', 'Batch Return Completed', `All ${itemsToReturn.length} items checked in for Team ${team}.`);
  };

  // Batch action from inventory table (admin feature)
  const handleBatchInventoryAction = async (selected: InventoryItem[], action: 'Check Out' | 'Check In') => {
    if (!adminSettings.isUnlocked) {
      handleOpenAdminUnlock();
      addToast('info', 'Admin Access Required', 'Batch operations require admin unlock.');
      return;
    }

    for (const item of selected) {
      await handleSubmitAction({
        action,
        itemId: item.itemId,
        team: action === 'Check Out' ? selectedTeam || '654V' : item.currentUser,
        notes: `Bulk ${action}`,
        email: adminSettings.adminEmails[0] || 'admin@vex.club',
        category: item.category,
      });
    }
    addToast('success', 'Batch Operation Completed', `${selected.length} items processed.`);
  };

  // Factory reset (admin protected)
  const handleResetFactoryData = () => {
    if (!adminSettings.isUnlocked) {
      handleOpenAdminUnlock();
      addToast('info', 'Admin Access Required', 'Resetting benchmark data requires admin authorization.');
      return;
    }

    const factory = generateDefaultInventory();
    setItems(factory);
    saveCachedInventory(factory);
    setLogs(INITIAL_LOGS);
    saveCachedLogs(INITIAL_LOGS);
    addToast('info', 'Inventory Reset', 'Restored original 279 items: 238 Available, 41 Checked Out.');
  };

  // Navigation callbacks
  const handleNavigateToCategory = (cat: VexCategory | 'All') => {
    setSelectedCategory(cat);
    setActiveTab('inventory');
  };

  const handleNavigateToTeam = (team: string) => {
    setSelectedTeam(team);
    setActiveTab('teams');
  };

  const handleOpenCheckoutModal = (
    item?: InventoryItem,
    defaultAction: 'Check Out' | 'Check In' = 'Check Out',
    presetTeam = '654V'
  ) => {
    setCheckoutTargetItem(item);
    setCheckoutDefaultAction(defaultAction);
    setCheckoutPresetTeam(presetTeam);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-zinc-100">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncStatus={syncStatus}
        adminSettings={adminSettings}
        onOpenSettings={handleOpenSettingsProtected}
        onOpenCheckout={() => handleOpenCheckoutModal()}
        onSyncNow={() => handleLiveSync(syncStatus.url, true)}
        onOpenAdminUnlock={handleOpenAdminUnlock}
        onLockAdmin={handleLockAdmin}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <CommandCenter
            items={items}
            logs={logs}
            isAdmin={adminSettings.isUnlocked}
            onOpenAdminUnlock={handleOpenAdminUnlock}
            onNavigateToCategory={handleNavigateToCategory}
            onNavigateToTeam={handleNavigateToTeam}
            onNavigateTab={setActiveTab}
            onOpenCheckout={(item) => handleOpenCheckoutModal(item, 'Check Out')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryBrowser
            items={items}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenCheckout={(item, action) => handleOpenCheckoutModal(item, action || 'Check Out')}
            onBatchAction={handleBatchInventoryAction}
            isAdmin={adminSettings.isUnlocked}
            onOpenAdminUnlock={handleOpenAdminUnlock}
          />
        )}

        {activeTab === 'teams' && (
          <TeamLookup
            items={items}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            onOpenCheckout={(item, action, team) =>
              handleOpenCheckoutModal(item, action || 'Check Out', team || selectedTeam)
            }
            onReturnItem={handleReturnItem}
            onReturnAllForTeam={handleReturnAllForTeam}
          />
        )}

        {activeTab === 'packlist' && <CompetitionPackList items={items} />}

        {activeTab === 'logs' && <ActivityLogs logs={logs} />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950/80 py-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>VEX Robotics Inventory Control</span>
            <span>·</span>
            <span>{items.length} Items System</span>
            <span>·</span>
            <span className="font-mono text-zinc-400">Club Teams (654K, 654J, 654A, 654B, 654G, 654T, 654V, 654Y, 654X, 654Z, RECF)</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={handleOpenSettingsProtected}
              className="hover:text-zinc-200 transition-colors"
            >
              Spreadsheet API Settings
            </button>
            <span>·</span>
            <button
              onClick={handleResetFactoryData}
              className="hover:text-zinc-200 transition-colors"
            >
              Reset Benchmark Data
            </button>
          </div>
        </div>
      </footer>

      {/* Check In / Out Action Modal (For regular members & admins) */}
      <CheckInOutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        items={items}
        preselectedItem={checkoutTargetItem}
        defaultAction={checkoutDefaultAction}
        presetTeam={checkoutPresetTeam}
        defaultEmail=""
        onSubmit={handleSubmitAction}
      />

      {/* Settings / API Modal (Admin only) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        syncStatus={syncStatus}
        onSaveUrl={handleSaveApiUrl}
        onResetFactoryData={handleResetFactoryData}
        adminSettings={adminSettings}
        onUpdateAdminSettings={setAdminSettings}
      />

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={isAdminUnlockModalOpen}
        onClose={() => setIsAdminUnlockModalOpen(false)}
        adminSettings={adminSettings}
        onUnlockSuccess={handleUnlockAdminSuccess}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
