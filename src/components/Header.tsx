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
    <header className="sticky top-0 z-30 bg-[#0c0e12] border-b border-[#1c222b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-14">
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
              <div className="w-7 h-7 rounded-full bg-[#161a22] border border-zinc-800 flex items-center justify-center p-0.5 overflow-hidden shrink-0 group-hover:border-zinc-700 transition-colors">
                <img
                  src="/assets/aistudio/lt_logo_transparent.png"
                  alt="Lake Travis Robotics Logo"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  VEX Inventory
                </span>
                <span className="text-xs text-zinc-400 font-normal">
                  654
                </span>
              </div>
            </a>
          </div>

          {/* Centered Segmented Pill Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-[#141820] border border-[#212631] rounded-lg p-1 text-xs font-medium">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-[#222834] text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1f29]'
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors font-medium disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-zinc-300' : 'text-zinc-400'}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.url ? 'bg-emerald-500' : 'bg-amber-400'} ${syncStatus.isSyncing ? 'animate-ping' : ''}`} />
              <span className="text-xs">
                {syncStatus.isSyncing ? 'Syncing...' : syncStatus.url ? 'Live' : 'Local'}
              </span>
            </button>

            {/* Admin Status / Quick Auth Toggle */}
            {adminSettings.isUnlocked ? (
              <div className="flex items-center gap-1.5 bg-[#141820] border border-amber-500/50 px-3 py-1.5 rounded-lg text-xs text-amber-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
                <button
                  onClick={onLockAdmin}
                  title="Lock Admin Mode (Return to Regular Member Mode)"
                  aria-label="Lock Admin Mode"
                  className="ml-1 p-0.5 hover:text-amber-200 rounded transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminUnlock}
                title="Admin Authentication (Coaches / Leads)"
                aria-label="Admin Authentication"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors font-medium"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Consolidated Utility Tools: Logos/QR, Phone Preview, Settings */}
            <div className="flex items-center bg-[#141820] border border-[#212631] rounded-lg p-1 text-zinc-400">
              {/* Club Assets / Logos Download */}
              {onOpenAssetsModal && (
                <button
                  onClick={onOpenAssetsModal}
                  title="Download Club Logos & Custom QR Badges"
                  aria-label="Download Club Logos and QR Badges"
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#202530] rounded-md transition-colors"
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
                  className="p-1.5 hover:text-zinc-200 hover:bg-[#202530] rounded-md transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                title={adminSettings.isUnlocked ? 'Google Sheet API & System Settings' : 'Settings (Admin Authentication Required)'}
                aria-label="Google Sheet & System Settings"
                className="p-1.5 hover:text-zinc-200 hover:bg-[#202530] rounded-md transition-colors relative"
              >
                <Settings className="w-3.5 h-3.5" />
                {syncStatus.url ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Primary Action Button: Check In / Out (White Button Matching Screenshot) */}
            <button
              onClick={onOpenCheckout}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check In / Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-[#1c222b] py-1.5 overflow-x-auto gap-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-[#222834] text-white font-medium' : 'text-zinc-400'
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
