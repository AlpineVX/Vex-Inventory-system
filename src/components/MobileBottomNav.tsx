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
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/90 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-5 items-center relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Dashboard</span>
        </button>

        {/* Tab 2: Inventory */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
            activeTab === 'inventory'
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Boxes className={`w-5 h-5 ${activeTab === 'inventory' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            {availableCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-emerald-500/90 text-zinc-950 text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {availableCount}
              </span>
            )}
            {activeTab === 'inventory' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Inventory</span>
        </button>

        {/* Center Tab: Action (Check In / Out) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenCheckout}
            aria-label="Quick Check In or Check Out"
            className="flex flex-col items-center justify-center w-12 h-12 -mt-4 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 shadow-lg shadow-black/40 border-2 border-zinc-950 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Teams */}
        <button
          onClick={() => onTabChange('teams')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'teams'
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${activeTab === 'teams' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            {activeTab === 'teams' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Teams</span>
        </button>

        {/* Tab 5: Pack List */}
        <button
          onClick={() => onTabChange('packlist')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'packlist'
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <CheckSquare className={`w-5 h-5 ${activeTab === 'packlist' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            {activeTab === 'packlist' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Pack</span>
        </button>
      </div>
    </nav>
  );
};
