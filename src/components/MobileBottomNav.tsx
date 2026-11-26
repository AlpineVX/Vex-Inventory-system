import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Plus,
  Users,
  CheckSquare,
  FileText,
  QrCode,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ActiveTab, AdminSettings } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCheckout: () => void;
  availableCount: number;
  totalCount: number;
  adminSettings: AdminSettings;
  onOpenAdminUnlock: () => void;
  onOpenAssetsModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenCheckout,
  availableCount,
  totalCount,
  adminSettings,
  onOpenAdminUnlock,
  onOpenAssetsModal,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-[#27272d] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-5 items-center relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] mx-1 rounded-xl transition-all active:scale-95 ${
            activeTab === 'dashboard'
              ? 'bg-[#1a1a1f] border border-red-500/35 text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <div className={`relative ${activeTab === 'dashboard' ? 'animate-pop' : ''}`}>
            <LayoutDashboard className={`w-4 h-4 transition-colors ${activeTab === 'dashboard' ? 'text-red-400' : 'text-zinc-400'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-1">Home</span>
        </button>

        {/* Tab 2: Inventory */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center min-h-[48px] mx-1 rounded-xl transition-all active:scale-95 relative ${
            activeTab === 'inventory'
              ? 'bg-[#1a1a1f] border border-red-500/35 text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <div className={`relative ${activeTab === 'inventory' ? 'animate-pop' : ''}`}>
            <Boxes className={`w-4 h-4 transition-colors ${activeTab === 'inventory' ? 'text-red-400' : 'text-zinc-400'}`} />
            {availableCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[14px] h-3.5 bg-zinc-800 border border-[#27272d] text-zinc-200 text-[8px] font-mono font-bold rounded-full flex items-center justify-center leading-none">
                {availableCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Stock</span>
        </button>

        {/* Center Tab: Action (Check In / Out) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenCheckout}
            aria-label="Quick Check In or Check Out"
            className="flex flex-col items-center justify-center w-12 h-12 -mt-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg border-2 border-[#09090b] btn-crimson-glow"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Teams */}
        <button
          onClick={() => onTabChange('teams')}
          className={`flex flex-col items-center justify-center min-h-[48px] mx-1 rounded-xl transition-all active:scale-95 ${
            activeTab === 'teams'
              ? 'bg-[#1a1a1f] border border-red-500/35 text-zinc-100 font-semibold'
              : adminSettings.kioskOnly && !adminSettings.isUnlocked
              ? 'text-zinc-500 border border-transparent'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <div className={`relative ${activeTab === 'teams' ? 'animate-pop' : ''}`}>
            <Users className={`w-4 h-4 transition-colors ${activeTab === 'teams' ? 'text-red-400' : 'text-zinc-400'}`} />
            {adminSettings.kioskOnly && !adminSettings.isUnlocked && (
              <Lock className="w-2.5 h-2.5 text-zinc-500 absolute -top-1 -right-2" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Teams</span>
        </button>

        {/* Tab 5: Pack List */}
        <button
          onClick={() => onTabChange('packlist')}
          className={`flex flex-col items-center justify-center min-h-[48px] mx-1 rounded-xl transition-all active:scale-95 ${
            activeTab === 'packlist'
              ? 'bg-[#1a1a1f] border border-red-500/35 text-zinc-100 font-semibold'
              : adminSettings.kioskOnly && !adminSettings.isUnlocked
              ? 'text-zinc-500 border border-transparent'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <div className={`relative ${activeTab === 'packlist' ? 'animate-pop' : ''}`}>
            <CheckSquare className={`w-4 h-4 transition-colors ${activeTab === 'packlist' ? 'text-red-400' : 'text-zinc-400'}`} />
            {adminSettings.kioskOnly && !adminSettings.isUnlocked && (
              <Lock className="w-2.5 h-2.5 text-zinc-500 absolute -top-1 -right-2" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Pack</span>
        </button>
      </div>
    </nav>
  );
};
