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
  isAdmin?: boolean;
  onOpenAdminUnlock?: () => void;
}

export const TeamLookup: React.FC<TeamLookupProps> = ({
  items,
  selectedTeam,
  onSelectTeam,
  onOpenCheckout,
  onReturnItem,
  onReturnAllForTeam,
  isAdmin = false,
  onOpenAdminUnlock,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
                [TEAM_ALLOCATIONS]
              </span>
              <span className="text-xs font-mono text-slate-500">654-TEAMS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Team Hardware Lookup
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit active equipment allocations, drive-bases, and sensor packages across robotics teams
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors shadow-none font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[CHECK_OUT] Team {selectedTeam}</span>
            </button>
          </div>
        </div>

        {/* Team Selector Row */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-sm">
            {allTeamsInSystem.map((team) => {
              const isSelected = selectedTeam === team;
              const count = items.filter((i) => i.status === 'Checked Out' && i.currentUser === team).length;
              return (
                <button
                  key={team}
                  onClick={() => onSelectTeam(team)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-all font-mono ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team {team}</span>
                  <span
                    className={`text-[11px] tabular-nums font-mono ${
                      isSelected ? 'text-amber-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    [{count}]
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
              className="w-40 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono"
            />
            <button
              type="submit"
              disabled={!customTeamInput.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 rounded-sm transition-colors font-mono"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Selected Team Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-sm bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">[TOTAL_DEPLOYED]</span>
            <span className="font-mono text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 border border-amber-200">
              TEAM {selectedTeam}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">{teamItems.length}</span>
            <span className="text-xs text-slate-500 font-mono">components</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Currently mounted or in pit possession
          </div>
        </div>

        <div className="p-4 rounded-sm bg-white border border-slate-200">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">[SUBSYSTEM_ALLOCATION]</span>
          <div className="mt-2 text-xs text-slate-700 space-y-1">
            {Object.keys(categoryBreakdown).length === 0 ? (
              <span className="text-slate-400 font-mono">No active hardware registered</span>
            ) : (
              Object.entries(categoryBreakdown).map(([cat, cnt]) => (
                <div key={cat} className="flex items-center justify-between font-mono">
                  <span className="text-slate-700">{cat}</span>
                  <span className="text-slate-900 font-bold tabular-nums">[{cnt} pcs]</span>
                </div>
              ))
            )}
          </div>
        </div>

        {isAdmin ? (
          <div className="p-4 rounded-sm bg-white border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">[BATCH_TEAM_ACTION]</span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-none">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Check in all parts after tournament or season rebuild</p>
            </div>
            <button
              onClick={() => onReturnAllForTeam(selectedTeam, teamItems)}
              disabled={teamItems.length === 0}
              className="mt-3 w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETURN ALL ({teamItems.length}) ITEMS</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-sm bg-white border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">[HARDWARE_ALLOCATION]</span>
                <span className="text-[11px] text-slate-700 font-mono font-bold">Team {selectedTeam}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {teamItems.length > 0
                  ? `${teamItems.length} component(s) deployed to Team ${selectedTeam}. Use checkout workflow to add items.`
                  : `Team ${selectedTeam} currently has zero components checked out.`}
              </p>
            </div>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="mt-3 w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-none font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check Out to {selectedTeam}</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Item Table */}
      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden shadow-none">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase text-slate-800 tracking-wider">
              [HARDWARE_DEPLOYED] Team {selectedTeam}
            </span>
            <span className="text-xs font-mono text-slate-500">· {teamItems.length} active units</span>
          </div>
        </div>

        {teamItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">All equipment returned</p>
            <p className="text-xs text-slate-500 mt-1">Team {selectedTeam} has zero active checkouts.</p>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors font-mono"
            >
              [CHECK_OUT_PARTS] to {selectedTeam}
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Touch Cards View (phones) */}
            <div className="block md:hidden divide-y divide-slate-200">
              {teamItems.map((item) => (
                <div key={item.itemId} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                          {item.itemId}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          · {item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {item.itemName}
                      </h4>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    {item.dateOut && (
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>OUT: {item.dateOut}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-slate-700 bg-slate-50 p-2 rounded-none border border-slate-200 font-mono text-[11px]">
                        <span className="text-slate-400 uppercase">Subsystem: </span>
                        {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    {isAdmin ? (
                      <button
                        onClick={() => onReturnItem(item)}
                        className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-sm transition-colors flex items-center justify-center gap-1.5 font-mono"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>[ADMIN_CHECK_IN]</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check In', selectedTeam)}
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors flex items-center justify-center gap-1.5 font-mono"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>[CHECK_IN_ITEM]</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none font-mono">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">[PART_ID]</th>
                    <th className="py-2.5 px-3 font-bold">[ITEM_NAME]</th>
                    <th className="py-2.5 px-3 font-bold">[CATEGORY]</th>
                    <th className="py-2.5 px-3 font-bold">[DATE_OUT]</th>
                    <th className="py-2.5 px-3 font-bold">[NOTES_/_SUBSYSTEM]</th>
                    <th className="py-2.5 px-3 text-right font-bold">[ACTION]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {teamItems.map((item) => (
                    <tr key={item.itemId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                          {item.itemId}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {item.itemName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {item.category}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        {item.dateOut || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px] max-w-sm truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <button
                            onClick={() => onReturnItem(item)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-sm transition-colors font-mono"
                            title="Admin Quick Return"
                          >
                            [RETURN]
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check In', selectedTeam)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-colors flex items-center gap-1.5 ml-auto font-mono"
                            title="Check In this item to return it to inventory"
                          >
                            <span>Check In</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
