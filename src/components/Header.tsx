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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
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
              <div className="w-8 h-8 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:border-slate-300 transition-colors">
                <img
                  src="/assets/aistudio/lt_logo_transparent.png"
                  alt="Lake Travis Robotics Logo"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">
                  VEX Robotics
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  [654_INV]
                </span>
              </div>
            </a>
          </div>

          {/* Compact Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-sm p-0.5 text-xs font-medium">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap text-xs font-medium ${
                    isActive
                      ? 'bg-white text-slate-900 font-semibold border border-slate-200/90 shadow-none'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
              <span className={`w-1.5 h-1.5 rounded-none ${syncStatus.url ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              <span className="hidden xl:inline text-[11px] text-slate-600">
                {syncStatus.isSyncing ? 'SYNCING' : syncStatus.url ? 'LIVE' : 'LOCAL'}
              </span>
            </button>

            {/* Admin Status / Quick Auth Toggle */}
            {adminSettings.isUnlocked ? (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-2 py-1 rounded-sm text-xs text-amber-800 font-mono font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">ADMIN</span>
                <button
                  onClick={onLockAdmin}
                  title="Lock Admin Mode (Return to Regular Member Mode)"
                  aria-label="Lock Admin Mode"
                  className="ml-0.5 p-0.5 hover:text-amber-950 rounded hover:bg-amber-100 transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-700" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminUnlock}
                title="Admin Authentication (Coaches / Leads)"
                aria-label="Admin Authentication"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline text-[11px]">ADMIN</span>
              </button>
            )}

            {/* Consolidated Utility Tools: Logos/QR, Phone Preview, Settings */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-sm p-0.5">
              {/* Club Assets / Logos Download */}
              {onOpenAssetsModal && (
                <button
                  onClick={onOpenAssetsModal}
                  title="Download Club Logos & Custom QR Badges"
                  aria-label="Download Club Logos and QR Badges"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-sm transition-colors"
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
                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded-sm transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                title={adminSettings.isUnlocked ? 'Google Sheet API & System Settings' : 'Settings (Admin Authentication Required)'}
                aria-label="Google Sheet & System Settings"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-sm transition-colors relative"
              >
                <Settings className="w-3.5 h-3.5" />
                {syncStatus.url ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-600 rounded-none ring-1 ring-white" />
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-none ring-1 ring-white" />
                )}
              </button>
            </div>

            {/* Primary Action Button: Check In / Out (VEX Amber) */}
            <button
              onClick={onOpenCheckout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-all whitespace-nowrap shrink-0 active:translate-y-px"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check In / Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-200 py-1.5 overflow-x-auto gap-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1 text-xs rounded-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
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
