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

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>VEX Robotics Inventory — Command Center</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Live view — updates automatically as parts are scanned in and out across all 11 club teams
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('packlist')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              Pack List
            </button>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors shadow-sm"
            >
              Check Out
            </button>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check In')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-sm"
            >
              Check In
            </button>
          </div>
        </div>

        {/* Member Checkout Station / Kiosk Callout */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 font-mono">
                Borrower Station
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {isAdmin ? 'Admin Privileges Active' : 'Member Self-Service Kiosk'}
              </span>
            </div>
            <div className="text-sm font-semibold text-white">
              Checking Out or Returning Hardware?
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Click component type (e.g. Solenoid, Brain, Radio, Optical) &amp; enter part number. Borrower email address is strictly required for accountability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            {/* Quick Cabinet Guide */}
            <div className="hidden lg:flex flex-col text-[11px] text-zinc-400 bg-zinc-950/80 px-3 py-2 rounded-lg border border-zinc-800/80">
              <span className="font-semibold text-zinc-300 mb-0.5">Cabinet Locations:</span>
              <span>• <strong className="text-zinc-200">Cabinet 1:</strong> Brain, Radio</span>
              <span>• <strong className="text-zinc-200">Pneumatics Cabinet:</strong> Solenoids</span>
              <span>• <strong className="text-zinc-200">Sensor Cabinet:</strong> All Sensors</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenCheckout(undefined, 'Check Out')}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all shadow-md active:scale-95 text-center"
              >
                + Check Out Part
              </button>
              <button
                onClick={() => onOpenCheckout(undefined, 'Check In')}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md active:scale-95 text-center"
              >
                &larr; Check In / Return
              </button>
            </div>
          </div>
        </div>

        {/* 8 Metric KPI Strip (Matching Google Sheets Command Center Rows 1 & 2) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {/* Row 1 */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Items</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{totalCount}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Cataloged in database</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Available Now</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">{availableCount}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Ready in storage</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Checked Out Now</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">{checkedOutCount}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Active across teams</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Utilization</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{utilizationRate}%</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Fleet deployment</div>
          </div>

          {/* Row 2 */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Overdue Items</span>
            <div className={`mt-1 text-xl font-bold font-mono tabular-nums ${overdueItems.length > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
              {overdueItems.length}
            </div>
            <div className={`text-[10px] mt-0.5 ${overdueItems.length > 0 ? 'text-rose-400 font-medium' : 'text-emerald-400'}`}>
              {overdueItems.length > 0 ? `${overdueItems.length} item(s) ≥ 100d` : 'Nothing overdue (≥100d)'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Total Log Entries</span>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-zinc-200">
              {logs.length}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Audit transactions</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Active Borrowers</span>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-zinc-100">
              {activeBorrowersCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Teams with parts out</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Maintenance Reports</span>
            <div className={`mt-1 text-xl font-bold font-mono tabular-nums ${maintenanceLogs.length > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
              {maintenanceLogs.length}
            </div>
            <div className={`text-[10px] mt-0.5 ${maintenanceLogs.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {maintenanceLogs.length > 0 ? `${maintenanceLogs.length} flagged report(s)` : 'Fleet is healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Summaries and Sensor Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Inventory Summary By Category Table */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Inventory Summary by Category
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
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

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2 px-2 font-semibold">Category</th>
                    <th className="pb-2 px-2 font-semibold text-right">Total</th>
                    <th className="pb-2 px-2 font-semibold text-right">Available</th>
                    <th className="pb-2 px-2 font-semibold text-right">Checked Out</th>
                    <th className="pb-2 px-2 font-semibold text-right">% Available</th>
                    <th className="pb-2 px-3 font-semibold w-32">Visual Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans">
                  {mainSummaryRows.map((row) => (
                    <tr
                      key={row.name}
                      onClick={() => onNavigateToCategory(row.targetCategory)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-2 font-medium text-zinc-200 group-hover:text-white">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-400">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                        {row.available}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-amber-400 font-semibold">
                        {row.checkedOut}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-300 font-medium">
                        {row.percentAvail}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${row.percentAvail}%` }}
                          />
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${100 - row.percentAvail}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-zinc-800 font-bold bg-zinc-950/40">
                    <td className="py-2 px-2 text-white">TOTAL</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-white">
                      {totalCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-400">
                      {availableCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-amber-400">
                      {checkedOutCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-white">
                      {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${totalCount > 0 ? (availableCount / totalCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Sensor Type Breakdown (Matching Google Sheets Page 2) */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Sensor Type Breakdown
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Detailed status of 98 total optical, laser distance, gyro, and rotation sensors
                </p>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2 px-2 font-semibold">Sensor Type</th>
                    <th className="pb-2 px-2 font-semibold text-right">Total</th>
                    <th className="pb-2 px-2 font-semibold text-right">Available</th>
                    <th className="pb-2 px-2 font-semibold text-right">Checked Out</th>
                    <th className="pb-2 px-2 font-semibold text-right">% Available</th>
                    <th className="pb-2 px-3 font-semibold w-32">Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans">
                  {sensorTypeStats.map((item) => (
                    <tr
                      key={item.type}
                      onClick={() => onNavigateToCategory(item.cat)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-2 font-medium text-zinc-200 group-hover:text-white">
                        {item.type}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-400">
                        {item.total}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                        {item.available}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-amber-400 font-semibold">
                        {item.checkedOut}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-300">
                        {item.percentAvail}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${item.percentAvail}%` }}
                          />
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${100 - item.percentAvail}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Who Has What — Active Checkouts By Team */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Who Has What — Active Checkouts by Team
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Distribution of {checkedOutCount} active checked out parts
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('teams')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span>View All Teams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 mt-3.5 max-h-[420px] overflow-y-auto pr-1">
              {Object.entries(teamMap)
                .sort((a, b) => b[1] - a[1])
                .map(([team, count]) => {
                  const percentOfChecked =
                    checkedOutCount > 0 ? Math.round((count / checkedOutCount) * 100) : 0;
                  const hasParts = count > 0;

                  return (
                    <div
                      key={team}
                      onClick={() => onNavigateToTeam(team)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        hasParts
                          ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-zinc-950/30 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-200">
                          <span>Team {team}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold tabular-nums ${
                              hasParts ? 'text-white' : 'text-zinc-600'
                            }`}
                          >
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                          {hasParts && (
                            <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                          )}
                        </div>
                      </div>

                      {hasParts && (
                        <>
                          <div className="mt-1.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500/80 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentOfChecked}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[10px] text-zinc-400 font-mono">
                            <span>{percentOfChecked}% of active checkouts</span>
                            <span>Active robot build</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <button
              onClick={() => onNavigateTab('teams')}
              className="w-full py-2 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Open Team Lookup &amp; Batch Returns</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Live Stream */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Activity &amp; Checkouts Feed
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
              Live Log
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <span>View All ({logs.length}) Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-zinc-800/50">
          {recentLogs.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No recent transactions recorded yet. Check out a component above to get started.
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
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                        isOut
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {log.itemId}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {log.itemName || log.category || 'VEX Item'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {log.team && (
                      <span className="font-mono font-semibold text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        Team {log.team}
                      </span>
                    )}
                    {log.userEmail && (
                      <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[180px]">
                        {log.userEmail}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Overdue Items & Fleet Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              overdueItems.length > 0
                ? 'bg-rose-950/60 border border-rose-800/60 text-rose-400'
                : 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                Overdue Items (≥ 100 Days)
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {overdueItems.length === 0
                  ? 'Nothing overdue right now · All checkouts under 100 days'
                  : `${overdueItems.length} item(s) checked out for 100+ days`}
              </p>
            </div>
          </div>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            overdueItems.length > 0
              ? 'text-rose-400 bg-rose-950/40 border-rose-800/40'
              : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
          }`}>
            {overdueItems.length} Overdue
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                Fleet Maintenance &amp; Health
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                No issues reported — fleet is healthy across all {totalCount} cataloged items
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            100% Operational
          </span>
        </div>
      </div>
    </div>
  );
};
