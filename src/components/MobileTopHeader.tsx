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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-13 px-3 flex items-center justify-between">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
          <img
            src="/assets/aistudio/lt_logo_transparent.png"
            alt="Lake Travis Robotics Logo"
            className="w-full h-full object-contain select-none"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs font-bold font-mono tracking-tight text-slate-900 truncate flex items-center gap-1.5">
            <span>[654_INV]</span>
            <span className="text-[10px] font-mono text-slate-500 font-normal">MOBILE</span>
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
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Admin status / login */}
        {adminSettings.isUnlocked ? (
          <button
            onClick={onLockAdmin}
            title="Admin Unlocked (Tap to lock)"
            className="flex items-center gap-1 px-2 py-1 min-h-[34px] bg-amber-50 border border-amber-300 rounded-sm text-amber-800 text-xs font-mono font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px]">[ADMIN]</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminUnlock}
            title="Admin Login"
            aria-label="Admin Login"
            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* View mode toggle button */}
        <button
          onClick={onToggleViewMode}
          title={isMobileModeForced ? 'Switch to Desktop Layout' : 'Switch to Dedicated Mobile Layout'}
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm transition-colors"
        >
          {isMobileModeForced ? (
            <Monitor className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-amber-600" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm transition-colors relative"
        >
          <Settings className="w-3.5 h-3.5" />
          {syncStatus.url && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
