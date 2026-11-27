import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
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
  Zap,
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
  QrCode,
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
import { SpotlightCard, AnimatedNumber, AnimatedRingGauge } from './MotionPrimitives';

interface CommandCenterProps {
  items: InventoryItem[];
  logs: AuditLog[];
  onNavigateToCategory: (category: VexCategory | 'All') => void;
  onNavigateToTeam: (team: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCheckout: (item?: InventoryItem, defaultAction?: 'Check Out' | 'Check In') => void;
  onOpenLabelPrinter?: () => void;
  isAdmin?: boolean;
  onOpenAdminUnlock?: () => void;
  isMobileMode?: boolean;
}

const SENSOR_CATEGORIES: VexCategory[] = ['Optical', 'Distance', 'Inertial', 'Rotational'];

export const CommandCenter: React.FC<CommandCenterProps> = ({
  items,
  logs,
  onNavigateToCategory,
  onNavigateToTeam,
  onNavigateTab,
  onOpenCheckout,
  onOpenLabelPrinter,
  isAdmin = false,
  onOpenAdminUnlock,
  isMobileMode = false,
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Available' | 'Brain' | 'Radio' | 'Sensors' | 'Solenoids'>('All');
  const [activeCabinetFilter, setActiveCabinetFilter] = useState<string | null>(null);

  // Sliding pill state for Quick Filter Tabs
  const filterNavRef = useRef<HTMLDivElement>(null);
  const filterBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterPill, setFilterPill] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateFilterPill = () => {
    const activeBtn = filterBtnRefs.current[categoryFilter];
    const container = filterNavRef.current;
    if (!activeBtn || !container || activeBtn.offsetWidth === 0) return;
    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;
    setFilterPill((prev) =>
      prev.ready && prev.left === left && prev.width === width
        ? prev
        : { left, width, ready: true }
    );
  };

  useLayoutEffect(() => {
    updateFilterPill();
  }, [categoryFilter]);

  useEffect(() => {
    const container = filterNavRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updateFilterPill());
    observer.observe(container);
    return () => observer.disconnect();
  }, [categoryFilter]);

