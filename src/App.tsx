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
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // 1. Core State
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const cached = getCachedInventory();
    return cached && cached.length > 0 ? cached : generateDefaultInventory();
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<VexCategory | 'All'>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('654V');

  // Modal states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutTargetItem, setCheckoutTargetItem] = useState<InventoryItem | undefined>(undefined);
  const [checkoutDefaultAction, setCheckoutDefaultAction] = useState<'Check Out' | 'Check In'>('Check Out');
  const [checkoutPresetTeam, setCheckoutPresetTeam] = useState<string>('654V');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync on initial mount if URL exists
  useEffect(() => {
    if (syncStatus.url) {
      handleLiveSync(syncStatus.url, false);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveCachedInventory(items);
  }, [items]);

  useEffect(() => {
    saveCachedLogs(logs);
  }, [logs]);

  // Live Sync execution
  const handleLiveSync = async (apiUrl: string, showToastOnSuccess = true) => {
    if (!apiUrl) {
      addToast('info', 'Offline Mode Active', 'Using local 279-item inventory cache. Connect Google Sheet in Settings anytime.');
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
        setLogs(data.logs);
        saveCachedLogs(data.logs);
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
        addToast('success', 'Google Sheet Synced', `Successfully refreshed ${data.inventory.length} items from live spreadsheet.`);
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
    const targetItem = items.find((i) => i.itemId === payload.itemId);

    // 1. Optimistic local update
    const updatedItems = items.map((item) => {
      if (item.itemId === payload.itemId) {
        return {
          ...item,
          status: isOut ? ('Checked Out' as const) : ('Available' as const),
          currentUser: isOut ? payload.team : '',
          dateOut: isOut ? new Date().toISOString().split('T')[0] : '',
          notes: payload.notes || (isOut ? 'Checked out' : 'Returned in good condition'),
          timesCheckedOut: isOut ? item.timesCheckedOut + 1 : item.timesCheckedOut,
        };
      }
      return item;
    });

    setItems(updatedItems);
    saveCachedInventory(updatedItems);

    // 2. Add audit log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: payload.itemId,
      itemName: targetItem?.itemName,
      action: payload.action,
      team: payload.team,
      notes: payload.notes,
      userEmail: payload.email,
      category: targetItem?.category || payload.category,
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveCachedLogs(updatedLogs);

    // 3. Post to live Google Sheet if URL configured
    if (syncStatus.url) {
      try {
        await postInventoryAction(syncStatus.url, payload);
        addToast(
          'success',
          `${payload.action} Complete`,
          `${payload.itemId} updated in Google Sheet for Team ${payload.team || 'None'}.`
        );
      } catch (err: any) {
        addToast(
          'error',
          'Google Sheet Sync Notice',
          `Local state updated, but Sheet POST failed: ${err.message}`
        );
      }
    } else {
      addToast(
        'success',
        `${payload.action} Recorded`,
        `${payload.itemId} successfully ${isOut ? `assigned to Team ${payload.team}` : 'returned to stock'}.`
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
      email: 'yln2k20trishanth@gmail.com',
      category: item.category,
    });
  };

  // Batch return all items for a team
  const handleReturnAllForTeam = async (team: string, itemsToReturn: InventoryItem[]) => {
    if (itemsToReturn.length === 0) return;

    for (const item of itemsToReturn) {
      // Optimistic update
      await handleSubmitAction({
        action: 'Check In',
        itemId: item.itemId,
        team,
        notes: `Batch return for Team ${team}`,
        email: 'yln2k20trishanth@gmail.com',
        category: item.category,
      });
    }

    addToast('success', 'Batch Return Completed', `All ${itemsToReturn.length} items checked in for Team ${team}.`);
  };

  // Batch action from inventory table
  const handleBatchInventoryAction = async (selected: InventoryItem[], action: 'Check Out' | 'Check In') => {
    for (const item of selected) {
      await handleSubmitAction({
        action,
        itemId: item.itemId,
        team: action === 'Check Out' ? selectedTeam || '654V' : item.currentUser,
        notes: `Bulk ${action}`,
        email: 'yln2k20trishanth@gmail.com',
        category: item.category,
      });
    }
    addToast('success', 'Batch Operation Completed', `${selected.length} items processed.`);
  };

  // Factory reset
  const handleResetFactoryData = () => {
    const factory = generateDefaultInventory();
    setItems(factory);
    saveCachedInventory(factory);
    setLogs(INITIAL_LOGS);
    saveCachedLogs(INITIAL_LOGS);
    addToast('info', 'Inventory Reset', 'Restored original 279 items: 239 Available, 40 Checked Out.');
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncStatus={syncStatus}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCheckout={() => handleOpenCheckoutModal()}
        onSyncNow={() => handleLiveSync(syncStatus.url, true)}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <CommandCenter
            items={items}
            logs={logs}
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
            <span>279 Items System</span>
            <span>·</span>
            <span className="font-mono text-zinc-400">Club Teams (654K, 654J, 654A, 654B, 654G, 654T, 654V, 654Y, 654X, 654Z, RECF)</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
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

      {/* Check In / Out Action Modal */}
      <CheckInOutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        items={items}
        preselectedItem={checkoutTargetItem}
        defaultAction={checkoutDefaultAction}
        presetTeam={checkoutPresetTeam}
        defaultEmail="yln2k20trishanth@gmail.com"
        onSubmit={handleSubmitAction}
      />

      {/* Settings / API Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        syncStatus={syncStatus}
        onSaveUrl={handleSaveApiUrl}
        onResetFactoryData={handleResetFactoryData}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
