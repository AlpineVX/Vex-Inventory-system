/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  InventoryItem,
  AuditLog,
  VexCategory,
  ActiveTab,
  SyncStatus,
  AdminSettings,
  ItemCondition,
  OfflineQueueAction,
  DEFAULT_ADMIN_EMAILS,
  DEFAULT_ADMIN_PIN,
  CLUB_TEAMS,
  getCategoryDefaultLocation,
  normalizeItemId,
  classifyVexCategory,
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
import { MobileTopHeader } from './components/MobileTopHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ClubAssetsModal } from './components/ClubAssetsModal';
import { CommandCenter } from './components/CommandCenter';
import { InventoryBrowser } from './components/InventoryBrowser';
import { TeamLookup } from './components/TeamLookup';
import { CompetitionPackList } from './components/CompetitionPackList';
import { ActivityLogs } from './components/ActivityLogs';
import { CheckInOutModal } from './components/CheckInOutModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminUnlockModal } from './components/AdminUnlockModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal';
import { CommandPalette } from './components/CommandPalette';
import { LabelPrinterModal } from './components/LabelPrinterModal';
import { IOSInstallGuideModal, OfflineQueueBanner, usePWAInstallTrigger } from './components/PWAControls';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ToastContainer, ToastMessage } from './components/Toast';
import { isSoundEnabled, setSoundEnabled, playToggle, playClick } from './services/soundFx';

const CONDITION_MAP_KEY = 'vex_item_conditions_v1';
const OFFLINE_QUEUE_KEY = 'vex_offline_sync_queue';

function loadConditionMap(): Record<string, ItemCondition> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONDITION_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ItemCondition>) : {};
  } catch {
    return {};
  }
}

function saveConditionMap(map: Record<string, ItemCondition>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONDITION_MAP_KEY, JSON.stringify(map));
  } catch {}
}

function applyConditionMap(list: InventoryItem[], map: Record<string, ItemCondition>): InventoryItem[] {
  return list.map((item) => {
    const rawId = String(item.itemId || '');
    const norm = normalizeItemId(rawId, item.category).toUpperCase();
    const raw = rawId.toUpperCase();
    const cond = map[norm] || map[raw] || item.condition || 'Good';
    return cond === item.condition ? item : { ...item, condition: cond };
  });
}

function loadOfflineQueue(): OfflineQueueAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineQueueAction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

