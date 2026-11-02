import React from 'react';
import {
  RefreshCw,
  Settings,
  Lock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Download,
} from 'lucide-react';
import { SyncStatus, AdminSettings } from '../types';

interface MobileTopHeaderProps {
  syncStatus: SyncStatus;
  adminSettings: AdminSettings;
  onOpenSettings: () => void;
  onSyncNow: () => void;
  onOpenAdminUnlock: () => void;
  onLockAdmin: () => void;
  isMobileModeForced: boolean;
  onToggleViewMode: () => void;
  onOpenAssetsModal?: () => void;
}

export const MobileTopHeader: React.FC<MobileTopHeaderProps> = ({
  syncStatus,
  adminSettings,
  onOpenSettings,
  onSyncNow,
  onOpenAdminUnlock,
  onLockAdmin,
  isMobileModeForced,
  onToggleViewMode,
  onOpenAssetsModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0c0e12] border-b border-[#1c222b] h-13 px-3 flex items-center justify-between">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#161a22] border border-zinc-800 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
          <img
            src="/assets/aistudio/lt_logo_transparent.png"
            alt="Lake Travis Robotics Logo"
            className="w-full h-full object-contain select-none"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs font-bold tracking-tight text-white truncate flex items-center gap-1.5">
            <span>VEX 654</span>
            <span className="text-[10px] text-zinc-400 font-normal">MOBILE</span>
          </h1>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Sync status */}
        <button
          onClick={onSyncNow}
          disabled={syncStatus.isSyncing}
          aria-label="Sync with Google Sheet"
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-zinc-300' : ''}`} />
        </button>

        {/* Admin status / login */}
        {adminSettings.isUnlocked ? (
          <button
            onClick={onLockAdmin}
            title="Admin Unlocked (Tap to lock)"
            className="flex items-center gap-1 px-2.5 py-1 min-h-[34px] bg-[#141820] border border-amber-500/50 rounded-lg text-amber-400 text-xs font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">ADMIN</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminUnlock}
            title="Admin Login"
            aria-label="Admin Login"
            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* View mode toggle button */}
        <button
          onClick={onToggleViewMode}
          title={isMobileModeForced ? 'Switch to Desktop Layout' : 'Switch to Dedicated Mobile Layout'}
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors"
        >
          {isMobileModeForced ? (
            <Monitor className="w-3.5 h-3.5 text-zinc-300" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-zinc-300 hover:text-white bg-[#141820] hover:bg-[#1c222c] border border-[#212631] rounded-lg transition-colors relative"
        >
          <Settings className="w-3.5 h-3.5" />
          {syncStatus.url && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
