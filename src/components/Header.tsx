import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import {
  RefreshCw,
  Settings,
  Plus,
  ShieldCheck,
  Lock,
  Smartphone,
  Download,
  Volume2,
  VolumeX,
  Keyboard,
  Activity,
  Printer,
  MoreHorizontal,
  Search,
  QrCode,
} from 'lucide-react';
import { ActiveTab, SyncStatus, AdminSettings } from '../types';
import { playClick, playToggle, playBeep } from '../services/soundFx';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  syncStatus: SyncStatus;
  adminSettings: AdminSettings;
  onOpenSettings: () => void;
  onOpenCheckout: () => void;
  onSyncNow: () => void;
  onOpenAdminUnlock: () => void;
  onLockAdmin: () => void;
  onToggleViewMode?: () => void;
  onOpenAssetsModal?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenLabelPrinter?: () => void;
  canInstallApp?: boolean;
  onInstallApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  syncStatus,
  adminSettings,
  onOpenSettings,
  onOpenCheckout,
  onSyncNow,
  onOpenAdminUnlock,
  onLockAdmin,
  onToggleViewMode,
  onOpenAssetsModal,
  soundEnabled = true,
  onToggleSound,
  onOpenShortcuts,
  onOpenDiagnostics,
  onOpenCommandPalette,
  onOpenLabelPrinter,
  canInstallApp = false,
  onInstallApp,
}) => {
  const navTabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'teams' as const, label: 'Teams' },
    { id: 'packlist' as const, label: 'Pack List' },
    { id: 'logs' as const, label: 'Activity Log' },
  ];

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updatePill = () => {
    const activeEl = tabRefs.current[activeTab];
    const navEl = navRef.current;
    if (!activeEl || !navEl) return;
    if (activeEl.offsetWidth === 0) return;
    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;
    setPillStyle((prev) =>
      prev.ready && prev.left === left && prev.width === width ? prev : { left, width, ready: true }
    );
  };

  useLayoutEffect(() => {
    updatePill();
  }, [activeTab]);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updatePill());
    observer.observe(navEl);
    return () => observer.disconnect();
  }, [activeTab]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!toolsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [toolsOpen]);

  const handleTabClick = (tabId: ActiveTab) => {
    playClick();
    onTabChange(tabId);
  };

  const handlePrint = () => {
    playBeep();
    window.print();
  };

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-md border-b no-print transition-all duration-200 ${
        isScrolled
          ? 'bg-[#09090b]/98 border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.65)]'
          : 'bg-[#09090b]/95 border-[#27272d]'
      }`}
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          {/* Brand Wordmark & Club Emblem */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('dashboard');
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-full bg-[#1a1a1f] border border-zinc-800 flex items-center justify-center p-0.5 overflow-hidden shrink-0 group-hover:border-red-500/70 group-hover:scale-105 group-hover:-rotate-6 transition-all duration-200 shadow-sm">
                <img
                  src="/assets/aistudio/lt_logo_transparent.png"
                  alt="Lake Travis Robotics Logo"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-red-400 transition-colors">
                  VEX Inventory
                </span>
                <span className="text-xs text-red-400 font-medium font-mono">
                  654
                </span>
              </div>
            </a>
          </div>

          {/* Centered Segmented Navigation Tabs with Spring Sliding Pill */}
          <nav
            ref={navRef}
            className="hidden md:flex relative items-center bg-[#111114] border border-[#27272d] rounded-lg p-1 text-xs font-medium shadow-inner"
          >
            {pillStyle.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translateX(${pillStyle.left - 4}px)`,
                  width: `${pillStyle.width}px`,
                }}
                className="absolute top-1 bottom-1 left-1 rounded-md bg-[#1a1a1f] border border-red-500/40 shadow-sm pointer-events-none transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] overflow-hidden"
              >
                <span className="absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-red-600" />
              </div>
            )}
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isLockedInKiosk =
                adminSettings.kioskOnly &&
                !adminSettings.isUnlocked &&
                tab.id !== 'dashboard' &&
                tab.id !== 'inventory';
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap text-xs flex items-center gap-1.5 ${
                    isActive
                      ? 'text-zinc-100 font-semibold'
                      : isLockedInKiosk
                      ? 'text-zinc-500 hover:text-zinc-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isLockedInKiosk && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                </button>
              );
            })}
          </nav>

          {/* Right Action & Calm Utility Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Trigger */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onOpenCommandPalette();
                }}
                title="Quick Command & Search (⌘K)"
                aria-label="Open Command Palette"
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors whitespace-nowrap shrink-0 btn-tactile"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span>Jump</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#09090b] border border-[#27272d] rounded leading-none">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Sync Now / Status Indicator */}
            <button
              onClick={() => {
                playClick();
                onSyncNow();
              }}
              disabled={syncStatus.isSyncing}
              title={syncStatus.url ? `Sync with Google Sheet (${syncStatus.url})` : 'Sync local data'}
              aria-label="Sync with Google Sheet"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors font-medium disabled:opacity-50 whitespace-nowrap shrink-0 btn-tactile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-zinc-300' : 'text-zinc-400'}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.url ? 'bg-red-500' : 'bg-amber-400'} ${syncStatus.isSyncing ? 'animate-ping' : ''}`} />
              <span className="text-xs font-medium">
                {syncStatus.isSyncing ? 'Syncing...' : syncStatus.url ? 'Live' : 'Local'}
              </span>
            </button>

            {/* Admin Status / Quick Auth Toggle */}
            {adminSettings.isUnlocked ? (
              <div className="flex items-center gap-1.5 bg-[#111114] border border-amber-500/50 px-3 py-1.5 rounded-lg text-xs text-amber-400 font-medium shadow-sm whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
                <button
                  onClick={() => {
                    playToggle();
                    onLockAdmin();
                  }}
                  title="Lock Admin Mode"
                  aria-label="Lock Admin Mode"
                  className="ml-1 p-0.5 hover:text-amber-200 rounded transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  playClick();
                  onOpenAdminUnlock();
                }}
                title="Admin Sign In (Coaches & Leads)"
                aria-label="Admin Sign In"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors font-medium whitespace-nowrap shrink-0 btn-tactile"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Consolidated Tools Dropdown Popover */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setToolsOpen((prev) => !prev);
                }}
                title="Tools, Printing & Settings"
                aria-label="Tools and Settings Menu"
                aria-expanded={toolsOpen}
                className={`p-1.5 rounded-lg border transition-colors relative btn-tactile ${
                  toolsOpen
                    ? 'bg-[#1a1a1f] border-red-500/45 text-zinc-100'
                    : 'bg-[#111114] hover:bg-[#1a1a1f] border-[#27272d] text-zinc-300 hover:text-zinc-100'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                {!syncStatus.url && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
              </button>

              {toolsOpen && (
                <div className="absolute right-0 top-10 w-64 bg-[#111114] border border-[#27272d] rounded-2xl shadow-2xl p-1.5 space-y-0.5 z-50 animate-modal-enter font-sans">
                  {onOpenCommandPalette && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onOpenCommandPalette();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Search className="w-3.5 h-3.5 text-red-400" />
                        <span>Quick Command</span>
                      </span>
                      <kbd className="text-[10px] font-mono text-zinc-400 bg-[#09090b] px-1.5 py-0.5 rounded border border-[#27272d]">
                        ⌘K
                      </kbd>
                    </button>
                  )}

                  {onOpenLabelPrinter && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onOpenLabelPrinter();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-red-400" />
                      <span>Print QR Bin Labels</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      handlePrint();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Printer className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Print Inventory Sheet</span>
                    </span>
                    <kbd className="text-[10px] font-mono text-zinc-400 bg-[#09090b] px-1.5 py-0.5 rounded border border-[#27272d]">
                      P
                    </kbd>
                  </button>

                  {onOpenAssetsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onOpenAssetsModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Club Logos &amp; QR Badges</span>
                    </button>
                  )}

                  {canInstallApp && onInstallApp && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onInstallApp();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-red-400" />
                      <span>Install VEX 654 App</span>
                    </button>
                  )}

                  <div className="border-t border-[#27272d] my-1" />

                  {onToggleSound && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleSound();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        {soundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <span>Sound Effects</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {soundEnabled ? 'ON' : 'MUTED'}
                      </span>
                    </button>
                  )}

                  {onOpenShortcuts && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onOpenShortcuts();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Keyboard Shortcuts</span>
                      </span>
                      <kbd className="text-[10px] font-mono text-zinc-400 bg-[#09090b] px-1.5 py-0.5 rounded border border-[#27272d]">
                        ?
                      </kbd>
                    </button>
                  )}

                  {onOpenDiagnostics && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onOpenDiagnostics();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      <span>App Status &amp; Cache</span>
                    </button>
                  )}

                  {onToggleViewMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        playClick();
                        onToggleViewMode();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Switch to Phone View</span>
                    </button>
                  )}

                  <div className="border-t border-[#27272d] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      playClick();
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Google Sheet &amp; Admin</span>
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.url ? 'bg-red-500' : 'bg-amber-400'}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Button: Check In / Out */}
            <button
              onClick={() => {
                playBeep();
                onOpenCheckout();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm whitespace-nowrap shrink-0 btn-crimson-glow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check In / Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-[#27272d] py-1.5 overflow-x-auto gap-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-all btn-tactile ${
                activeTab === tab.id ? 'bg-[#1a1a1f] text-zinc-100 font-semibold border border-red-500/35' : 'text-zinc-400 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
