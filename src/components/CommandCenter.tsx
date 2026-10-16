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
} from 'lucide-react';
import { InventoryItem, AuditLog, VexCategory, ActiveTab, CLUB_TEAMS } from '../types';

interface CommandCenterProps {
  items: InventoryItem[];
  logs: AuditLog[];
  onNavigateToCategory: (category: VexCategory | 'All') => void;
  onNavigateToTeam: (team: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCheckout: (item?: InventoryItem) => void;
}

const CATEGORIES: VexCategory[] = [
  'Motors',
  'Brain',
  'Radio',
  'Optical',
  'Distance',
  'Inertial',
  'Rotational',
  'Solenoids',
];

export const CommandCenter: React.FC<CommandCenterProps> = ({
  items,
  logs,
  onNavigateToCategory,
  onNavigateToTeam,
  onNavigateTab,
  onOpenCheckout,
}) => {
  const totalCount = items.length;
  const availableCount = items.filter((i) => i.status === 'Available').length;
  const checkedOutCount = items.filter((i) => i.status === 'Checked Out').length;
  const utilizationRate = totalCount > 0 ? ((checkedOutCount / totalCount) * 100).toFixed(1) : '0.0';

  // Teams breakdown initialized with all 11 club teams
  const teamMap: Record<string, number> = {};
  CLUB_TEAMS.forEach((t) => {
    teamMap[t] = 0;
  });

  items.forEach((item) => {
    if (item.status === 'Checked Out' && item.currentUser) {
      teamMap[item.currentUser] = (teamMap[item.currentUser] || 0) + 1;
    }
  });

  // Category counts
  const categoryStats = CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    const catCheckedOut = catItems.filter((i) => i.status === 'Checked Out').length;
    const catAvailable = catItems.length - catCheckedOut;
    const percent = catItems.length > 0 ? Math.round((catCheckedOut / catItems.length) * 100) : 0;
    return {
      category: cat,
      total: catItems.length,
      available: catAvailable,
      checkedOut: catCheckedOut,
      percent,
    };
  });

  return (
    <div className="space-y-8">
      {/* Hero Overview Strip */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Command Center
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Active operational status of 279 cataloged VEX Robotics competition components
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('packlist')}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              Pack List Status
            </button>
            <button
              onClick={() => onOpenCheckout()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
            >
              Rapid Check Out
            </button>
          </div>
        </div>

        {/* 4 Core Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Items</span>
              <Boxes className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">{totalCount}</span>
              <span className="text-xs text-zinc-400">cataloged</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>8 categories in database</span>
              <span className="text-emerald-400 font-medium">100% indexed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Available Now</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">{availableCount}</span>
              <span className="text-xs text-zinc-400">in stock</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>Ready for pit build</span>
              <span className="font-mono text-zinc-300 tabular-nums">
                {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}% ready
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Checked Out Now</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-amber-400">{checkedOutCount}</span>
              <span className="text-xs text-zinc-400">assigned</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>Active in robots</span>
              <span className="font-mono text-zinc-300 tabular-nums">Across 3 teams</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Utilization Rate</span>
              <Percent className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-indigo-400">{utilizationRate}%</span>
              <span className="text-xs text-zinc-400">active</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>Inventory efficiency</span>
              <span className="text-emerald-400 font-medium">Optimal buffer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Category Distribution & Team Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-sm font-semibold text-white">Category Distribution & Availability</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Click any category to filter Universal Inventory</p>
              </div>
              <button
                onClick={() => onNavigateToCategory('All')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>View all items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  onClick={() => onNavigateToCategory(cat.category)}
                  className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/70 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                      {cat.category}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {cat.available} / {cat.total} Avail
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${cat.total > 0 ? (cat.available / cat.total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${cat.total > 0 ? (cat.checkedOut / cat.total) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {cat.available} in storage
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {cat.checkedOut} in use
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>High-demand components: V5 11W Motors & Inertial Sensors</span>
            <span className="font-mono tabular-nums text-zinc-400">239 / 279 total ready</span>
          </div>
        </div>

        {/* Right Col: Team Allocations & Quick Roster */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-sm font-semibold text-white">Team Allocations</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Checked out hardware per team</p>
              </div>
              <button
                onClick={() => onNavigateTab('teams')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {Object.entries(teamMap)
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .map(([team, count]) => {
                const percentOfChecked = checkedOutCount > 0 ? Math.round((count / checkedOutCount) * 100) : 0;
                return (
                  <div
                    key={team}
                    onClick={() => onNavigateToTeam(team)}
                    className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70 hover:border-zinc-700 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-zinc-100 group-hover:text-indigo-300 transition-colors">
                          Team {team}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold tabular-nums text-white">
                          {count} items
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentOfChecked}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-zinc-400">
                      <span>{percentOfChecked}% of checked out pool</span>
                      <span className="text-zinc-400 font-mono">Active build</span>
                    </div>
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
              <span>Manage Team Hardware & Returns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Live Logs Feed */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Recent Transactions & Audit Activity</h2>
            <span className="text-xs text-zinc-400">· Last 7 actions logged</span>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Full audit log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                <th className="pb-2.5 pt-1 px-3">Item ID</th>
                <th className="pb-2.5 pt-1 px-3">Action</th>
                <th className="pb-2.5 pt-1 px-3">Team</th>
                <th className="pb-2.5 pt-1 px-3">Item Description</th>
                <th className="pb-2.5 pt-1 px-3">Notes</th>
                <th className="pb-2.5 pt-1 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {logs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-zinc-200">{log.itemId}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-xs font-sans font-medium ${
                        log.action === 'Check Out' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 font-sans font-semibold">
                    {log.team || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-zinc-300 max-w-xs truncate">
                    {log.itemName || log.category || 'VEX Component'}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-zinc-400 max-w-sm truncate">
                    {log.notes || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
