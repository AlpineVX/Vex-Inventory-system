import { RefreshCw, Settings, Plus, ShieldCheck, Lock, Unlock, LogOut, Smartphone, QrCode, Download } from 'lucide-react';
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
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
              <img
                src="/assets/aistudio/lt_logo_transparent.png"
                alt="Lake Travis Robotics Logo"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('dashboard');
              }}
              className="text-base font-semibold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 hover:text-white transition-colors"
            >
              VEX Robotics Inventory Control
            </a>
          </div>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 py-1.5 ${
                activeTab === 'dashboard'
                  ? 'text-white font-semibold border-b-2 border-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => onTabChange('inventory')}
              className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 py-1.5 ${
                activeTab === 'inventory'
                  ? 'text-white font-semibold border-b-2 border-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              Universal Inventory
            </button>
            <button
              onClick={() => onTabChange('teams')}
              className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 py-1.5 ${
                activeTab === 'teams'
                  ? 'text-white font-semibold border-b-2 border-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              Team Allocations
            </button>
            <button
              onClick={() => onTabChange('packlist')}
              className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 py-1.5 ${
                activeTab === 'packlist'
                  ? 'text-white font-semibold border-b-2 border-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              Competition Pack
            </button>
            <button
              onClick={() => onTabChange('logs')}
              className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 py-1.5 ${
                activeTab === 'logs'
                  ? 'text-white font-semibold border-b-2 border-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              Audit Logs
            </button>
          </nav>

          {/* Zone 3: Primary action & live link status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Now button */}
            <button
              onClick={onSyncNow}
              disabled={syncStatus.isSyncing}
              title={syncStatus.url ? `Sync with Google Sheet (${syncStatus.url})` : 'Sync local data'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-zinc-200' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">
                {syncStatus.isSyncing ? 'Syncing...' : syncStatus.url ? 'Live Linked' : 'Offline'}
              </span>
            </button>

            {/* Admin Status / Toggle */}
            {adminSettings.isUnlocked ? (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md text-xs text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline font-medium">Admin</span>
                <button
                  onClick={onLockAdmin}
                  title="Lock Admin Mode (Return to Regular Member Mode)"
                  className="ml-1 p-0.5 hover:text-white rounded hover:bg-amber-500/20 transition-colors"
                >
                  <Lock className="w-3 h-3 text-amber-400/80 hover:text-amber-200" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminUnlock}
                title="Admin Authentication (Coaches / Leads)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xl:inline">Admin Login</span>
              </button>
            )}

            {/* Club Assets / Logos Download */}
            {onOpenAssetsModal && (
              <button
                onClick={onOpenAssetsModal}
                title="Download Club Logos & Custom QR Badges"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xl:inline">Logos &amp; QR</span>
              </button>
            )}

            {/* Toggle Phone UI Mode */}
            {onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                title="Preview / Switch to Phone View"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden xl:inline">Phone UI</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title={adminSettings.isUnlocked ? 'Google Sheet API & System Settings' : 'Settings (Admin Authentication Required)'}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors relative"
            >
              <Settings className="w-4 h-4" />
              {syncStatus.url ? (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              ) : (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* Primary Action Button: Check In / Out */}
            <button
              onClick={onOpenCheckout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-all shadow-sm whitespace-nowrap shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Check In / Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-zinc-900 py-2 overflow-x-auto gap-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('inventory')}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => onTabChange('teams')}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'teams' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            Teams
          </button>
          <button
            onClick={() => onTabChange('packlist')}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'packlist' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            Pack List
          </button>
          <button
            onClick={() => onTabChange('logs')}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>
    </header>
  );
};