class TabErrorBoundary extends React.Component<
  { resetKey: string; children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { resetKey: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, errorMsg: err?.message || 'Unexpected display error' };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMsg: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-[#111114] border border-red-500/40 text-center space-y-3 my-4">
          <h2 className="text-sm font-bold text-zinc-100">Something went wrong loading this view</h2>
          <p className="text-xs text-zinc-400 font-mono">{this.state.errorMsg}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // 1. Core State
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const condMap = loadConditionMap();
    const version = typeof window !== 'undefined' ? localStorage.getItem('vex_schema_ver') : null;
    if (version !== 'v9') {
      const fresh = applyConditionMap(generateDefaultInventory(), condMap);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vex_schema_ver', 'v9');
      }
      saveCachedInventory(fresh);
      return fresh;
    }
    const cached = getCachedInventory();
    const base = cached && cached.length > 0 ? cached : generateDefaultInventory();
    return applyConditionMap(base, condMap);
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
            adminEmails:
              Array.isArray(parsed?.adminEmails) && parsed.adminEmails.length > 0
                ? parsed.adminEmails.map((em: unknown) => String(em).trim()).filter(Boolean)
                : [...DEFAULT_ADMIN_EMAILS],
            adminPin:
              typeof parsed?.adminPin === 'string' && parsed.adminPin.trim()
                ? parsed.adminPin
                : DEFAULT_ADMIN_PIN,
            isUnlocked: false, // Default to locked on startup so regular people can only check out/in
            kioskOnly: Boolean(parsed?.kioskOnly),
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
  const [lastBorrowerEmail, setLastBorrowerEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vex_last_borrower_email') || '';
    }
    return '';
  });

  // Modal states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutTargetItem, setCheckoutTargetItem] = useState<InventoryItem | undefined>(undefined);
  const [checkoutDefaultAction, setCheckoutDefaultAction] = useState<'Check Out' | 'Check In'>('Check Out');
  const [checkoutPresetTeam, setCheckoutPresetTeam] = useState<string>('654V');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAdminUnlockModalOpen, setIsAdminUnlockModalOpen] = useState<boolean>(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isLabelPrinterOpen, setIsLabelPrinterOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isOnline = useOnlineStatus();
  const { canShowInstall, triggerInstall, showIOSGuide, closeIOSGuide } = usePWAInstallTrigger();
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueAction[]>(() => loadOfflineQueue());
  const isFlushingQueueRef = useRef<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  isSyncingRef.current = syncStatus.isSyncing;

  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (next) playToggle();
  }, [soundEnabled]);

  const handleOpenCheckoutModal = useCallback(
    (
      item?: InventoryItem,
      defaultAction: 'Check Out' | 'Check In' = 'Check Out',
      presetTeam = '654V'
    ) => {
      setCheckoutTargetItem(item);
      setCheckoutDefaultAction(defaultAction);
      setCheckoutPresetTeam(presetTeam);
      setIsCheckoutModalOpen(true);
    },
    []
  );

  // Body scroll lock when any modal is open
  const isAnyModalOpen =
    isCheckoutModalOpen ||
    isSettingsModalOpen ||
    isAdminUnlockModalOpen ||
    isAssetsModalOpen ||
    isShortcutsModalOpen ||
    isDiagnosticsModalOpen ||
    isCommandPaletteOpen ||
    isLabelPrinterOpen ||
    showIOSGuide;

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isAnyModalOpen]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const isKioskLocked = adminSettings.kioskOnly && !adminSettings.isUnlocked;
    const navigateSafe = (tab: ActiveTab) => {
      if (isKioskLocked && tab !== 'dashboard' && tab !== 'inventory') {
        setIsAdminUnlockModalOpen(true);
        return;
      }
      setActiveTab(tab);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K toggles the Command Palette anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playClick();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Never intercept browser shortcuts like Cmd/Ctrl+C, Cmd/Ctrl+V, Alt+...
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Don't intercept when user is typing in form controls
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      if (e.key === '/' && !e.shiftKey) {
        const searchEl = document.querySelector<HTMLInputElement>(
          'input[data-global-search="true"], input[type="text"]'
        );
        if (searchEl) {
          e.preventDefault();
          playClick();
          searchEl.focus();
          return;
        }
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        playClick();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        playClick();
        navigateSafe('dashboard');
      } else if (e.key === '2') {
        e.preventDefault();
        playClick();
        navigateSafe('inventory');
      } else if (e.key === '3') {
        e.preventDefault();
        playClick();
        navigateSafe('teams');
      } else if (e.key === '4') {
        e.preventDefault();
        playClick();
        navigateSafe('packlist');
      } else if (e.key === '5') {
        e.preventDefault();
        playClick();
        navigateSafe('logs');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        playClick();
        handleOpenCheckoutModal();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        playClick();
        window.print();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        playClick();
        setIsDiagnosticsModalOpen(true);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleSound();
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsLabelPrinterOpen(false);
        setIsCheckoutModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsAdminUnlockModalOpen(false);
        setIsAssetsModalOpen(false);
        setIsShortcutsModalOpen(false);
        setIsDiagnosticsModalOpen(false);
        closeIOSGuide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSound, handleOpenCheckoutModal, adminSettings.kioskOnly, adminSettings.isUnlocked]);

  // Mobile viewport detection and manual layout mode switch
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vex_view_mode') as 'auto' | 'mobile' | 'desktop') || 'auto';
    }
    return 'auto';
  });

  const [isWindowMobile, setIsWindowMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsWindowMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && isWindowMobile);

  const handleToggleViewMode = () => {
    const next = isMobile ? 'desktop' : 'mobile';
    setViewMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vex_view_mode', next);
    }
    addToast(
      'info',
      next === 'mobile' ? 'Phone View On' : 'Desktop View On',
      'You can switch views anytime from the top bar or footer.'
    );
  };

  // Toast Helper (supports optional Undo/action button)
  const addToast = useCallback(
    (
      type: 'success' | 'error' | 'info',
      title: string,
      message?: string,
      options?: { actionLabel?: string; onAction?: () => void }
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [
        ...prev,
        { id, type, title, message, actionLabel: options?.actionLabel, onAction: options?.onAction },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5500);
    },
    []
  );

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

  // Live Sync execution (preserves locally flagged Needs Repair conditions)
  const handleLiveSync = useCallback(
    async (apiUrl: string, showToastOnSuccess = true): Promise<{ ok: boolean; error?: string }> => {
      if (!apiUrl) {
        addToast('info', 'Offline Mode Active', 'Using local inventory cache. Configure Google Sheet URL in Settings.');
        return { ok: true };
      }

      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      try {
        const data = await fetchLiveInventory(apiUrl);
        if (data.inventory && data.inventory.length > 0) {
          const synced = applyConditionMap(data.inventory, loadConditionMap());
          setItems(synced);
          saveCachedInventory(synced);
        }

        if (data.logs && data.logs.length > 0) {
          setLogs((prevLogs) => {
            const map = new Map<string, AuditLog>();

            prevLogs.forEach((l) => {
              const key = `${l.timestamp}_${l.itemId}_${l.action}`;
              map.set(key, l);
            });

            data.logs.forEach((l) => {
              const key = `${l.timestamp}_${l.itemId}_${l.action}`;
              map.set(key, l);
            });

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
        return { ok: true };
      } catch (err: any) {
        const errMsg = err?.message || 'Sync failed';
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: errMsg,
        }));
        if (showToastOnSuccess) {
          addToast('error', 'Sync Failed', errMsg);
        }
        return { ok: false, error: errMsg };
      }
    },
    [addToast]
  );

  // Flush queued offline actions when online
  const flushOfflineQueue = useCallback(
    async (showToastOnDone = true) => {
      if (!syncStatus.url || !isOnline || isFlushingQueueRef.current) return;
      const currentQueue = loadOfflineQueue();
      if (currentQueue.length === 0) return;

      isFlushingQueueRef.current = true;
      const remaining: OfflineQueueAction[] = [];
      let syncedCount = 0;

      try {
        for (const entry of currentQueue) {
          try {
            await postInventoryAction(syncStatus.url, entry.payload);
            syncedCount++;
          } catch {
            remaining.push(entry);
          }
        }
      } finally {
        isFlushingQueueRef.current = false;
      }

      saveOfflineQueue(remaining);
      setOfflineQueue(remaining);

      if (syncedCount > 0) {
        if (showToastOnDone) {
          addToast(
            'success',
            'Offline Actions Synced',
            `Uploaded ${syncedCount} pending check-out${syncedCount === 1 ? '' : 's'} to Google Sheets.`
          );
        }
        handleLiveSync(syncStatus.url, false);
      }
    },
    [syncStatus.url, isOnline, addToast, handleLiveSync]
  );

  // Sync on initial mount if URL exists
  useEffect(() => {
    if (syncStatus.url && isOnline) {
      flushOfflineQueue(false).then(() => handleLiveSync(syncStatus.url, false));
    }
  }, []);

  // Auto-flush pending offline actions when connection returns
  useEffect(() => {
    if (isOnline && syncStatus.url && offlineQueue.length > 0) {
      flushOfflineQueue(true);
    }
  }, [isOnline, syncStatus.url, offlineQueue.length, flushOfflineQueue]);

  // Background polling every 45s while tab is visible
  useEffect(() => {
    if (!syncStatus.url) return;
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        !isSyncingRef.current
      ) {
        handleLiveSync(syncStatus.url, false);
      }
    }, 45000);
    return () => window.clearInterval(timer);
  }, [syncStatus.url, handleLiveSync]);

  // URL save from Settings Modal
  const handleSaveApiUrl = async (newUrl: string) => {
    saveStoredApiUrl(newUrl);
    setSyncStatus((prev) => ({ ...prev, url: newUrl, mode: newUrl ? 'live' : 'mock', error: null }));
    if (newUrl) {
      const result = await handleLiveSync(newUrl, true);
      if (!result.ok) {
        throw new Error(result.error || 'Connection test failed.');
      }
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
      'Admin Mode Unlocked',
      'You can now edit Google Sheet links, reset the parts list, and manage settings.'
    );
  };

  const handleLockAdmin = () => {
    setAdminSettings((prev) => ({ ...prev, isUnlocked: false }));
    addToast(
      'info',
      'Standard Mode',
      'Admin mode locked. Regular check out and check in is active.'
    );
  };

  const handleOpenSettingsProtected = () => {
    if (!adminSettings.isUnlocked) {
      setIsAdminUnlockModalOpen(true);
      addToast(
        'info',
        'Admin Sign In Needed',
        'Enter the Admin PIN or an admin email to open settings.'
      );
    } else {
      setIsSettingsModalOpen(true);
    }
  };

  // Toggle Part Health Condition ('Good' <-> 'Needs Repair')
  const handleToggleItemCondition = useCallback(
    (item: InventoryItem) => {
      const nextCondition: ItemCondition = item.condition === 'Needs Repair' ? 'Good' : 'Needs Repair';
      const rawTargetUpper = String(item.itemId || '').toUpperCase();
      const normKey = normalizeItemId(String(item.itemId || ''), item.category).toUpperCase();
      const map = loadConditionMap();
      if (nextCondition === 'Needs Repair') {
        map[normKey] = 'Needs Repair';
      } else {
        delete map[normKey];
        delete map[rawTargetUpper];
      }
      saveConditionMap(map);

      setItems((prev) => {
        const next = prev.map((it) => {
          const itRaw = String(it.itemId || '');
          const itNorm = normalizeItemId(itRaw, it.category).toUpperCase();
          return itNorm === normKey || itRaw.toUpperCase() === rawTargetUpper
            ? { ...it, condition: nextCondition }
            : it;
        });
        saveCachedInventory(next);
        return next;
      });

      addToast(
        nextCondition === 'Needs Repair' ? 'info' : 'success',
        nextCondition === 'Needs Repair' ? `${item.itemId} Flagged Needs Repair` : `${item.itemId} Marked Good`,
        nextCondition === 'Needs Repair'
          ? 'Other students will see a repair warning before checking this part out.'
          : 'Repair flag cleared from this part.'
      );
    },
    [addToast]
  );

  // Check In / Check Out submission (supports batch mode, offline queue, condition flags & Undo toast)
  const handleSubmitAction = async (
    payload: {
      action: 'Check Out' | 'Check In';
      itemId: string;
      team: string;
      notes: string;
      email: string;
      category?: string;
      flagNeedsRepair?: boolean;
    },
    optionsOrSkipSync:
      | boolean
      | {
          skipLiveSync?: boolean;
          skipUndo?: boolean;
          restorePrev?: {
            status: 'Available' | 'Checked Out';
            currentUser: string;
            dateOut?: string;
            notes?: string;
            timesCheckedOut: number;
            condition?: ItemCondition;
          };
        } = false
  ) => {
    const opts = typeof optionsOrSkipSync === 'boolean' ? { skipLiveSync: optionsOrSkipSync } : optionsOrSkipSync;
    const skipLiveSync = Boolean(opts.skipLiveSync);
    const skipUndo = Boolean(opts.skipUndo);
    const restorePrev = opts.restorePrev;

    const isOut = payload.action === 'Check Out';
    const normalizedId = normalizeItemId(payload.itemId, payload.category);
    const targetClean = normalizedId.toUpperCase();
    const targetCleanNoDash = targetClean.replace(/[-\s]/g, '');

    // Find matched item BEFORE optimistic update (for Undo snapshot)
    const matchedItem = items.find((i) => {
      const curClean = normalizeItemId(i.itemId, i.category).toUpperCase();
      const curNoDash = curClean.replace(/[-\s]/g, '');
      return curClean === targetClean || curNoDash === targetCleanNoDash;
    });

    const prevSnapshot = matchedItem
      ? {
          status: matchedItem.status,
          currentUser: matchedItem.currentUser || '',
          dateOut: matchedItem.dateOut,
          notes: matchedItem.notes,
          timesCheckedOut: matchedItem.timesCheckedOut || 0,
          condition: matchedItem.condition || 'Good',
        }
      : undefined;

    const determinedCategory: VexCategory = classifyVexCategory(
      matchedItem?.category || payload.category,
      undefined,
      normalizedId
    );

    // Persist condition flag if checked in as damaged or restored during undo
    if (restorePrev) {
      const condMap = loadConditionMap();
      if (restorePrev.condition === 'Needs Repair') {
        condMap[targetClean] = 'Needs Repair';
      } else {
        delete condMap[targetClean];
      }
      saveConditionMap(condMap);
    } else if (!isOut && payload.flagNeedsRepair) {
      const condMap = loadConditionMap();
      condMap[targetClean] = 'Needs Repair';
      saveConditionMap(condMap);
    }

    // Remember member's email for faster repeat pit checkouts
    if (!skipLiveSync && payload.email && payload.email.trim()) {
      const cleanedEmail = payload.email.trim();
      setLastBorrowerEmail(cleanedEmail);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('vex_last_borrower_email', cleanedEmail);
        } catch {}
      }
    }

    // 1. Add entry strictly to audit logs (LOGS sheet source of truth)
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      itemId: normalizedId,
      itemName: matchedItem?.itemName || `VEX ${determinedCategory} #${normalizedId}`,
      action: payload.action,
      team: payload.team,
      notes: payload.notes || (isOut ? 'Checked out' : 'Returned'),
      userEmail: payload.email,
      category: determinedCategory,
    };
    setLogs((prevLogs) => {
      const updatedLogs = [newLog, ...prevLogs];
      saveCachedLogs(updatedLogs);
      return updatedLogs;
    });

    // 2. Optimistically update local inventory items so immediate UI reflects checkout/return
    setItems((prevItems) => {
      const matchIndex = prevItems.findIndex((i) => {
        const curClean = normalizeItemId(i.itemId, i.category).toUpperCase();
        return curClean === targetClean || curClean.replace(/[-\s]/g, '') === targetCleanNoDash;
      });

      if (matchIndex >= 0) {
        const updated = [...prevItems];
        const existing = updated[matchIndex];
        if (restorePrev) {
          updated[matchIndex] = {
            ...existing,
            status: restorePrev.status,
            currentUser: restorePrev.currentUser,
            dateOut: restorePrev.dateOut || '',
            notes: restorePrev.notes || '',
            timesCheckedOut: restorePrev.timesCheckedOut,
            condition: restorePrev.condition || 'Good',
          };
        } else {
          updated[matchIndex] = {
            ...existing,
            status: isOut ? 'Checked Out' : 'Available',
            currentUser: isOut ? payload.team : '',
            dateOut: isOut ? new Date().toISOString().split('T')[0] : '',
            notes: payload.notes || (isOut ? existing.notes : ''),
            timesCheckedOut: isOut ? (existing.timesCheckedOut || 0) + 1 : existing.timesCheckedOut,
            condition: !isOut && payload.flagNeedsRepair ? 'Needs Repair' : existing.condition,
          };
        }
        saveCachedInventory(updated);
        return updated;
      } else {
        const newItem: InventoryItem = {
          itemId: normalizedId,
          itemName: `VEX ${determinedCategory} ${normalizedId}`,
          category: determinedCategory,
          status: isOut ? 'Checked Out' : 'Available',
          currentUser: isOut ? payload.team : '',
          dateOut: isOut ? new Date().toISOString().split('T')[0] : '',
          notes: payload.notes || '',
          timesCheckedOut: isOut ? 1 : 0,
          location: getCategoryDefaultLocation(determinedCategory),
          condition: !isOut && payload.flagNeedsRepair ? 'Needs Repair' : 'Good',
        };
        const updated = [...prevItems, newItem];
        saveCachedInventory(updated);
        return updated;
      }
    });

    // Undo helper for toast
    const undoOptions =
      !skipLiveSync && !skipUndo && prevSnapshot
        ? {
            actionLabel: 'Undo',
            onAction: () => {
              const reverseAction = payload.action === 'Check Out' ? 'Check In' : 'Check Out';
              void handleSubmitAction(
                {
                  action: reverseAction,
                  itemId: normalizedId,
                  team: prevSnapshot.currentUser || payload.team,
                  notes: `Undo ${payload.action} (${normalizedId})`,
                  email: payload.email || lastBorrowerEmail || 'undo@vex654.club',
                  category: determinedCategory,
                },
                { skipUndo: true, restorePrev: prevSnapshot }
              );
            },
          }
        : undefined;

    const enqueueForLater = () => {
      const queued: OfflineQueueAction = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        queuedAt: new Date().toISOString(),
        payload: {
          action: payload.action,
          itemId: normalizedId,
          team: payload.team,
          notes: payload.notes,
          email: payload.email,
          category: determinedCategory,
        },
      };
      setOfflineQueue((prev) => {
        const next = [...prev, queued];
        saveOfflineQueue(next);
        return next;
      });
    };

    // 3. Post record to Google Apps Script (or queue offline if disconnected/failed)
    if (syncStatus.url) {
      if (!isOnline) {
        enqueueForLater();
        if (!skipLiveSync) {
          addToast(
            'info',
            `Saved Offline · ${normalizedId}`,
            `Queued ${payload.action} to sync automatically when Wi-Fi reconnects.`,
            undoOptions
          );
        }
        return;
      }

      try {
        await postInventoryAction(syncStatus.url, {
          ...payload,
          itemId: normalizedId,
          category: determinedCategory,
        });
        if (!skipLiveSync) {
          addToast(
            'success',
            restorePrev ? `Undid Action · ${normalizedId}` : `${payload.action} Recorded · ${normalizedId}`,
            restorePrev
              ? `Restored ${normalizedId} back to its previous state.`
              : `Logged to Google Sheet for Team ${payload.team}.`,
            undoOptions
          );
          handleLiveSync(syncStatus.url, false);
        }
      } catch (err: any) {
        enqueueForLater();
        if (!skipLiveSync) {
          addToast(
            'info',
            `Saved Locally · ${normalizedId}`,
            `Sheet unreachable (${err.message}). Queued to retry automatically.`,
            undoOptions
          );
        }
      }
    } else if (!skipLiveSync) {
      addToast(
        'success',
        restorePrev ? `Undid Action · ${normalizedId}` : `${payload.action} · ${normalizedId}`,
        restorePrev
          ? `Restored ${normalizedId} back to previous state.`
          : `Saved ${payload.action} for Team ${payload.team}.`,
        undoOptions
      );
    }
  };

  // Batch Check In / Check Out submission from modal queue
  const handleBatchModalSubmit = async (
    entries: Array<{
      action: 'Check Out' | 'Check In';
      itemId: string;
      team: string;
      notes: string;
      email: string;
      category?: string;
      flagNeedsRepair?: boolean;
    }>
  ) => {
    if (entries.length === 0) return;
    for (const entry of entries) {
      await handleSubmitAction(entry, { skipLiveSync: true, skipUndo: true });
    }
    if (syncStatus.url && isOnline) {
      handleLiveSync(syncStatus.url, false);
    }
    addToast(
      'success',
      `Batch Complete (${entries.length} parts)`,
      `Logged ${entries.length} part ${entries[0].action === 'Check In' ? 'returns' : 'check-outs'} for Team ${entries[0].team}.`
    );
  };

  // Fast single return from Team view (Admin only)
  const handleReturnItem = async (item: InventoryItem) => {
    if (!adminSettings.isUnlocked) {
      handleOpenAdminUnlock();
      addToast('info', 'Admin Access Required', 'Quick return is only available to admins. Regular members must use Check Out / Check In with email and notes.');
      return;
    }

    await handleSubmitAction({
      action: 'Check In',
      itemId: item.itemId,
      team: item.currentUser || '654V',
      notes: 'Returned by Admin from Team Hardware Lookup',
      email: adminSettings.adminEmails[0] || 'admin@vex.club',
      category: item.category,
    });
  };

  // Batch return all items for a team (Admin only)
  const handleReturnAllForTeam = async (team: string, itemsToReturn: InventoryItem[]) => {
    if (!adminSettings.isUnlocked) {
      handleOpenAdminUnlock();
      addToast('info', 'Admin Access Required', 'Batch returns require admin authorization.');
      return;
    }

    if (itemsToReturn.length === 0) return;

    for (const item of itemsToReturn) {
      await handleSubmitAction(
        {
          action: 'Check In',
          itemId: item.itemId,
          team,
          notes: `Batch return for Team ${team}`,
          email: adminSettings.adminEmails[0] || 'admin@vex.club',
          category: item.category,
        },
        true // Skip individual live sync to avoid flooding
      );
    }

    if (syncStatus.url) {
      handleLiveSync(syncStatus.url, false);
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
      await handleSubmitAction(
        {
          action,
          itemId: item.itemId,
          team: action === 'Check Out' ? selectedTeam || '654V' : item.currentUser || '654V',
          notes: `Bulk ${action}`,
          email: adminSettings.adminEmails[0] || 'admin@vex.club',
          category: item.category,
        },
        true // Skip individual live sync to avoid flooding
      );
    }

    if (syncStatus.url) {
      handleLiveSync(syncStatus.url, false);
    }
    addToast('success', 'Batch Operation Completed', `${selected.length} items processed.`);
  };

  // Factory reset (admin protected)
  const handleResetFactoryData = () => {
    if (!adminSettings.isUnlocked) {
      handleOpenAdminUnlock();
      addToast('info', 'Admin Sign In Needed', 'Resetting the parts list requires admin sign in.');
      return;
    }

    const factory = generateDefaultInventory();
    const availCount = factory.filter((i) => i.status === 'Available').length;
    const outCount = factory.length - availCount;
    setItems(factory);
    saveCachedInventory(factory);
    setLogs(INITIAL_LOGS);
    saveCachedLogs(INITIAL_LOGS);
    addToast('info', 'Inventory Reset', `Restored ${factory.length} parts (${availCount} available, ${outCount} checked out).`);
  };

  // Kiosk-aware tab guard
  const isKioskRestricted = adminSettings.kioskOnly && !adminSettings.isUnlocked;

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      if (isKioskRestricted && tab !== 'dashboard' && tab !== 'inventory') {
        setIsAdminUnlockModalOpen(true);
        addToast(
          'info',
          'Shared Computer Mode',
          'Only Check Out/In and Parts Search are open unless an admin signs in.'
        );
        return;
      }
      setActiveTab(tab);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [isKioskRestricted, addToast]
  );

  // Navigation callbacks
  const handleNavigateToCategory = (cat: VexCategory | 'All') => {
    setSelectedCategory(cat);
    setActiveTab('inventory');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleNavigateToTeam = (team: string) => {
    if (isKioskRestricted) {
      setIsAdminUnlockModalOpen(true);
      addToast('info', 'Shared Computer Mode', 'Sign in as admin to view team pages.');
      return;
    }
    setSelectedTeam(team);
    setActiveTab('teams');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleManualSync = useCallback(async () => {
    if (offlineQueue.length > 0 && isOnline && syncStatus.url) {
      await flushOfflineQueue(true);
    }
    await handleLiveSync(syncStatus.url, true);
  }, [offlineQueue.length, isOnline, syncStatus.url, flushOfflineQueue, handleLiveSync]);

  return (
    <>
      <div id="app-shell" className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-red-500/25 selection:text-red-200">
        {/* Top Header: Specialized Mobile Header or Desktop Header */}
        {isMobile ? (
          <MobileTopHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            syncStatus={syncStatus}
            adminSettings={adminSettings}
            onOpenSettings={handleOpenSettingsProtected}
            onSyncNow={handleManualSync}
            onOpenAdminUnlock={handleOpenAdminUnlock}
            onLockAdmin={handleLockAdmin}
            isMobileModeForced={viewMode === 'mobile'}
            onToggleViewMode={handleToggleViewMode}
            onOpenAssetsModal={() => setIsAssetsModalOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenLabelPrinter={() => setIsLabelPrinterOpen(true)}
            canInstallApp={canShowInstall}
            onInstallApp={triggerInstall}
          />
        ) : (
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            syncStatus={syncStatus}
            adminSettings={adminSettings}
            onOpenSettings={handleOpenSettingsProtected}
            onOpenCheckout={() => handleOpenCheckoutModal()}
            onSyncNow={handleManualSync}
            onOpenAdminUnlock={handleOpenAdminUnlock}
            onLockAdmin={handleLockAdmin}
            onToggleViewMode={handleToggleViewMode}
            onOpenAssetsModal={() => setIsAssetsModalOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenLabelPrinter={() => setIsLabelPrinterOpen(true)}
            canInstallApp={canShowInstall}
            onInstallApp={triggerInstall}
          />
        )}

        {/* Main Container Viewport */}
        <main
          className={`flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 ${
            viewMode === 'mobile' ? 'max-w-md' : 'max-w-7xl'
          } ${isMobile ? 'pb-24' : ''}`}
        >
          <TabErrorBoundary resetKey={activeTab}>
            <div key={activeTab} className="animate-tab-enter">
              {activeTab === 'dashboard' && (
                <CommandCenter
                  items={items}
                  logs={logs}
                  isAdmin={adminSettings.isUnlocked}
                  onOpenAdminUnlock={handleOpenAdminUnlock}
                  onNavigateToCategory={handleNavigateToCategory}
                  onNavigateToTeam={handleNavigateToTeam}
                  onNavigateTab={handleTabChange}
                  onOpenCheckout={(item, action) => handleOpenCheckoutModal(item, action || 'Check Out')}
                  isMobileMode={isMobile}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryBrowser
                  items={items}
                  logs={logs}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onOpenCheckout={(item, action) => handleOpenCheckoutModal(item, action || 'Check Out')}
                  onBatchAction={handleBatchInventoryAction}
                  onToggleCondition={handleToggleItemCondition}
                  onOpenLabelPrinter={() => setIsLabelPrinterOpen(true)}
                  isAdmin={adminSettings.isUnlocked}
                  onOpenAdminUnlock={handleOpenAdminUnlock}
                  isMobileMode={isMobile}
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
                  isAdmin={adminSettings.isUnlocked}
                  onOpenAdminUnlock={handleOpenAdminUnlock}
                  isMobileMode={isMobile}
                />
              )}

              {activeTab === 'packlist' && <CompetitionPackList items={items} />}

              {activeTab === 'logs' && <ActivityLogs logs={logs} isMobileMode={isMobile} />}
            </div>
          </TabErrorBoundary>
        </main>

        {/* Mobile Fixed Bottom Nav (Natural thumb zone) */}
        {isMobile && (
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onOpenCheckout={() => handleOpenCheckoutModal()}
            availableCount={items.filter((i) => i.status === 'Available').length}
            totalCount={items.length}
            adminSettings={adminSettings}
            onOpenAdminUnlock={handleOpenAdminUnlock}
            onOpenAssetsModal={() => setIsAssetsModalOpen(true)}
          />
        )}

        {/* Footer */}
        <footer className={`mt-auto border-t border-[#27272d] bg-[#09090b] py-4 text-xs text-zinc-500 ${isMobile ? 'pb-24' : ''}`}>
          <div className={`${viewMode === 'mobile' ? 'max-w-md' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-zinc-300">VEX Robotics Team 654</span>
              <span>·</span>
              <span>{items.length} Parts Tracked</span>
              <span>·</span>
              <span className="font-mono text-zinc-400">Club Teams ({CLUB_TEAMS.join(', ')})</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400 shrink-0 flex-wrap justify-center">
              <span>Website made by <strong className="text-zinc-100 font-semibold">Trishanth Yakkala</strong></span>
              <span>·</span>
              <button
                onClick={() => setIsLabelPrinterOpen(true)}
                className="hover:text-zinc-100 transition-colors underline"
              >
                QR Bin Labels
              </button>
              <span>·</span>
              <button
                onClick={() => setIsAssetsModalOpen(true)}
                className="hover:text-zinc-100 transition-colors underline"
              >
                Logos &amp; QR Badges
              </button>
              <span>·</span>
              <button
                onClick={handleToggleViewMode}
                className="hover:text-red-400 transition-colors"
              >
                {isMobile ? 'Switch to Desktop View' : 'Switch to Phone View'}
              </button>
              <span>·</span>
              <button
                onClick={handleOpenSettingsProtected}
                className="hover:text-zinc-100 transition-colors"
              >
                Google Sheet Settings
              </button>
            </div>
          </div>
        </footer>

        {/* Check In / Out Action Modal (Bottom sheet on mobile, modal on desktop) */}
        <CheckInOutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          items={items}
          preselectedItem={checkoutTargetItem}
          defaultAction={checkoutDefaultAction}
          presetTeam={checkoutPresetTeam}
          defaultEmail={lastBorrowerEmail}
          isAdmin={adminSettings.isUnlocked}
          onSubmit={handleSubmitAction}
          onBatchSubmit={handleBatchModalSubmit}
        />

        {/* Quick Command Palette (⌘K / Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          items={items}
          onNavigateTab={handleTabChange}
          onNavigateToTeam={handleNavigateToTeam}
          onOpenCheckout={(item, action, presetTeam) =>
            handleOpenCheckoutModal(item, action || 'Check Out', presetTeam || '654V')
          }
          onSyncNow={handleManualSync}
          onToggleSound={handleToggleSound}
          soundEnabled={soundEnabled}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
          onOpenAssetsModal={() => setIsAssetsModalOpen(true)}
          onOpenLabelPrinter={() => setIsLabelPrinterOpen(true)}
          canInstallApp={canShowInstall}
          onInstallApp={triggerInstall}
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

        {/* Club Assets & QR Badges Download Modal */}
        <ClubAssetsModal
          isOpen={isAssetsModalOpen}
          onClose={() => setIsAssetsModalOpen(false)}
        />

        {/* Keyboard Shortcuts Cheatsheet Modal */}
        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />

        {/* App Status & Cache Modal */}
        <SystemDiagnosticsModal
          isOpen={isDiagnosticsModalOpen}
          onClose={() => setIsDiagnosticsModalOpen(false)}
          items={items}
          logs={logs}
          syncStatus={syncStatus}
        />

        {/* iOS Safari Add-to-Home-Screen Guide */}
        <IOSInstallGuideModal isOpen={showIOSGuide} onClose={closeIOSGuide} />

        {/* Offline / Pending Sync Queue Status Pill */}
        <OfflineQueueBanner
          pendingCount={offlineQueue.length}
          onRetrySync={() => void flushOfflineQueue(true)}
        />

        {/* Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>

      {/* Printable Bin & QR Label Sheet Modal (renders #qr-label-print-sheet outside #app-shell for clean print isolation) */}
      <LabelPrinterModal
        isOpen={isLabelPrinterOpen}
        onClose={() => setIsLabelPrinterOpen(false)}
        items={items}
        initialCategory={selectedCategory === 'All' ? 'Brain' : selectedCategory}
      />
    </>
  );
}