  // Drilldown modal states
  const [activeDrilldown, setActiveDrilldown] = useState<'none' | 'overdue' | 'maintenance' | 'readiness'>('none');
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (activeDrilldown === 'none') return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDrilldown('none');
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [activeDrilldown]);

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

  const maintenanceItems = items.filter(
    (i) =>
      i.condition === 'Needs Repair' ||
      /(not work|broken|damage|crack|bent|dead|issue|fault|defect|fail|repair)/i.test(i.notes || '')
  );

  const totalRepairFlagsCount = maintenanceItems.length + maintenanceLogs.length;

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
  const inertialItems = items.filter((i) => getItemCat(i) === 'Inertial');
  const inertialAvailable = inertialItems.filter((i) => i.status === 'Available').length;
  const distanceItems = items.filter((i) => getItemCat(i) === 'Distance');
  const distanceAvailable = distanceItems.filter((i) => i.status === 'Available').length;
  const opticalItems = items.filter((i) => getItemCat(i) === 'Optical');
  const opticalAvailable = opticalItems.filter((i) => i.status === 'Available').length;

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
      name: 'Solenoid',
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
          String(item.itemId || '').toLowerCase().includes(q) ||
          String(item.itemName || '').toLowerCase().includes(q) ||
          String(item.category || '').toLowerCase().includes(q) ||
          String(item.currentUser || '').toLowerCase().includes(q) ||
          String(loc || '').toLowerCase().includes(q) ||
          String(item.notes || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [items, searchQuery, categoryFilter, activeCabinetFilter]);

  // Recent 4 log entries for live lab activity (newest first)
  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 4);
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
      `"${String(i.itemId || '').replace(/"/g, '""')}"`,
      `"${String(i.itemName || '').replace(/"/g, '""')}"`,
      `"${String(i.category || '')}"`,
      `"${String(i.status || '')}"`,
      `"${String(i.currentUser || '')}"`,
      `"${String(i.dateOut || '')}"`,
      `"${String(i.location || getCategoryDefaultLocation(i.category)).replace(/"/g, '""')}"`,
      i.timesCheckedOut || 0,
      `"${String(i.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VEX_Inventory_Snapshot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Strip: Overview Title & Top Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <span>VEX Robotics Inventory</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Live parts count across all club teams
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenLabelPrinter && (
            <button
              onClick={() => {
                playClick();
                onOpenLabelPrinter();
              }}
              className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 btn-tactile"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>QR Labels</span>
            </button>
          )}
          <button
            onClick={() => {
              playClick();
              onNavigateTab('packlist');
            }}
            className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 btn-tactile"
          >
            <Box className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pack List</span>
          </button>
          <button
            onClick={() => {
              playClick();
              handleExportCSV();
            }}
            title={`Download CSV snapshot of all ${items.length} inventory items`}
            className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 btn-tactile"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Live Pit Stock Health Strip */}
      {(() => {
        const repairOnlyCount = items.filter((i) => i.condition === 'Needs Repair').length;
        const healthyAvailCount = items.filter((i) => i.status === 'Available' && i.condition !== 'Needs Repair').length;
        const safeTotal = Math.max(1, totalCount);
        const readyPct = (healthyAvailCount / safeTotal) * 100;
        const outPct = (checkedOutCount / safeTotal) * 100;
        const repairPct = (repairOnlyCount / safeTotal) * 100;
        return (
          <div className="p-3.5 rounded-xl bg-[#111114] border border-[#27272d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-3 font-mono tabular-nums flex-wrap">
                  <span className="text-zinc-200 font-semibold">
                    {healthyAvailCount} Ready
                  </span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveDrilldown('overdue');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    {checkedOutCount} Checked Out
                  </button>
                  {repairOnlyCount > 0 && (
                    <>
                      <span className="text-zinc-600" aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setActiveDrilldown('maintenance');
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                      >
                        {repairOnlyCount} Needs Repair
                      </button>
                    </>
                  )}
                </div>
                {longHeldItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveDrilldown('overdue');
                    }}
                    className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{longHeldItems.length} out 14+ days</span>
                  </button>
                )}
              </div>
              <div className="w-full h-2 bg-[#09090b] border border-[#27272d] rounded-full overflow-hidden flex">
                <div
                  style={{ width: barsReady ? `${readyPct}%` : '0%' }}
                  className="h-full bg-zinc-200 progress-fill"
                  title={`${healthyAvailCount} Ready`}
                />
                <div
                  style={{ width: barsReady ? `${outPct}%` : '0%' }}
                  className="h-full bg-amber-500 progress-fill"
                  title={`${checkedOutCount} Checked Out`}
                />
                {repairOnlyCount > 0 && (
                  <div
                    style={{ width: barsReady ? `${repairPct}%` : '0%' }}
                    className="h-full bg-red-600 progress-fill"
                    title={`${repairOnlyCount} Needs Repair`}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Quick Check Out / Return Banner */}
      <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 animate-section-enter">
        <div className="max-w-xl">
          <div className="text-[11px] font-mono font-medium tracking-wider text-zinc-400 uppercase">
            QUICK CHECK OUT &amp; RETURN
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
            Borrowing or Returning Parts?
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Select a part type (like Solenoid, Brain, Radio, or Optical) and enter the part number.{' '}
            {isAdmin
              ? 'Admin mode active — email is optional.'
              : 'Your school email is required so we know who has each part.'}
          </p>
        </div>

        {/* Interactive Cabinet Locations Inset Box */}
        <div className="bg-[#09090b] border border-zinc-800/80 rounded-lg p-3 text-xs font-mono text-zinc-300 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3 font-semibold text-zinc-200">
            <span>Cabinet Locations:</span>
            {activeCabinetFilter && (
              <button
                onClick={() => setActiveCabinetFilter(null)}
                className="text-[10px] text-red-400 hover:underline font-normal"
              >
                Clear filter
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveCabinetFilter(activeCabinetFilter === 'Cabinet 1' ? null : 'Cabinet 1')}
            className={`w-full text-left px-2 py-1 rounded transition-all flex items-center justify-between gap-2 text-xs btn-tactile ${
              activeCabinetFilter === 'Cabinet 1'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent'
            }`}
          >
            <span>· Cabinet 1: <strong className="text-zinc-300 font-normal">Brain, Radio</strong></span>
            <span className="text-[10px] font-bold text-zinc-200 font-mono">{cabinet1Available} ready</span>
          </button>
          <button
            onClick={() =>
              setActiveCabinetFilter(activeCabinetFilter === 'Pneumatics Cabinet' ? null : 'Pneumatics Cabinet')
            }
            className={`w-full text-left px-2 py-1 rounded transition-all flex items-center justify-between gap-2 text-xs btn-tactile ${
              activeCabinetFilter === 'Pneumatics Cabinet'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent'
            }`}
          >
            <span>· Pneumatics: <strong className="text-zinc-300 font-normal">Solenoids</strong></span>
            <span className="text-[10px] font-bold text-zinc-200 font-mono">{pneumaticsAvailable} ready</span>
          </button>
          <button
            onClick={() =>
              setActiveCabinetFilter(activeCabinetFilter === 'Sensor Cabinet' ? null : 'Sensor Cabinet')
            }
            className={`w-full text-left px-2 py-1 rounded transition-all flex items-center justify-between gap-2 text-xs btn-tactile ${
              activeCabinetFilter === 'Sensor Cabinet'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent'
            }`}
          >
            <span>· Sensor Cabinet: <strong className="text-zinc-300 font-normal">All Sensors</strong></span>
            <span className="text-[10px] font-bold text-zinc-200 font-mono">{sensorsCabinetAvailable} ready</span>
          </button>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onOpenCheckout(undefined, 'Check Out')}
            className="min-h-[44px] sm:min-h-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl sm:rounded-lg shadow-sm whitespace-nowrap flex items-center justify-center btn-crimson-glow"
          >
            + Check Out Part
          </button>
          <button
            onClick={() => onOpenCheckout(undefined, 'Check In')}
            className="min-h-[44px] sm:min-h-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-xl sm:rounded-lg shadow-sm whitespace-nowrap flex items-center justify-center btn-tactile"
          >
            ← Check In
          </button>
        </div>
      </SpotlightCard>

      {/* 2B. USEFUL TOOL: Instant Part Availability Finder & 1-Click Fast Borrow */}
      <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-4 sm:p-5 animate-section-enter stagger-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#27272d]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-red-400 shrink-0" />
            <h3 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
              QUICK PART SEARCH
            </h3>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              · {items.length} tracked parts
            </span>
          </div>

          {/* Quick Filter Tabs with Spring Sliding Pill */}
          <div
            ref={filterNavRef}
            className="relative flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-[#09090b] border border-[#27272d] rounded-lg text-xs shrink-0"
          >
            {filterPill.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translateX(${filterPill.left - 4}px)`,
                  width: `${filterPill.width}px`,
                }}
                className="absolute top-1 bottom-1 left-1 rounded-md bg-red-600 shadow-sm pointer-events-none transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
              />
            )}
            {(['All', 'Available', 'Brain', 'Radio', 'Sensors', 'Solenoids'] as const).map((filter) => (
              <button
                key={filter}
                ref={(el) => {
                  filterBtnRefs.current[filter] = el;
                }}
                onClick={() => {
                  playClick();
                  setCategoryFilter(filter);
                }}
                className={`relative z-10 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                  categoryFilter === filter
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
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
            data-global-search="true"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by part name or ID (e.g. Brain, Inertial, VEXSOL-3, 654V, Cabinet 1)..."
            className="w-full pl-10 pr-24 py-2.5 bg-[#09090b] border border-[#27272d] focus:border-red-500 crimson-focus-glow rounded-lg text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#1a1a1f] border border-[#27272d] rounded">
                /
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#1a1a1f] border border-[#27272d] rounded">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* 1-Click Borrow Shortcuts */}
        {!searchQuery && !activeCabinetFilter && categoryFilter === 'All' && (
          <div className="mt-3.5 pt-3 border-t border-[#1a1a1f] animate-fade-in-up">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>Quick Check Out</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => firstAvailableBrain && onOpenCheckout(firstAvailableBrain, 'Check Out')}
                disabled={!firstAvailableBrain}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-1"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Brain</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableBrain ? firstAvailableBrain.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{brainAvailable}</span> in Cabinet 1
                </div>
              </button>

              <button
                onClick={() => firstAvailableRadio && onOpenCheckout(firstAvailableRadio, 'Check Out')}
                disabled={!firstAvailableRadio}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-2"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Radio</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableRadio ? firstAvailableRadio.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{radioAvailable}</span> in Cabinet 1
                </div>
              </button>

              <button
                onClick={() => firstAvailableSolenoid && onOpenCheckout(firstAvailableSolenoid, 'Check Out')}
                disabled={!firstAvailableSolenoid}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-3"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Solenoid</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableSolenoid ? firstAvailableSolenoid.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{solenoidAvailable}</span> in Pneumatics
                </div>
              </button>

              <button
                onClick={() => firstAvailableInertial && onOpenCheckout(firstAvailableInertial, 'Check Out')}
                disabled={!firstAvailableInertial}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-4"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Inertial Sensor</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableInertial ? firstAvailableInertial.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{inertialAvailable}</span> in Sensor Cabinet
                </div>
              </button>

              <button
                onClick={() => firstAvailableDistance && onOpenCheckout(firstAvailableDistance, 'Check Out')}
                disabled={!firstAvailableDistance}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-5"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Distance Sensor</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableDistance ? firstAvailableDistance.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{distanceAvailable}</span> in Sensor Cabinet
                </div>
              </button>

              <button
                onClick={() => firstAvailableOptical && onOpenCheckout(firstAvailableOptical, 'Check Out')}
                disabled={!firstAvailableOptical}
                className="p-2.5 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left group disabled:opacity-50 card-hover-lift animate-card-enter stagger-6"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono">
                  <span>Optical Sensor</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-red-400 truncate mt-0.5 transition-colors">
                  {firstAvailableOptical ? firstAvailableOptical.itemId : 'None Available'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-200">{opticalAvailable}</span> in Sensor Cabinet
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Live Search Results */}
        {(searchQuery || activeCabinetFilter || categoryFilter !== 'All') && (
          <div className="mt-3.5 pt-3 border-t border-[#1a1a1f] animate-fade-in-up">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
              <span>
                Matching Parts ({searchResults.length}{' '}
                {searchResults.length === 8 ? 'shown — refine search' : 'found'})
              </span>
              <button
                onClick={() => {
                  onNavigateToCategory('All');
                }}
                className="text-red-400 hover:underline flex items-center gap-1"
              >
                <span>View full list in Inventory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 bg-[#09090b] rounded-lg border border-[#27272d]">
                No parts found matching &ldquo;{searchQuery}&rdquo;. Check spelling or clear filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {searchResults.map((item, idx) => {
                  const cat = getItemCat(item);
                  const loc = item.location || getCategoryDefaultLocation(cat);
                  const isAvail = item.status === 'Available';

                  return (
                    <div
                      key={`${item.itemId}-${idx}`}
                      style={{ '--row-idx': idx } as React.CSSProperties}
                      className="p-3 bg-[#09090b] border border-[#27272d] rounded-lg flex flex-col justify-between card-hover-lift animate-row-enter"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-bold text-zinc-100">{item.itemId}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                              isAvail
                                ? 'bg-zinc-200/10 text-zinc-200 border border-zinc-400/25'
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

                      <div className="mt-3 pt-2 border-t border-[#1a1a1f] flex items-center gap-2">
                        {isAvail ? (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check Out')}
                            className="w-full py-1 text-[11px] font-semibold text-zinc-100 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded transition-colors text-center btn-tactile"
                          >
                            + Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check In')}
                            className="w-full py-1 text-[11px] font-semibold text-zinc-100 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded transition-colors text-center btn-tactile"
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
      </SpotlightCard>

      {/* 3. Eight Metric Cards (2 rows of 4 cards) - Interactive with Drilldown click & subtle 3D tilt */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Row 1 */}
        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            onNavigateTab('inventory');
          }}
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-1"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>TOTAL ITEMS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={totalCount} />
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 mt-1">Total club parts</div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            setCategoryFilter('Available');
            const searchEl = document.querySelector<HTMLInputElement>('input[data-global-search="true"], input[type="text"]');
            if (searchEl) searchEl.focus();
          }}
          spotlightColor="rgba(244, 244, 245, 0.08)"
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-2"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>AVAILABLE NOW</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={availableCount} />
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-300 font-medium mt-1">Ready in storage</div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            setActiveDrilldown('overdue');
          }}
          spotlightColor="rgba(245, 158, 11, 0.1)"
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-3"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>CHECKED OUT</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={checkedOutCount} />
          </div>
          <div className="text-[11px] sm:text-xs text-amber-400 font-medium mt-1">Tap to view borrowers</div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 card-hover-lift shadow-sm animate-card-enter stagger-4 flex items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase truncate">
              IN USE
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
              <AnimatedNumber value={Number(utilizationRate)} suffix="%" />
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 mt-1 truncate">Parts checked out</div>
          </div>
          <div className="shrink-0 hidden xs:block sm:block">
            <AnimatedRingGauge
              percent={Number(utilizationRate)}
              size={44}
              strokeWidth={4}
              strokeColor="#c52329"
            />
          </div>
        </SpotlightCard>

        {/* Row 2 */}
        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            setActiveDrilldown('overdue');
          }}
          spotlightColor="rgba(245, 158, 11, 0.1)"
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-5"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>OVERDUE</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={overdueItems100d.length} />
          </div>
          <div
            className={`text-[11px] sm:text-xs font-medium mt-1 ${
              overdueItems100d.length === 0 ? 'text-zinc-300' : 'text-amber-400'
            }`}
          >
            {overdueItems100d.length === 0 ? 'Nothing overdue (≥100d)' : `${overdueItems100d.length} overdue parts`}
          </div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            onNavigateTab('logs');
          }}
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-6"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>ACTIVITY LOG</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={logs.length} />
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 mt-1">Recorded entries</div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            setActiveDrilldown('readiness');
          }}
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-7"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>BORROWERS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={activeBorrowersCount} />
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 mt-1">{CLUB_TEAMS.length} club teams &amp; RECF</div>
        </SpotlightCard>

        <SpotlightCard
          tilt
          onClick={() => {
            playClick();
            setActiveDrilldown('maintenance');
          }}
          spotlightColor="rgba(245, 158, 11, 0.1)"
          className="bg-[#111114] border border-[#27272d] rounded-xl p-3.5 sm:p-5 cursor-pointer group card-hover-lift shadow-sm animate-card-enter stagger-8"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>REPAIR FLAGS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
            <AnimatedNumber value={totalRepairFlagsCount} />
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-amber-400 mt-1">
            {totalRepairFlagsCount} {totalRepairFlagsCount === 1 ? 'flagged item' : 'flagged items'}
          </div>
        </SpotlightCard>
      </div>

      {/* 4. Bottom Section: Category Table & Live Feed (Left) vs Active Checkouts & Team Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Inventory Summary Table + Recent Live Activity */}
        <div className="lg:col-span-8 space-y-5">
          {/* Inventory Summary by Category */}
          <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-5 animate-section-enter stagger-2">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272d]">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  INVENTORY BY CATEGORY
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Parts available across each category
                </p>
              </div>
              <button
                onClick={() => onNavigateToCategory('All')}
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors group"
              >
                <span>Browse all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Mobile Compact Category Cards (no sideways scrolling) */}
            <div className={`mt-3 space-y-2.5 ${isMobileMode ? 'block' : 'sm:hidden'}`}>
              {summaryRows.map((row) => {
                const availPct = row.total > 0 ? (row.available / row.total) * 100 : 0;
                const outPct = row.total > 0 ? (row.checkedOut / row.total) * 100 : 0;
                return (
                  <button
                    key={row.name}
                    type="button"
                    onClick={() => onNavigateToCategory(row.targetCategory)}
                    className="w-full p-3 rounded-xl bg-[#09090b] border border-[#27272d] text-left space-y-2 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-100">{row.name}</span>
                      <span className="text-xs font-mono text-zinc-300 tabular-nums">
                        <strong className="text-zinc-100">{row.available}</strong>/{row.total} ready ({row.percentAvail}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#1a1a1f] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: barsReady ? `${availPct}%` : '0%' }}
                        className="h-full bg-zinc-300 rounded-l-full progress-fill"
                      />
                      <div
                        style={{ width: barsReady ? `${outPct}%` : '0%' }}
                        className="h-full bg-amber-500 rounded-r-full progress-fill"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop Summary Table */}
            <div className={`${isMobileMode ? 'hidden' : 'hidden sm:block'} mt-4 overflow-x-auto`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#27272d] text-zinc-400 text-xs font-medium">
                    <th className="pb-3 px-3 font-semibold">Category</th>
                    <th className="pb-3 px-3 font-semibold text-right">Total</th>
                    <th className="pb-3 px-3 font-semibold text-right">Available</th>
                    <th className="pb-3 px-3 font-semibold text-right">Checked Out</th>
                    <th className="pb-3 px-3 font-semibold text-right">% Available</th>
                    <th className="pb-3 px-3 font-semibold w-36">Visual Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1f]">
                  {summaryRows.map((row, idx) => {
                    const availPct = row.total > 0 ? (row.available / row.total) * 100 : 0;
                    const outPct = row.total > 0 ? (row.checkedOut / row.total) * 100 : 0;

                    return (
                      <tr
                        key={row.name}
                        style={{ '--row-idx': idx } as React.CSSProperties}
                        onClick={() => onNavigateToCategory(row.targetCategory)}
                        className="hover:bg-[#1a1a1f] cursor-pointer transition-colors group animate-row-enter"
                      >
                        <td className="py-3 px-3 font-medium text-zinc-100 group-hover:text-red-400 transition-colors">
                          {row.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-300">
                          {row.total}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-200 font-semibold">
                          {row.available}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 font-semibold">
                          {row.checkedOut}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-300">
                          {row.percentAvail}%
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-28 h-2 bg-[#1a1a1f] rounded-full overflow-hidden flex">
                            <div
                              style={{ width: barsReady ? `${availPct}%` : '0%' }}
                              className="h-full bg-zinc-300 rounded-l-full progress-fill"
                            />
                            <div
                              style={{ width: barsReady ? `${outPct}%` : '0%' }}
                              className="h-full bg-amber-500 rounded-r-full progress-fill"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  <tr className="border-t-2 border-[#27272d] font-bold bg-[#09090b]/40">
                    <td className="py-3 px-3 text-zinc-100 font-bold">TOTAL</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-100 font-bold">
                      {totalCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-200 font-bold">
                      {availableCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 font-bold">
                      {checkedOutCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-100 font-bold">
                      {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-28 h-2 bg-[#1a1a1f] rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: barsReady
                              ? `${totalCount > 0 ? (availableCount / totalCount) * 100 : 0}%`
                              : '0%',
                          }}
                          className="h-full bg-zinc-300 rounded-l-full progress-fill"
                        />
                        <div
                          style={{
                            width: barsReady
                              ? `${totalCount > 0 ? (checkedOutCount / totalCount) * 100 : 0}%`
                              : '0%',
                          }}
                          className="h-full bg-amber-500 rounded-r-full progress-fill"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SpotlightCard>

          {/* Recent Checkouts & Returns */}
          <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-5 animate-section-enter stagger-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272d]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  RECENT CHECKOUTS &amp; RETURNS
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors group"
              >
                <span>All {logs.length} Logs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#1a1a1f]">
              {recentLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">No activity logged yet.</div>
              ) : (
                recentLogs.map((log, idx) => {
                  const isCheckOut = log.action === 'Check Out';
                  return (
                    <div
                      key={log.id}
                      style={{ '--row-idx': idx } as React.CSSProperties}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-row-enter"
                    >
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider shrink-0 ${
                            isCheckOut
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-200/10 text-zinc-200 border border-zinc-400/25'
                          }`}
                        >
                          {log.action}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-zinc-100">{log.itemId}</span>
                            <span className="text-zinc-400 text-xs">
                              {isCheckOut ? 'borrowed by' : 'returned by'}{' '}
                              <strong className="text-amber-400 font-semibold">Team {log.team}</strong>
                            </span>
                          </div>
                          {log.notes && (
                            <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                              &ldquo;{log.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-zinc-500 text-[11px] font-mono shrink-0 sm:text-right">
                        {log.userEmail && <span className="truncate max-w-[200px]">{log.userEmail}</span>}
                        <span className="text-zinc-400 font-medium">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column (4 cols): Active Checkouts by Team */}
        <div className="lg:col-span-4 space-y-5">
          <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-5 animate-section-enter stagger-2">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272d]">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  CHECKED OUT BY TEAM
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Where {checkedOutCount} checked out parts are right now
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('teams')}
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors shrink-0 ml-2 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {sortedTeams.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  All parts are currently returned to storage.
                </div>
              ) : (
                sortedTeams.slice(0, 5).map(([team, count], idx) => {
                  const pct = checkedOutCount > 0 ? Math.round((count / checkedOutCount) * 100) : 0;
                  return (
                    <div
                      key={team}
                      style={{ '--row-idx': idx } as React.CSSProperties}
                      onClick={() => onNavigateToTeam(team)}
                      className="bg-[#09090b] border border-[#27272d] rounded-lg p-3.5 cursor-pointer group card-hover-lift animate-row-enter"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-zinc-100 text-sm group-hover:text-amber-400 transition-colors">
                          Team {team}
                        </span>
                        <span className="font-mono text-xs font-semibold text-zinc-100 flex items-center gap-1">
                          {count} items{' '}
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-[#1a1a1f] rounded-full overflow-hidden mb-2">
                        <div
                          style={{ width: barsReady ? `${Math.min(pct, 100)}%` : '0%' }}
                          className="h-full bg-amber-500 rounded-full progress-fill"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{pct}% of checked out parts</span>
                        <span>On robot</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SpotlightCard>

          {/* Team Equipment Overview */}
          <SpotlightCard className="bg-[#111114] border border-[#27272d] rounded-xl p-5 animate-section-enter stagger-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272d]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  TEAM EQUIPMENT OVERVIEW
                </h3>
              </div>
              <button
                onClick={() => setActiveDrilldown('readiness')}
                className="text-xs text-red-400 hover:underline font-medium"
              >
                Expand
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-2 mb-3">
              Parts currently checked out by each team:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {CLUB_TEAMS.map((team, idx) => {
                const count = teamMap[team] || 0;
                const hasParts = count > 0;
                return (
                  <button
                    key={team}
                    style={{ '--row-idx': idx } as React.CSSProperties}
                    onClick={() => onNavigateToTeam(team)}
                    className="p-2 bg-[#09090b] hover:bg-[#1a1a1f] border border-[#27272d] rounded-lg text-left card-hover-lift animate-row-enter"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{team}</span>
                      {hasParts && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      {count} {count === 1 ? 'part' : 'parts'}
                    </div>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* 5. DRILLDOWN MODAL: Checked Out Parts */}
      {activeDrilldown === 'overdue' && (
        <div
          onClick={() => setActiveDrilldown('none')}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] pb-[env(safe-area-inset-bottom,16px)] flex flex-col animate-modal-enter"
          >
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-[#27272d]">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Checked Out Parts ({checkedOutCount})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Parts currently signed out by teams. Check these before tournament travel.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {items
                .filter((i) => i.status === 'Checked Out')
                .map((item, idx) => {
                  const dateOutMs = item.dateOut ? new Date(item.dateOut).getTime() : 0;
                  const daysOut = dateOutMs > 0 ? Math.max(0, Math.floor((now - dateOutMs) / (1000 * 60 * 60 * 24))) : 0;
                  const isVeryLong = daysOut >= 14;

                  return (
                    <div
                      key={item.itemId}
                      style={{ '--row-idx': idx } as React.CSSProperties}
                      className="p-3 bg-[#09090b] border border-[#27272d] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs animate-row-enter hover:border-zinc-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-zinc-100">{item.itemId}</span>
                          <span className="text-zinc-300 font-medium truncate">{item.itemName}</span>
                          {isVeryLong && (
                            <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-mono font-semibold rounded">
                              {daysOut}d out
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Held by <strong className="text-zinc-100">Team {item.currentUser}</strong>
                          {item.dateOut && ` · Since ${item.dateOut}`}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveDrilldown('none');
                          onOpenCheckout(item, 'Check In');
                        }}
                        className="min-h-[38px] sm:min-h-0 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg sm:rounded transition-colors shrink-0 btn-tactile"
                      >
                        ← Return Item
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-[#27272d] flex justify-end">
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] rounded-lg transition-colors btn-tactile"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DRILLDOWN MODAL: Repair Flags */}
      {activeDrilldown === 'maintenance' && (
        <div
          onClick={() => setActiveDrilldown('none')}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] pb-[env(safe-area-inset-bottom,16px)] flex flex-col animate-modal-enter"
          >
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-[#27272d]">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Parts Flagged for Repair ({totalRepairFlagsCount})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Parts flagged as damaged or needing repair. Check hardware before mounting to a robot.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {maintenanceItems.map((item, idx) => (
                <div
                  key={`flag-${item.itemId}`}
                  style={{ '--row-idx': idx } as React.CSSProperties}
                  className="p-3.5 bg-[#09090b] border border-red-500/35 rounded-lg space-y-1.5 text-xs animate-row-enter"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-red-400 shrink-0">{item.itemId}</span>
                      <span className="text-zinc-200 font-semibold truncate">{item.itemName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/35 font-mono text-[10px] font-bold shrink-0">
                      NEEDS REPAIR
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {item.location || getCategoryDefaultLocation(item.category)} · {item.currentUser ? `Team ${item.currentUser}` : 'In Pit'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDrilldown('none');
                        onOpenCheckout(item, item.status === 'Checked Out' ? 'Check In' : 'Check Out');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-zinc-100 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-md transition-colors btn-tactile"
                    >
                      {item.status === 'Checked Out' ? '← Return Item' : 'Inspect / Log'}
                    </button>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-zinc-200 bg-[#1a1a1f] p-2 rounded border border-zinc-800">
                      &ldquo;{item.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))}

              {totalRepairFlagsCount === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No damage flags or repair notes found.
                </div>
              ) : (
                maintenanceLogs.map((log, idx) => (
                  <div
                    key={log.id}
                    style={{ '--row-idx': maintenanceItems.length + idx } as React.CSSProperties}
                    className="p-3.5 bg-[#09090b] border border-amber-500/20 rounded-lg space-y-1 text-xs animate-row-enter"
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
                    <div className="text-xs text-zinc-200 bg-[#1a1a1f] p-2 rounded border border-zinc-800">
                      &ldquo;{log.notes}&rdquo;
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Reported by {log.userEmail || 'Admin'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#27272d] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Tip: Include repair notes during Check In</span>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] rounded-lg transition-colors btn-tactile"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DRILLDOWN MODAL: Team Parts Summary */}
      {activeDrilldown === 'readiness' && (
        <div
          onClick={() => setActiveDrilldown('none')}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] pb-[env(safe-area-inset-bottom,16px)] flex flex-col animate-modal-enter"
          >
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-[#27272d]">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400" />
                  <span>Team Parts Summary</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Brains, radios, solenoids, and sensors checked out across all {CLUB_TEAMS.length} club teams.
                </p>
              </div>
              <button
                onClick={() => setActiveDrilldown('none')}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md btn-tactile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CLUB_TEAMS.map((team, idx) => {
                  const teamItems = items.filter((i) => i.status === 'Checked Out' && i.currentUser === team);
                  const hasBrain = teamItems.some((i) => getItemCat(i) === 'Brain');
                  const hasRadio = teamItems.some((i) => getItemCat(i) === 'Radio');
                  const sensorCount = teamItems.filter((i) => SENSOR_CATEGORIES.includes(getItemCat(i))).length;
                  const solenoidCount = teamItems.filter((i) => getItemCat(i) === 'Solenoids').length;

                  return (
                    <div
                      key={team}
                      style={{ '--row-idx': idx } as React.CSSProperties}
                      className="p-3.5 bg-[#09090b] border border-[#27272d] rounded-lg text-xs space-y-2 card-hover-lift animate-row-enter"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100 text-sm">Team {team}</span>
                        <span className="font-mono text-xs text-amber-400 font-semibold">
                          {teamItems.length} total parts
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                        <div
                          className={`p-1 rounded ${
                            hasBrain ? 'bg-zinc-200/15 text-zinc-100 border border-zinc-400/25' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Brain: {hasBrain ? 'YES' : '—'}
                        </div>
                        <div
                          className={`p-1 rounded ${
                            hasRadio ? 'bg-zinc-200/15 text-zinc-100 border border-zinc-400/25' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          Radio: {hasRadio ? 'YES' : '—'}
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
                          className="text-[11px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors group"
                        >
                          <span>Manage hardware</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272d] flex justify-end">
              <button
                onClick={() => setActiveDrilldown('none')}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] rounded-lg transition-colors btn-tactile"
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
