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
}) => {
  const navTabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'teams' as const, label: 'Teams' },
    { id: 'packlist' as const, label: 'Pack List' },
    { id: 'logs' as const, label: 'Audit Logs' },
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
    setPillStyle({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      ready: true,
    });
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

  const handleTabClick = (tabId: ActiveTab) => {
    playClick();
    onTabChange(tabId);
  };

  const handlePrint = () => {
    playBeep();
    window.print();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272d] no-print">
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
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap text-xs ${
                    isActive
                      ? 'text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action & Utility Cluster */}
          <div className="flex items-center gap-2 shrink-0">
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
              <div className="flex items-center gap-1.5 bg-[#111114] border border-amber-500/50 px-3 py-1.5 rounded-lg text-xs text-amber-400 font-medium shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
                <button
                  onClick={() => {
                    playToggle();
                    onLockAdmin();
                  }}
                  title="Lock Admin Mode (Return to Regular Member Mode)"
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
                title="Admin Authentication (Coaches / Leads)"
                aria-label="Admin Authentication"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors font-medium btn-tactile"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Consolidated Utility Tools: Sound FX, Shortcuts, Diagnostics, Print, Assets, Mobile, Settings */}
            <div className="flex items-center bg-[#111114] border border-[#27272d] rounded-lg p-0.5 text-zinc-400 shadow-inner">
              {/* Sound FX Toggle */}
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  title={soundEnabled ? 'Tactile Web Audio Feedback: ON (Click to mute)' : 'Tactile Web Audio Feedback: MUTED (Click to unmute)'}
                  aria-label="Toggle Sound Effects"
                  className={`p-1.5 rounded-md transition-colors ${
                    soundEnabled ? 'text-red-400 hover:text-red-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Keyboard Shortcuts Cheatsheet */}
              {onOpenShortcuts && (
                <button
                  onClick={() => {
                    playClick();
                    onOpenShortcuts();
                  }}
                  title="Keyboard Shortcuts Cheatsheet (?)"
                  aria-label="Keyboard Shortcuts"
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
              )}

              {/* System Diagnostics / Telemetry Inspector */}
              {onOpenDiagnostics && (
                <button
                  onClick={() => {
                    playClick();
                    onOpenDiagnostics();
                  }}
                  title="System Telemetry & Architecture Diagnostics"
                  aria-label="System Diagnostics"
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Print Official Tournament Manifest */}
              <button
                onClick={handlePrint}
                title="Print Official Competition Custody Manifest (Ctrl+P)"
                aria-label="Print Manifest"
                className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Club Assets / Logos Download */}
              {onOpenAssetsModal && (
                <button
                  onClick={() => {
                    playClick();
                    onOpenAssetsModal();
                  }}
                  title="Download Club Logos & Custom QR Badges"
                  aria-label="Download Club Logos and QR Badges"
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Toggle Phone UI Mode */}
              {onToggleViewMode && (
                <button
                  onClick={() => {
                    playClick();
                    onToggleViewMode();
                  }}
                  title="Preview / Switch to Phone View"
                  aria-label="Switch to Phone View"
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={() => {
                  playClick();
                  onOpenSettings();
                }}
                title={adminSettings.isUnlocked ? 'Google Sheet API & System Settings' : 'Settings (Admin Authentication Required)'}
                aria-label="Google Sheet & System Settings"
                className="p-1.5 hover:text-zinc-200 hover:bg-[#1a1a1f] rounded-md transition-colors relative"
              >
                <Settings className="w-3.5 h-3.5" />
                {syncStatus.url ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
              </button>
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
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
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
