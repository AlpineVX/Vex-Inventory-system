import React, { useState, useMemo } from 'react';
import {
  Users,
  RotateCcw,
  Plus,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { InventoryItem, CLUB_TEAMS } from '../types';

interface TeamLookupProps {
  items: InventoryItem[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  onOpenCheckout: (item?: InventoryItem, defaultAction?: 'Check Out' | 'Check In', presetTeam?: string) => void;
  onReturnItem: (item: InventoryItem) => void;
  onReturnAllForTeam: (team: string, itemsToReturn: InventoryItem[]) => void;
}

export const TeamLookup: React.FC<TeamLookupProps> = ({
  items,
  selectedTeam,
  onSelectTeam,
  onOpenCheckout,
  onReturnItem,
  onReturnAllForTeam,
}) => {
  const [customTeamInput, setCustomTeamInput] = useState('');

  // Discover all teams currently with items plus all official club teams
  const allTeamsInSystem = useMemo(() => {
    const set = new Set<string>(CLUB_TEAMS);
    items.forEach((item) => {
      if (item.currentUser) set.add(item.currentUser);
    });
    return Array.from(set);
  }, [items]);

  // Checked out items for the active selected team
  const teamItems = useMemo(() => {
    return items.filter((i) => i.status === 'Checked Out' && i.currentUser === selectedTeam);
  }, [items, selectedTeam]);

  // Category breakdown for this team
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    teamItems.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return map;
  }, [teamItems]);

  const handleAddCustomTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTeamInput.trim().toUpperCase();
    if (clean) {
      onSelectTeam(clean);
      setCustomTeamInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Team Hardware Lookup
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Audit active equipment allocations, drive-bases, and sensor packages across robotics teams
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check Out to {selectedTeam}</span>
            </button>
          </div>
        </div>

        {/* Team Selector Row */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            {allTeamsInSystem.map((team) => {
              const isSelected = selectedTeam === team;
              const count = items.filter((i) => i.status === 'Checked Out' && i.currentUser === team).length;
              return (
                <button
                  key={team}
                  onClick={() => onSelectTeam(team)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team {team}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isSelected ? 'text-zinc-700' : 'text-zinc-500'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick custom team input */}
          <form onSubmit={handleAddCustomTeam} className="flex items-center gap-1.5">
            <input
              type="text"
              value={customTeamInput}
              onChange={(e) => setCustomTeamInput(e.target.value)}
              placeholder="Other Team (e.g. 654X)"
              className="w-36 px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customTeamInput.trim()}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Selected Team Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Checked Out</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">{teamItems.length}</span>
            <span className="text-xs text-zinc-400">components</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Currently mounted or in pit possession
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Primary Subsystems</span>
          <div className="mt-2 text-xs text-zinc-300 space-y-1">
            {Object.keys(categoryBreakdown).length === 0 ? (
              <span className="text-zinc-500">No components checked out</span>
            ) : (
              Object.entries(categoryBreakdown).map(([cat, cnt]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-zinc-300">{cat}</span>
                  <span className="font-mono text-zinc-400 tabular-nums">{cnt} pcs</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Batch Team Actions</span>
            <p className="text-xs text-zinc-400 mt-1">Check in all parts after tournament or season rebuild</p>
          </div>
          <button
            onClick={() => onReturnAllForTeam(selectedTeam, teamItems)}
            disabled={teamItems.length === 0}
            className="mt-3 w-full py-2 px-3 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return All {teamItems.length} Items for Team {selectedTeam}</span>
          </button>
        </div>
      </div>

      {/* Team Item Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Active Components for Team {selectedTeam}</span>
            <span className="text-xs text-zinc-400">· {teamItems.length} items</span>
          </div>
        </div>

        {teamItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
            <p className="text-sm font-medium text-zinc-300">All equipment returned</p>
            <p className="text-xs text-zinc-500 mt-1">Team {selectedTeam} has zero active checkouts.</p>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
            >
              Check Out Parts to {selectedTeam}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 text-zinc-400 border-b border-zinc-800 select-none">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Item ID</th>
                  <th className="py-2.5 px-3 font-semibold">Item Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Checkout Date</th>
                  <th className="py-2.5 px-3 font-semibold">Notes / Robot Subsystem</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {teamItems.map((item) => (
                  <tr key={item.itemId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-200 whitespace-nowrap">
                      {item.itemId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-100">
                      {item.itemName}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                      {item.dateOut || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 max-w-sm truncate">
                      {item.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onReturnItem(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 rounded transition-colors active:scale-95"
                      >
                        Check In (Return)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
