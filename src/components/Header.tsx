import React from 'react';
import { RefreshCw, Settings, Plus, ShieldCheck, Lock, Smartphone, Download } from 'lucide-react';
import { ActiveTab, SyncStatus, AdminSettings } from '../types';

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
}) => {
  const navTabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'teams' as const, label: 'Teams' },
    { id: 'packlist' as const, label: 'Pack List' },
    { id: 'logs' as const, label: 'Audit Logs' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-15">
          {/* Brand Wordmark & Club Emblem */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('dashboard');
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/aistudio/lt_logo_transparent.png"
                  alt="Lake Travis Robotics Logo"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  VEX Inventory
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  654
                </span>
              </div>
            </a>
          </div>

          {/* Compact Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-1 text-xs font-medium">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-medium ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
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
              onClick={onSyncNow}
              disabled={syncStatus.isSyncing}
              title={syncStatus.url ? `Sync with Google Sheet (${syncStatus.url})` : 'Sync local data'}
              aria-label="Sync with Google Sheet"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-zinc-200' : 'text-zinc-400'}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.url ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden xl:inline text-zinc-400 text-[11px]">
                {syncStatus.isSyncing ? 'Syncing...' : syncStatus.url ? 'Live' : 'Local'}
              </span>
            </button>

            {/* Admin Status / Quick Auth Toggle */}
            {adminSettings.isUnlocked ? (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 rounded-md text-xs text-amber-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Admin</span>
                <button
                  onClick={onLockAdmin}
                  title="Lock Admin Mode (Return to Regular Member Mode)"
                  aria-label="Lock Admin Mode"
                  className="ml-0.5 p-0.5 hover:text-white rounded hover:bg-amber-500/20 transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-400/80 hover:text-amber-200" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminUnlock}
                title="Admin Authentication (Coaches / Leads)"
                aria-label="Admin Authentication"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden lg:inline text-[11px]">Admin</span>
              </button>
            )}

            {/* Consolidated Utility Tools: Logos/QR, Phone Preview, Settings */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
              {/* Club Assets / Logos Download */}
              {onOpenAssetsModal && (
                <button
                  onClick={onOpenAssetsModal}
                  title="Download Club Logos & Custom QR Badges"
                  aria-label="Download Club Logos and QR Badges"
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Toggle Phone UI Mode */}
              {onToggleViewMode && (
                <button
                  onClick={onToggleViewMode}
                  title="Preview / Switch to Phone View"
                  aria-label="Switch to Phone View"
                  className="p-1.5 text-zinc-400 hover:text-blue-300 hover:bg-zinc-800 rounded transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                title={adminSettings.isUnlocked ? 'Google Sheet API & System Settings' : 'Settings (Admin Authentication Required)'}
                aria-label="Google Sheet & System Settings"
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors relative"
              >
                <Settings className="w-3.5 h-3.5" />
                {syncStatus.url ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-zinc-900" />
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full ring-1 ring-zinc-900" />
                )}
              </button>
            </div>

            {/* Primary Action Button: Check In / Out */}
            <button
              onClick={onOpenCheckout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-all shadow-sm whitespace-nowrap shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
              <span>Check In / Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-zinc-900 py-2 overflow-x-auto gap-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
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
