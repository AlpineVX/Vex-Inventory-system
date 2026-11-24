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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b] border-t border-[#27272d] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto px-2 h-14 grid grid-cols-5 items-center relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 ${
            activeTab === 'dashboard'
              ? 'text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className={`relative ${activeTab === 'dashboard' ? 'animate-pop' : ''}`}>
            <LayoutDashboard className={`w-4 h-4 transition-colors ${activeTab === 'dashboard' ? 'text-red-400' : 'text-zinc-400'}`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full animate-pop" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Home</span>
        </button>

        {/* Tab 2: Inventory */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 relative ${
            activeTab === 'inventory'
              ? 'text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className={`relative ${activeTab === 'inventory' ? 'animate-pop' : ''}`}>
            <Boxes className={`w-4 h-4 transition-colors ${activeTab === 'inventory' ? 'text-red-400' : 'text-zinc-400'}`} />
            {availableCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[12px] h-3 bg-zinc-800 text-zinc-200 text-[8px] font-mono font-bold rounded-full flex items-center justify-center leading-none">
                {availableCount}
              </span>
            )}
            {activeTab === 'inventory' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full animate-pop" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Stock</span>
        </button>

        {/* Center Tab: Action (Check In / Out) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenCheckout}
            aria-label="Quick Check In or Check Out"
            className="flex flex-col items-center justify-center w-11 h-11 -mt-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md btn-crimson-glow"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Teams */}
        <button
          onClick={() => onTabChange('teams')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 ${
            activeTab === 'teams'
              ? 'text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className={`relative ${activeTab === 'teams' ? 'animate-pop' : ''}`}>
            <Users className={`w-4 h-4 transition-colors ${activeTab === 'teams' ? 'text-red-400' : 'text-zinc-400'}`} />
            {activeTab === 'teams' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full animate-pop" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Teams</span>
        </button>

        {/* Tab 5: Pack List */}
        <button
          onClick={() => onTabChange('packlist')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 ${
            activeTab === 'packlist'
              ? 'text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className={`relative ${activeTab === 'packlist' ? 'animate-pop' : ''}`}>
            <CheckSquare className={`w-4 h-4 transition-colors ${activeTab === 'packlist' ? 'text-red-400' : 'text-zinc-400'}`} />
            {activeTab === 'packlist' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full animate-pop" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Pack</span>
        </button>
      </div>
    </nav>
  );
};
