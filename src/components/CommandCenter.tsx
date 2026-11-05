import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Download,
  Filter,
  Sparkles,
  X,
  ExternalLink,
  Box,
  Layers,
  MapPin,
  ChevronRight,
  Radio as RadioIcon,
  Cpu,
  Eye,
  Check,
} from 'lucide-react';
import {
  InventoryItem,
  AuditLog,
  VexCategory,
  ActiveTab,
  CLUB_TEAMS,
  classifyVexCategory,
  getCategoryDefaultLocation,
} from '../types';
import { playClick, playBeep, playSuccess } from '../services/soundFx';
import { getVexHardwareSpec, VEX_HARDWARE_SPECS } from '../data/vexSpecs';

interface CommandCenterProps {
  items: InventoryItem[];
  logs: AuditLog[];
  onNavigateToCategory: (category: VexCategory | 'All') => void;
  onNavigateToTeam: (team: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCheckout: (item?: InventoryItem, defaultAction?: 'Check Out' | 'Check In') => void;
  isAdmin?: boolean;
  onOpenAdminUnlock?: () => void;
}

const SENSOR_CATEGORIES: VexCategory[] = ['Optical', 'Distance', 'Inertial', 'Rotational'];

export const CommandCenter: React.FC<CommandCenterProps> = ({
  items,
  logs,
  onNavigateToCategory,
  onNavigateToTeam,
  onNavigateTab,
  onOpenCheckout,
  isAdmin = false,
  onOpenAdminUnlock,
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Available' | 'Brain' | 'Radio' | 'Sensors' | 'Solenoids'>('All');
  const [activeCabinetFilter, setActiveCabinetFilter] = useState<string | null>(null);

  // Drilldown modal states
  const [activeDrilldown, setActiveDrilldown] = useState<'none' | 'overdue' | 'maintenance' | 'readiness'>('none');

  const totalCount = items.length;
  const availableCount = items.filter((i) => i.status === 'Available').length;
  const checkedOutCount = items.filter((i) => i.status === 'Checked Out').length;
  const utilizationRate = totalCount > 0 ? ((checkedOutCount / totalCount) * 100).toFixed(0) : '0';

  // Check overdue (>= 14 days or >= 100 days)
  const now = Date.now();
  const parseDateMs = (dStr?: string): number => {
    if (!dStr) return 0;
    const t = new Date(dStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  const overdueItems100d = items.filter((i) => {
    if (i.status !== 'Checked Out' || !i.dateOut) return false;
    const dateOutMs = parseDateMs(i.dateOut);
    if (!dateOutMs) return false;
    const diffDays = (now - dateOutMs) / (1000 * 60 * 60 * 24);
    return diffDays >= 100;
  });

  const longHeldItems = items.filter((i) => {
    if (i.status !== 'Checked Out' || !i.dateOut) return false;
    const dateOutMs = parseDateMs(i.dateOut);
    if (!dateOutMs) return false;
    const diffDays = (now - dateOutMs) / (1000 * 60 * 60 * 24);
    return diffDays >= 14;
  });

  // Teams breakdown initialized with all club teams
  const teamMap: Record<string, number> = {};
  CLUB_TEAMS.forEach((t) => {
    teamMap[t] = 0;
  });

  items.forEach((item) => {
    if (item.status === 'Checked Out' && item.currentUser) {
      teamMap[item.currentUser] = (teamMap[item.currentUser] || 0) + 1;
    }
  });

  // Count active borrowers (teams with >= 1 item held)
  const activeBorrowersCount = Object.values(teamMap).filter((cnt) => cnt > 0).length;

  // Maintenance issues reported in notes or item records
  const maintenanceLogs = logs.filter((l) =>
    /(not work|broken|damage|crack|bent|dead|issue|fault|defect|fail|repair)/i.test(l.notes || '')
  );

  const maintenanceItems = items.filter((i) =>
    /(not work|broken|damage|crack|bent|dead|issue|fault|defect|fail|repair)/i.test(i.notes || '')
  );

  // High-level category rollup matching Google Sheets & Screenshot
  const getItemCat = (i: InventoryItem) => classifyVexCategory(i.category, i.itemName, i.itemId);

  const sensorsItems = items.filter((i) => SENSOR_CATEGORIES.includes(getItemCat(i)) || i.category === 'Sensors');
  const sensorsCheckedOut = sensorsItems.filter((i) => i.status === 'Checked Out').length;
  const sensorsAvailable = sensorsItems.length - sensorsCheckedOut;

  const radioItems = items.filter((i) => getItemCat(i) === 'Radio');
  const radioCheckedOut = radioItems.filter((i) => i.status === 'Checked Out').length;
  const radioAvailable = radioItems.length - radioCheckedOut;

  const brainItems = items.filter((i) => getItemCat(i) === 'Brain');
  const brainCheckedOut = brainItems.filter((i) => i.status === 'Checked Out').length;
  const brainAvailable = brainItems.length - brainCheckedOut;

  const solenoidItems = items.filter((i) => getItemCat(i) === 'Solenoids');
  const solenoidCheckedOut = solenoidItems.filter((i) => i.status === 'Checked Out').length;
  const solenoidAvailable = solenoidItems.length - solenoidCheckedOut;

  // Cabinet stats
  const cabinet1Available = brainAvailable + radioAvailable;
  const pneumaticsAvailable = solenoidAvailable;
  const sensorsCabinetAvailable = sensorsAvailable;

  // Fast 1-click borrow shortcuts: Find the first available item of each popular category
  const firstAvailableBrain = items.find((i) => getItemCat(i) === 'Brain' && i.status === 'Available');
  const firstAvailableRadio = items.find((i) => getItemCat(i) === 'Radio' && i.status === 'Available');
  const firstAvailableSolenoid = items.find((i) => getItemCat(i) === 'Solenoids' && i.status === 'Available');
  const firstAvailableInertial = items.find((i) => getItemCat(i) === 'Inertial' && i.status === 'Available');
  const firstAvailableOptical = items.find((i) => getItemCat(i) === 'Optical' && i.status === 'Available');
  const firstAvailableDistance = items.find((i) => getItemCat(i) === 'Distance' && i.status === 'Available');

  const summaryRows = [
    {
      name: 'Sensors (Total)',
      targetCategory: 'Sensors' as VexCategory,
      total: sensorsItems.length,
      available: sensorsAvailable,
      checkedOut: sensorsCheckedOut,
      percentAvail: sensorsItems.length > 0 ? Math.round((sensorsAvailable / sensorsItems.length) * 100) : 0,
    },
    {
      name: 'Radio',
      targetCategory: 'Radio' as VexCategory,
      total: radioItems.length,
      available: radioAvailable,
      checkedOut: radioCheckedOut,
      percentAvail: radioItems.length > 0 ? Math.round((radioAvailable / radioItems.length) * 100) : 0,
    },
    {
      name: 'Brain',
      targetCategory: 'Brain' as VexCategory,
      total: brainItems.length,
      available: brainAvailable,
      checkedOut: brainCheckedOut,
      percentAvail: brainItems.length > 0 ? Math.round((brainAvailable / brainItems.length) * 100) : 0,
    },
    {
      name: 'Solonoid',
      targetCategory: 'Solenoids' as VexCategory,
      total: solenoidItems.length,
      available: solenoidAvailable,
      checkedOut: solenoidCheckedOut,
      percentAvail: solenoidItems.length > 0 ? Math.round((solenoidAvailable / solenoidItems.length) * 100) : 0,
    },
  ];

  // Active teams sorted by checkout count
  const sortedTeams = Object.entries(teamMap)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Filtered items for quick part availability search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && categoryFilter === 'All' && !activeCabinetFilter) {
      return [];
    }

    const q = searchQuery.toLowerCase().trim();

    return items
      .filter((item) => {
        const cat = getItemCat(item);
        const loc = item.location || getCategoryDefaultLocation(cat);

        // Cabinet filter
        if (activeCabinetFilter && loc !== activeCabinetFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter === 'Available' && item.status !== 'Available') return false;
        if (categoryFilter === 'Brain' && cat !== 'Brain') return false;
        if (categoryFilter === 'Radio' && cat !== 'Radio') return false;
        if (categoryFilter === 'Sensors' && !SENSOR_CATEGORIES.includes(cat) && item.category !== 'Sensors') return false;
        if (categoryFilter === 'Solenoids' && cat !== 'Solenoids') return false;

        // Query filter
        if (!q) return true;

        return (
          item.itemId.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.currentUser && item.currentUser.toLowerCase().includes(q)) ||
          loc.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [items, searchQuery, categoryFilter, activeCabinetFilter]);

  // Recent 4 log entries for live lab activity
  const recentLogs = useMemo(() => {
    return [...logs].slice(-4).reverse();
  }, [logs]);

  // Time formatter
  const formatTimeAgo = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      const diffSec = Math.floor((now - d.getTime()) / 1000);
      if (isNaN(diffSec) || diffSec < 0) return timestamp;
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return timestamp;
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = [
      'Item ID',
      'Item Name',
      'Category',
      'Status',
      'Current User / Team',
      'Date Out',
      'Cabinet Location',
      'Times Checked Out',
      'Notes',
    ];
    const rows = items.map((i) => [
      `"${i.itemId}"`,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.status}"`,
      `"${i.currentUser || ''}"`,
      `"${i.dateOut || ''}"`,
      `"${i.location || getCategoryDefaultLocation(i.category)}"`,
      i.timesCheckedOut || 0,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VEX_Inventory_Snapshot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Strip: Command Center Title & Top Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>VEX Robotics Inventory — Command Center</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-dot shrink-0" />
            <span>Live telemetry — updates automatically as parts are scanned in and out across all 11 club teams</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => {
              playClick();
              onNavigateTab('packlist');
            }}
            className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#161a22] hover:bg-[#21262d] border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 btn-tactile"
          >
            <Box className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pack List</span>
          </button>
          <button
            onClick={() => {
              playClick();
              handleExportCSV();
            }}
            title="Download CSV snapshot of all 178 inventory items"
            className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#161a22] hover:bg-[#21262d] border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 btn-tactile"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              playBeep();
              onOpenCheckout(undefined, 'Check Out');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded-lg transition-colors shadow-sm active:scale-[0.97] btn-tactile"
          >
            Check Out
          </button>
          <button
            onClick={() => {
              playBeep();
              onOpenCheckout(undefined, 'Check In');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded-lg transition-colors shadow-sm active:scale-[0.97] btn-tactile"
          >
            Check In
          </button>
        </div>
      </div>

      {/* 2. Borrower Station Banner: Member Self-Service Kiosk */}
      <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-xl">
          <div className="text-[11px] font-mono font-medium tracking-wider text-zinc-400 uppercase">
            BORROWER STATION · Member Self-Service Kiosk
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            Checking Out or Returning Hardware?
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Click component type (e.g. Solenoid, Brain, Radio, Optical) &amp; enter part number. Borrower email
            address is strictly required for accountability.
          </p>
        </div>

        {/* Interactive Cabinet Locations Inset Box */}
        <div className="bg-[#0b0d11] border border-zinc-800/80 rounded-lg p-3 text-xs font-mono text-zinc-300 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3 font-semibold text-zinc-200">
            <span>Cabinet Locations:</span>
            {activeCabinetFilter && (
              <button
                onClick={() => setActiveCabinetFilter(null)}
                className="text-[10px] text-amber-400 hover:underline font-normal"
              >
                Clear filter
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveCabinetFilter(activeCabinetFilter === 'Cabinet 1' ? null : 'Cabinet 1')}
            className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between gap-2 text-xs ${
              activeCabinetFilter === 'Cabinet 1'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
          >
            <span>· Cabinet 1: <strong className="text-zinc-300 font-normal">Brain, Radio</strong></span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">{cabinet1Available} ready</span>
          </button>
          <button
            onClick={() =>
              setActiveCabinetFilter(activeCabinetFilter === 'Pneumatics Cabinet' ? null : 'Pneumatics Cabinet')
            }
            className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between gap-2 text-xs ${
              activeCabinetFilter === 'Pneumatics Cabinet'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
          >
            <span>· Pneumatics: <strong className="text-zinc-300 font-normal">Solenoids</strong></span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">{pneumaticsAvailable} ready</span>
          </button>
          <button
            onClick={() =>
              setActiveCabinetFilter(activeCabinetFilter === 'Sensor Cabinet' ? null : 'Sensor Cabinet')
            }
            className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between gap-2 text-xs ${
              activeCabinetFilter === 'Sensor Cabinet'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
          >
            <span>· Sensor Cabinet: <strong className="text-zinc-300 font-normal">All Sensors</strong></span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">{sensorsCabinetAvailable} ready</span>
          </button>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenCheckout(undefined, 'Check Out')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded-lg transition-colors shadow-sm whitespace-nowrap text-center active:scale-[0.98]"
          >
            + Check Out Part
          </button>
          <button
            onClick={() => onOpenCheckout(undefined, 'Check In')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded-lg transition-colors shadow-sm whitespace-nowrap text-center active:scale-[0.98]"
          >
            ← Check In / Return
          </button>
        </div>
      </div>

      {/* 2B. USEFUL TOOL: Instant Part Availability Finder & 1-Click Fast Borrow */}
      <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1e242c]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs font-bold tracking-wider text-white uppercase">
              INSTANT PART AVAILABILITY &amp; LOCATION FINDER
            </h3>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              · Search 178 parts across all cabinets
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {(['All', 'Available', 'Brain', 'Radio', 'Sensors', 'Solenoids'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCategoryFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === filter
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white bg-[#181d27]'
                }`}
              >
                {filter === 'Available' ? 'Available Only' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by part name or ID (e.g. Brain, Inertial, VEXSOL-3, 654V, Cabinet 1)..."
            className="w-full pl-10 pr-24 py-2.5 bg-[#0b0d11] border border-[#1e242c] focus:border-amber-500 rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* 1-Click Fast Borrow Shortcuts (When no active search query) */}
        {!searchQuery && !activeCabinetFilter && categoryFilter === 'All' && (
          <div className="mt-3.5 pt-3 border-t border-[#1a2029]">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Fast Kiosk Borrow (Opens Checkout Pre-Filled)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => firstAvailableBrain && onOpenCheckout(firstAvailableBrain, 'Check Out')}
                disabled={!firstAvailableBrain}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Brain</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableBrain ? firstAvailableBrain.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {brainAvailable} in Cabinet 1
                </div>
              </button>

              <button
                onClick={() => firstAvailableRadio && onOpenCheckout(firstAvailableRadio, 'Check Out')}
                disabled={!firstAvailableRadio}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Radio</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableRadio ? firstAvailableRadio.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {radioAvailable} in Cabinet 1
                </div>
              </button>

              <button
                onClick={() => firstAvailableSolenoid && onOpenCheckout(firstAvailableSolenoid, 'Check Out')}
                disabled={!firstAvailableSolenoid}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Solenoid</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableSolenoid ? firstAvailableSolenoid.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {solenoidAvailable} in Pneumatics
                </div>
              </button>

              <button
                onClick={() => firstAvailableInertial && onOpenCheckout(firstAvailableInertial, 'Check Out')}
                disabled={!firstAvailableInertial}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Inertial Sensor</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableInertial ? firstAvailableInertial.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Sensor Cabinet</div>
              </button>

              <button
                onClick={() => firstAvailableDistance && onOpenCheckout(firstAvailableDistance, 'Check Out')}
                disabled={!firstAvailableDistance}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Distance Sensor</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableDistance ? firstAvailableDistance.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Sensor Cabinet</div>
              </button>

              <button
                onClick={() => firstAvailableOptical && onOpenCheckout(firstAvailableOptical, 'Check Out')}
                disabled={!firstAvailableOptical}
                className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1e242c] hover:border-zinc-700 rounded-lg text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Optical Sensor</div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                  {firstAvailableOptical ? firstAvailableOptical.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Sensor Cabinet</div>
              </button>
            </div>
          </div>
        )}

        {/* Live Search Results */}
        {(searchQuery || activeCabinetFilter || categoryFilter !== 'All') && (
          <div className="mt-3.5 pt-3 border-t border-[#1a2029]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
              <span>
                Matching Hardware ({searchResults.length}{' '}
                {searchResults.length === 8 ? 'shown — refine search' : 'found'})
              </span>
              <button
                onClick={() => {
                  onNavigateToCategory('All');
                }}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View full list in Inventory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 bg-[#0b0d11] rounded-lg border border-[#1c222b]">
                No components found matching &ldquo;{searchQuery}&rdquo;. Check spelling or clear filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {searchResults.map((item) => {
                  const cat = getItemCat(item);
                  const loc = item.location || getCategoryDefaultLocation(cat);
                  const isAvail = item.status === 'Available';

                  return (
                    <div
                      key={item.itemId}
                      className="p-3 bg-[#0b0d11] border border-[#1c222b] hover:border-zinc-700 rounded-lg flex flex-col justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-bold text-white">{item.itemId}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                              isAvail
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isAvail ? 'Available' : `Held by ${item.currentUser || 'Team'}`}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-300 font-medium truncate">{item.itemName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{loc}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center gap-2">
                        {isAvail ? (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check Out')}
                            className="w-full py-1 text-[11px] font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded transition-colors text-center"
                          >
                            + Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check In')}
                            className="w-full py-1 text-[11px] font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded transition-colors text-center"
                          >
                            ← Return
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Eight Metric Cards (2 rows of 4 cards) - Interactive with Drilldown click */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Row 1 */}
        <div
          onClick={() => {
            playClick();
            onNavigateTab('inventory');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>TOTAL ITEMS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-2">
            {totalCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Cataloged in database</div>
        </div>

        <div
          onClick={() => {
            playClick();
            setCategoryFilter('Available');
            const searchEl = document.querySelector('input[type="text"]');
            if (searchEl) (searchEl as HTMLInputElement).focus();
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>AVAILABLE NOW</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
            {availableCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Ready in storage</div>
        </div>

        <div
          onClick={() => {
            playClick();
            setActiveDrilldown('overdue');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>CHECKED OUT NOW</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-400 mt-2">
            {checkedOutCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Click to view borrowers</div>
        </div>

        <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5 card-hover-lift shadow-sm">
          <div className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            UTILIZATION
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-2">
            {utilizationRate}%
          </div>
          <div className="text-xs text-zinc-500 mt-1">Fleet deployment</div>
        </div>

        {/* Row 2 */}
        <div
          onClick={() => {
            playClick();
            setActiveDrilldown('overdue');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>OVERDUE ITEMS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-2">
            {overdueItems100d.length}
          </div>
          <div
            className={`text-xs font-medium mt-1 ${
              overdueItems100d.length === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {overdueItems100d.length === 0 ? 'Nothing overdue (≥100d)' : `${overdueItems100d.length} overdue parts`}
          </div>
        </div>

        <div
          onClick={() => {
            playClick();
            onNavigateTab('logs');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>TOTAL LOG ENTRIES</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-2">
            {logs.length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Audit transactions</div>
        </div>

        <div
          onClick={() => {
            playClick();
            setActiveDrilldown('readiness');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>ACTIVE BORROWERS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-2">
            {activeBorrowersCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">11 teams in club</div>
        </div>

        <div
          onClick={() => {
            playClick();
            setActiveDrilldown('maintenance');
          }}
          className="bg-[#12161f] border border-[#1e242c] hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all group card-hover-lift shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>MAINTENANCE REPORTS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-400 mt-2">
            {maintenanceLogs.length}
          </div>
          <div className="text-xs font-medium text-amber-400 mt-1">
            {maintenanceLogs.length} flagged report(s)
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Category Table & Live Feed (Left) vs Active Checkouts & Team Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Inventory Summary Table + Recent Live Activity */}
        <div className="lg:col-span-8 space-y-5">
          {/* Inventory Summary by Category */}
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e242c]">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-white uppercase">
                  INVENTORY SUMMARY BY CATEGORY
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Top-level component groups and stock readiness
                </p>
              </div>
              <button
                onClick={() => onNavigateToCategory('All')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span>Browse all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e242c] text-zinc-400 text-xs font-medium">
                    <th className="pb-3 px-3 font-semibold">Category</th>
                    <th className="pb-3 px-3 font-semibold text-right">Total</th>
                    <th className="pb-3 px-3 font-semibold text-right">Available</th>
                    <th className="pb-3 px-3 font-semibold text-right">Checked Out</th>
                    <th className="pb-3 px-3 font-semibold text-right">% Available</th>
                    <th className="pb-3 px-3 font-semibold w-36">Visual Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2029]">
                  {summaryRows.map((row) => {
                    const availPct = row.total > 0 ? (row.available / row.total) * 100 : 0;
                    const outPct = row.total > 0 ? (row.checkedOut / row.total) * 100 : 0;

                    return (
                      <tr
                        key={row.name}
                        onClick={() => onNavigateToCategory(row.targetCategory)}
                        className="hover:bg-[#181d27] cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3 font-medium text-white group-hover:text-amber-400 transition-colors">
                          {row.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-300">
                          {row.total}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                          {row.available}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 font-semibold">
                          {row.checkedOut}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-300">
                          {row.percentAvail}%
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-28 h-2 bg-[#222834] rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${availPct}%` }}
                              className="h-full bg-emerald-500 rounded-l-full"
                            />
                            <div
                              style={{ width: `${outPct}%` }}
                              className="h-full bg-amber-500 rounded-r-full"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  <tr className="border-t-2 border-[#1e242c] font-bold bg-[#0e1218]/40">
                    <td className="py-3 px-3 text-white font-bold">TOTAL</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-white font-bold">
                      {totalCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                      {availableCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 font-bold">
                      {checkedOutCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-white font-bold">
                      {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-28 h-2 bg-[#222834] rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${totalCount > 0 ? (availableCount / totalCount) * 100 : 0}%` }}
                          className="h-full bg-emerald-500 rounded-l-full"
                        />
                        <div
                          style={{ width: `${totalCount > 0 ? (checkedOutCount / totalCount) * 100 : 0}%` }}
                          className="h-full bg-amber-500 rounded-r-full"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Useful Addition: Recent Live Activity Feed */}
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e242c]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold tracking-wider text-white uppercase">
                  RECENT LAB TRANSACTIONS (LIVE STREAM)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>All {logs.length} Audit Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#1a2029]">
              {recentLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">No activity logged yet.</div>
              ) : (
                recentLogs.map((log) => {
                  const isCheckOut = log.action === 'Check Out';
                  return (
                    <div
                      key={log.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider ${
                            isCheckOut
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{log.itemId}</span>
                            <span className="text-zinc-400 text-xs">
                              {isCheckOut ? 'borrowed by' : 'returned by'}{' '}
                              <strong className="text-amber-400 font-semibold">Team {log.team}</strong>
                            </span>
                          </div>
                          {log.notes && (
                            <div className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-md">
                              &ldquo;{log.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono shrink-0 sm:text-right">
                        <span>{log.userEmail}</span>
                        <span className="text-zinc-400 font-medium">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Who Has What — Active Checkouts by Team */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e242c]">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-white uppercase">
                  WHO HAS WHAT — ACTIVE CHECKOUTS BY TEAM
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Distribution of {checkedOutCount} active checked out parts
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('teams')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors shrink-0 ml-2"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {sortedTeams.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  All parts are currently returned to storage.
                </div>
              ) : (
                sortedTeams.slice(0, 5).map(([team, count]) => {
                  const pct = checkedOutCount > 0 ? Math.round((count / checkedOutCount) * 100) : 0;
                  return (
                    <div
                      key={team}
                      onClick={() => onNavigateToTeam(team)}
                      className="bg-[#0b0d11] border border-[#1c222b] hover:border-zinc-700 rounded-lg p-3.5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                          Team {team}
                        </span>
                        <span className="font-mono text-xs font-semibold text-white flex items-center gap-1">
                          {count} items{' '}
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-[#1e242e] rounded-full overflow-hidden mb-2">
                        <div
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{pct}% of active checkouts</span>
                        <span>Active robot build</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Useful Addition: Competition Hardware Readiness Matrix Shortcut */}
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e242c]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold tracking-wider text-white uppercase">
                  11-TEAM READINESS RADAR
                </h3>
              </div>
              <button
                onClick={() => setActiveDrilldown('readiness')}
                className="text-xs text-amber-400 hover:underline font-medium"
              >
                Expand
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-2 mb-3">
              Essential electronics checked out across club rosters:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {CLUB_TEAMS.map((team) => {
                const count = teamMap[team] || 0;
                const hasParts = count > 0;
                return (
                  <button
                    key={team}
                    onClick={() => onNavigateToTeam(team)}
                    className="p-2 bg-[#0b0d11] hover:bg-[#181d27] border border-[#1c222b] hover:border-zinc-700 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{team}</span>
                      {hasParts && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      {count} {count === 1 ? 'part' : 'parts'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DRILLDOWN MODAL: Overdue / Long-Held Hardware */}
      {activeDrilldown === 'overdue' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e242c]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Checked Out &amp; Long-Held Hardware ({checkedOutCount} items)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Items currently in circulation across teams. Review for return before match day.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {items
                .filter((i) => i.status === 'Checked Out')
                .map((item) => {
                  const dateOutMs = item.dateOut ? new Date(item.dateOut).getTime() : 0;
                  const daysOut = dateOutMs > 0 ? Math.floor((now - dateOutMs) / (1000 * 60 * 60 * 24)) : 0;
                  const isVeryLong = daysOut >= 14;

                  return (
                    <div
                      key={item.itemId}
                      className="p-3 bg-[#0b0d11] border border-[#1c222b] rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{item.itemId}</span>
                          <span className="text-zinc-300 font-medium">{item.itemName}</span>
                          {isVeryLong && (
                            <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-mono font-semibold rounded">
                              {daysOut}d out
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Held by <strong className="text-white">Team {item.currentUser}</strong>
                          {item.dateOut && ` · Since ${item.dateOut}`}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveDrilldown('none');
                          onOpenCheckout(item, 'Check In');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded transition-colors shrink-0"
                      >
                        ← Return Item
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-[#1e242c] flex justify-end">
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#181d27] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DRILLDOWN MODAL: Flagged Maintenance / Defect Reports */}
      {activeDrilldown === 'maintenance' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e242c]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Flagged Maintenance &amp; Defect Reports ({maintenanceLogs.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Items flagged in notes as broken, damaged, or needing repair. Do not field without inspection.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {maintenanceLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No maintenance flags recorded in audit log notes.
                </div>
              ) : (
                maintenanceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-[#0b0d11] border border-amber-500/20 rounded-lg space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{log.itemId}</span>
                        <span className="text-zinc-300">Team {log.team}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-200 bg-[#161a22] p-2 rounded border border-zinc-800">
                      &ldquo;{log.notes}&rdquo;
                    </div>
                    <div className="text-[10px] text-zinc-500">Reported by {log.userEmail}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#1e242c] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Tip: Include repair notes during Check In</span>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#181d27] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DRILLDOWN MODAL: 11-Team Readiness Radar */}
      {activeDrilldown === 'readiness' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12161f] border border-[#1e242c] rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e242c]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>11-Team Hardware Allocation Matrix</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Detailed distribution of VEX brains, radios, solenoids, and sensors across all 11 teams.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CLUB_TEAMS.map((team) => {
                  const teamItems = items.filter((i) => i.status === 'Checked Out' && i.currentUser === team);
                  const hasBrain = teamItems.some((i) => getItemCat(i) === 'Brain');
                  const hasRadio = teamItems.some((i) => getItemCat(i) === 'Radio');
                  const sensorCount = teamItems.filter((i) => SENSOR_CATEGORIES.includes(getItemCat(i))).length;
                  const solenoidCount = teamItems.filter((i) => getItemCat(i) === 'Solenoids').length;

                  return (
                    <div
                      key={team}
                      className="p-3.5 bg-[#0b0d11] border border-[#1c222b] rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">Team {team}</span>
                        <span className="font-mono text-xs text-amber-400 font-semibold">
                          {teamItems.length} total parts
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                        <div
                          className={`p-1 rounded ${
                            hasBrain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Brain: {hasBrain ? '✓' : '—'}
                        </div>
                        <div
                          className={`p-1 rounded ${
                            hasRadio ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Radio: {hasRadio ? '✓' : '—'}
                        </div>
                        <div
                          className={`p-1 rounded ${
                            sensorCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Sensors: {sensorCount}
                        </div>
                        <div
                          className={`p-1 rounded ${
                            solenoidCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Solenoids: {solenoidCount}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-900 flex justify-end">
                        <button
                          onClick={() => {
                            setActiveDrilldown('none');
                            onNavigateToTeam(team);
                          }}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Manage hardware</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e242c] flex justify-end">
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#181d27] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
