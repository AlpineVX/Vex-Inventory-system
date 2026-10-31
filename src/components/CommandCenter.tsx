import React from 'react';
import {
  Boxes,
  CheckCircle,
  Clock,
  Percent,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Users,
  AlertTriangle,
  Activity,
  Wrench,
  FileText,
} from 'lucide-react';
import { InventoryItem, AuditLog, VexCategory, ActiveTab, CLUB_TEAMS, classifyVexCategory } from '../types';

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
  const totalCount = items.length;
  const availableCount = items.filter((i) => i.status === 'Available').length;
  const checkedOutCount = items.filter((i) => i.status === 'Checked Out').length;
  const utilizationRate = totalCount > 0 ? ((checkedOutCount / totalCount) * 100).toFixed(0) : '0';

  // Check overdue (>= 100 days out)
  const now = Date.now();
  const overdueItems = items.filter((i) => {
    if (i.status !== 'Checked Out' || !i.dateOut) return false;
    const dateOutMs = new Date(i.dateOut).getTime();
    const diffDays = (now - dateOutMs) / (1000 * 60 * 60 * 24);
    return diffDays >= 100;
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

  // Maintenance issues reported in notes
  const maintenanceLogs = logs.filter((l) =>
    /(not work|broken|damage|crack|bent|dead|issue|fault|defect|fail)/i.test(l.notes || '')
  );

  // Recent activity logs sorted newest first
  const recentLogs = [...logs]
    .filter((l) => l && (l.itemId || l.action))
    .sort((a, b) => {
      const tA = new Date(a.timestamp).getTime() || 0;
      const tB = new Date(b.timestamp).getTime() || 0;
      return tB - tA;
    })
    .slice(0, 6);

  // High-level category rollup matching Google Sheets:
  // Sensors (98), Radio (30), Brain (20), Solenoid (31) - Motors removed per user request
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

  const mainSummaryRows = [
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

  // Specific Sensor Type Breakdown:
  const sensorTypeStats = [
    { type: 'Optical', cat: 'Optical' as VexCategory },
    { type: 'Distance', cat: 'Distance' as VexCategory },
    { type: 'Inertial', cat: 'Inertial' as VexCategory },
    { type: 'Rotational', cat: 'Rotational' as VexCategory },
  ].map(({ type, cat }) => {
    const list = items.filter((i) => getItemCat(i) === cat);
    const co = list.filter((i) => i.status === 'Checked Out').length;
    const av = list.length - co;
    const pct = list.length > 0 ? Math.round((av / list.length) * 100) : 0;
    return {
      type,
      cat,
      total: list.length,
      available: av,
      checkedOut: co,
      percentAvail: pct,
    };
  });

  // Calculate low stock categories (less than 25% available in pit)
  const lowStockCategories = mainSummaryRows.filter((row) => row.percentAvail < 25 && row.total > 0);

  return (
    <div className="space-y-5">
      {/* Top Header / Breadcrumb Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-700 uppercase tracking-wider">
              [SYS_STATUS: ACTIVE]
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs text-slate-500">
              VEX_654_PIT_CONTROL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Command Center &amp; Master Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational dashboard tracking live component allocations across all 11 club teams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('packlist')}
            className="px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm transition-colors"
          >
            [PACK_LIST]
          </button>
          <button
            onClick={() => onOpenCheckout(undefined, 'Check Out')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors active:translate-y-px"
          >
            + Check Out
          </button>
          <button
            onClick={() => onOpenCheckout(undefined, 'Check In')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm transition-colors active:translate-y-px"
          >
            &larr; Check In
          </button>
        </div>
      </div>

      {/* Industrial KPI Metrics Strip (4 Sharp Pure-White Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span>[TOTAL_ITEMS]</span>
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cataloged in database</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span>[AVAILABLE_IN_PIT]</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {availableCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for checkout</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span>[CHECKED_OUT]</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {checkedOutCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mounted on robots</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span>[UTILIZATION_RATE]</span>
            <span className="font-mono text-xs font-bold text-slate-700">{utilizationRate}%</span>
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {utilizationRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fleet deployment ratio</div>
        </div>
      </div>

      {/* Asymmetric Dashboard: 2/3 Master Tables & 1/3 Action/Alert Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 2/3 Column: Master Parts Allocation & Sensor Subsystems */}
        <div className="lg:col-span-8 space-y-5">
          {/* Master Parts Category Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  [MASTER_CATEGORY_ALLOCATIONS]
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Core hardware subsystems and pit warehouse readiness ratios
                </p>
              </div>
              <button
                onClick={() => onNavigateToCategory('All')}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <span>Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                    <th className="pb-2 px-2 font-semibold">[CATEGORY]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[TOTAL]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[AVAILABLE]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[OUT]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[% READY]</th>
                    <th className="pb-2 px-3 font-semibold w-28">[STATUS]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {mainSummaryRows.map((row) => (
                    <tr
                      key={row.name}
                      onClick={() => onNavigateToCategory(row.targetCategory)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-2 font-medium text-slate-900 group-hover:text-amber-700">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {row.available}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        {row.checkedOut}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-700 font-medium">
                        {row.percentAvail}%
                      </td>
                      <td className="py-2.5 px-3">
                        {row.percentAvail < 25 ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 rounded-none">
                            [LOW_STOCK]
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200 rounded-none">
                            [NOMINAL]
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 font-bold bg-slate-50">
                    <td className="py-2 px-2 text-slate-900 font-mono">TOTAL_FLEET</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-900">
                      {totalCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-700">
                      {availableCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-amber-700">
                      {checkedOutCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-900">
                      {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}%
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                      [ALL_TEAMS]
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensor Type Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  [SENSOR_SYSTEM_BREAKDOWN]
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed status of 98 total optical, laser distance, inertial, and rotational sensors
                </p>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                    <th className="pb-2 px-2 font-semibold">[SENSOR_TYPE]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[TOTAL]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[AVAILABLE]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[DEPLOYED]</th>
                    <th className="pb-2 px-2 font-semibold text-right">[% READY]</th>
                    <th className="pb-2 px-3 font-semibold w-28">[STATUS]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {sensorTypeStats.map((item) => (
                    <tr
                      key={item.type}
                      onClick={() => onNavigateToCategory(item.cat)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-2 px-2 font-medium text-slate-900 group-hover:text-amber-700">
                        {item.type}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600">
                        {item.total}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {item.available}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        {item.checkedOut}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">
                        {item.percentAvail}%
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200 rounded-none">
                          {item.percentAvail >= 50 ? '[OPTIMAL]' : '[LOW]'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Audit & Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  [AUDIT_TRANSACTION_FEED]
                </h2>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-mono text-slate-500">REALTIME</span>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <span>All Logs ({logs.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 font-sans text-xs">
              {recentLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-500 font-mono">
                  [NO_TRANSACTIONS_RECORDED]
                </div>
              ) : (
                recentLogs.map((log) => {
                  const isOut = log.action === 'Check Out';
                  const date = new Date(log.timestamp);
                  const formattedTime = isNaN(date.getTime())
                    ? log.timestamp
                    : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <div
                      key={log.id}
                      className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-1 rounded-sm transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border rounded-none ${
                            isOut
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isOut ? '[CHECK_OUT]' : '[RETURN]'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {log.itemId}
                        </span>
                        <span className="text-slate-700 truncate max-w-[220px]">
                          {log.itemName || log.category || 'VEX Item'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        {log.team && (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                            Team {log.team}
                          </span>
                        )}
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1/3 Sidebar: Borrower Station, Stock Alerts, & Team Distribution */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Quick Borrower Station */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                  [BORROWER_STATION]
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {isAdmin ? 'ADMIN_ACTIVE' : 'MEMBER_KIOSK'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scan or enter component number. Student email required for accountability.
              </p>
            </div>

            <div className="mt-3.5 space-y-2">
              <button
                onClick={() => onOpenCheckout(undefined, 'Check Out')}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors flex items-center justify-center gap-1.5 active:translate-y-px"
              >
                + Check Out Component
              </button>
              <button
                onClick={() => onOpenCheckout(undefined, 'Check In')}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-colors flex items-center justify-center gap-1.5 active:translate-y-px"
              >
                &larr; Check In / Return Component
              </button>
            </div>

            {/* Cabinet Location Directory */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 font-mono space-y-1 bg-slate-50 p-2.5 border rounded-none">
              <span className="font-bold text-slate-900 block mb-1">[PIT_CABINET_MAP]</span>
              <div>• Cabinet 1: Brain, Radio</div>
              <div>• Pneumatics Bay: Solenoids</div>
              <div>• Sensor Rack: All Sensors</div>
            </div>
          </div>

          {/* 2. Low Stock & Overdue Alerts */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                [ALERTS_&amp;_EXCEPTIONS]
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {/* Overdue alert */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-none">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Overdue Checkouts</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                    overdueItems.length > 0
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {overdueItems.length > 0 ? `[${overdueItems.length}_OVERDUE]` : '[ALL_CLEAR]'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Threshold: &ge; 100 days out. {overdueItems.length === 0 ? 'No delinquent parts.' : `${overdueItems.length} item(s) exceed 100 days.`}
                </p>
              </div>

              {/* Low stock alert */}
              {lowStockCategories.length > 0 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-none">
                  <span className="font-semibold text-amber-900 block">Low Pit Stock Notice</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {lowStockCategories.map((c) => c.name).join(', ')} currently below 25% pit availability.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-none">
                  <span className="font-semibold text-slate-800 block">Subsystem Availability</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    All core categories meet minimum pit buffer quotas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Team Allocations Breakdown */}
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                [ACTIVE_TEAM_HOLDINGS]
              </span>
              <button
                onClick={() => onNavigateTab('teams')}
                className="text-xs font-medium text-amber-700 hover:text-amber-800"
              >
                All Teams
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {Object.entries(teamMap)
                .sort((a, b) => b[1] - a[1])
                .map(([team, count]) => {
                  const hasParts = count > 0;
                  return (
                    <div
                      key={team}
                      onClick={() => onNavigateToTeam(team)}
                      className={`p-2 border rounded-none cursor-pointer transition-colors flex items-center justify-between text-xs ${
                        hasParts
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-900'
                          : 'bg-white border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="font-mono font-bold">Team {team}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono tabular-nums font-semibold ${hasParts ? 'text-slate-900' : 'text-slate-400'}`}>
                          {count} {count === 1 ? 'part' : 'parts'}
                        </span>
                        {hasParts && <ArrowUpRight className="w-3 h-3 text-slate-500" />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
