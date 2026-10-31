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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto px-2 h-14 grid grid-cols-5 items-center relative font-mono">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-amber-700' : 'text-slate-500'}`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-600 rounded-none" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">[HOME]</span>
        </button>

        {/* Tab 2: Inventory */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors relative ${
            activeTab === 'inventory'
              ? 'text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-amber-700' : 'text-slate-500'}`} />
            {availableCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[12px] h-3 bg-slate-900 text-white text-[8px] font-bold rounded-none flex items-center justify-center leading-none">
                {availableCount}
              </span>
            )}
            {activeTab === 'inventory' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-600 rounded-none" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">[STOCK]</span>
        </button>

        {/* Center Tab: Action (Check In / Out) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenCheckout}
            aria-label="Quick Check In or Check Out"
            className="flex flex-col items-center justify-center w-10 h-10 -mt-2 rounded-sm bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Teams */}
        <button
          onClick={() => onTabChange('teams')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'teams'
              ? 'text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Users className={`w-4 h-4 ${activeTab === 'teams' ? 'text-amber-700' : 'text-slate-500'}`} />
            {activeTab === 'teams' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-600 rounded-none" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">[TEAMS]</span>
        </button>

        {/* Tab 5: Pack List */}
        <button
          onClick={() => onTabChange('packlist')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'packlist'
              ? 'text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <CheckSquare className={`w-4 h-4 ${activeTab === 'packlist' ? 'text-amber-700' : 'text-slate-500'}`} />
            {activeTab === 'packlist' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-600 rounded-none" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">[PACK]</span>
        </button>
      </div>
    </nav>
  );
};
