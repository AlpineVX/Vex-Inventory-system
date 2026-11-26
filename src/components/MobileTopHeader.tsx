import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Settings,
  Lock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Activity,
  Volume2,
  VolumeX,
  FileText,
  MoreHorizontal,
  QrCode,
  X,
  Search,
  Download,
} from 'lucide-react';
import { ActiveTab, SyncStatus, AdminSettings } from '../types';
import { playClick, playToggle } from '../services/soundFx';

interface MobileTopHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  syncStatus: SyncStatus;
  adminSettings: AdminSettings;
  onOpenSettings: () => void;
  onSyncNow: () => void;
  onOpenAdminUnlock: () => void;
  onLockAdmin: () => void;
  isMobileModeForced: boolean;
  onToggleViewMode: () => void;
  onOpenAssetsModal?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenLabelPrinter?: () => void;
  canInstallApp?: boolean;
  onInstallApp?: () => void;
}

const TAB_LABELS: Record<ActiveTab, string> = {
  dashboard: 'Home',
  inventory: 'Stock',
  teams: 'Teams',
  packlist: 'Pack List',
  logs: 'Activity Log',
};

export const MobileTopHeader: React.FC<MobileTopHeaderProps> = ({
  activeTab,
  onTabChange,
  syncStatus,
  adminSettings,
  onOpenSettings,
  onSyncNow,
  onOpenAdminUnlock,
  onLockAdmin,
  isMobileModeForced,
  onToggleViewMode,
  onOpenAssetsModal,
  soundEnabled = true,
  onToggleSound,
  onOpenDiagnostics,
  onOpenCommandPalette,
  onOpenLabelPrinter,
  canInstallApp = false,
  onInstallApp,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272d] h-[52px] px-3 flex items-center justify-between no-print">
      {/* Left: Logo & Active View Context */}
      <button
        type="button"
        onClick={() => {
          playClick();
          onTabChange('dashboard');
        }}
        className="flex items-center gap-2.5 min-w-0 group text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#1a1a1f] border border-zinc-800 flex items-center justify-center p-0.5 overflow-hidden shrink-0 group-hover:border-red-500/70 transition-all duration-200">
          <img
            src="/assets/aistudio/lt_logo_transparent.png"
            alt="Lake Travis Robotics Logo"
            className="w-full h-full object-contain select-none"
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold tracking-tight text-zinc-100 truncate flex items-center gap-1.5">
            <span>VEX 654</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-[10px] text-zinc-400 font-mono font-medium truncate">
              {TAB_LABELS[activeTab]}
            </span>
          </div>
        </div>
      </button>

      {/* Right: Spacious Essential Touch Controls */}
      <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
        {onOpenCommandPalette && (
          <button
            onClick={() => {
              playClick();
              onOpenCommandPalette();
            }}
            title="Quick Jump & Search"
            aria-label="Quick Jump and Search"
            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-zinc-300 hover:text-zinc-100 bg-[#111114] border border-[#27272d] rounded-xl transition-colors btn-tactile"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Activity Log quick access */}
        <button
          onClick={() => {
            playClick();
            onTabChange(activeTab === 'logs' ? 'dashboard' : 'logs');
          }}
          title="Activity Log"
          aria-label="Activity Log"
          className={`min-w-[38px] min-h-[38px] px-2 flex items-center justify-center gap-1 border rounded-xl transition-colors btn-tactile ${
            activeTab === 'logs'
              ? 'bg-red-600/20 border-red-500/50 text-red-400'
              : 'text-zinc-300 hover:text-zinc-100 bg-[#111114] border-[#27272d]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[11px] font-medium hidden xs:inline">Log</span>
        </button>

        {/* Sync button */}
        <button
          onClick={() => {
            playClick();
            onSyncNow();
          }}
          disabled={syncStatus.isSyncing}
          aria-label="Sync with Google Sheet"
          className="min-w-[38px] min-h-[38px] flex items-center justify-center text-zinc-300 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-xl transition-colors relative btn-tactile"
        >
          <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin text-zinc-200' : ''}`} />
          <span
            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
              syncStatus.url ? 'bg-red-500' : 'bg-amber-400'
            }`}
          />
        </button>

        {/* Admin status / login */}
        {adminSettings.isUnlocked ? (
          <button
            onClick={() => {
              playToggle();
              onLockAdmin();
            }}
            title="Admin Unlocked (Tap to lock)"
            className="flex items-center gap-1 px-2.5 min-h-[38px] bg-[#111114] border border-amber-500/50 rounded-xl text-amber-400 text-xs font-medium btn-tactile"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[11px]">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => {
              playClick();
              onOpenAdminUnlock();
            }}
            title="Admin Sign In"
            aria-label="Admin Sign In"
            className="min-w-[38px] min-h-[38px] flex items-center justify-center text-zinc-300 hover:text-zinc-100 bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] rounded-xl transition-colors btn-tactile"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* More Tools Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              playClick();
              setMenuOpen((prev) => !prev);
            }}
            aria-label="More Options"
            aria-expanded={menuOpen}
            className={`min-w-[38px] min-h-[38px] flex items-center justify-center border rounded-xl transition-colors btn-tactile ${
              menuOpen
                ? 'bg-[#1a1a1f] border-red-500/50 text-zinc-100'
                : 'text-zinc-300 hover:text-zinc-100 bg-[#111114] border-[#27272d]'
            }`}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-60 bg-[#111114] border border-[#27272d] rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-modal-enter">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  playClick();
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Sheet &amp; Admin Settings</span>
                </span>
                {syncStatus.url && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>

              {onOpenLabelPrinter && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    playClick();
                    onOpenLabelPrinter();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                >
                  <QrCode className="w-4 h-4 text-red-400" />
                  <span>Print QR Bin Labels</span>
                </button>
              )}

              {onOpenAssetsModal && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    playClick();
                    onOpenAssetsModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                >
                  <QrCode className="w-4 h-4 text-zinc-400" />
                  <span>Logos &amp; QR Badges</span>
                </button>
              )}

              {canInstallApp && onInstallApp && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    playClick();
                    onInstallApp();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Download className="w-4 h-4 text-red-400" />
                  <span>Install App</span>
                </button>
              )}

              {onOpenDiagnostics && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    playClick();
                    onOpenDiagnostics();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                >
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <span>App Status &amp; Cache</span>
                </button>
              )}

              {onToggleSound && (
                <button
                  onClick={() => {
                    onToggleSound();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-red-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                    )}
                    <span>Sound Effects</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {soundEnabled ? 'ON' : 'MUTED'}
                  </span>
                </button>
              )}

              <div className="border-t border-[#27272d] my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  playClick();
                  onToggleViewMode();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-[#1a1a1f] transition-colors"
              >
                {isMobileModeForced ? (
                  <>
                    <Monitor className="w-4 h-4 text-zinc-400" />
                    <span>Switch to Desktop View</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 text-red-400" />
                    <span>Keep Phone View</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
