import React, { useState, useMemo, useEffect } from 'react';
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
  Printer,
} from 'lucide-react';
import { InventoryItem, CLUB_TEAMS, classifyVexCategory } from '../types';
import { SpotlightCard, AnimatedNumber, useSlidingIndicator } from './MotionPrimitives';
import { playClick } from '../services/soundFx';

function getDaysOut(dateOut?: string): number | null {
  if (!dateOut) return null;
  const ms = new Date(dateOut).getTime();
  if (isNaN(ms)) return null;
  const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

interface TeamLookupProps {
  items: InventoryItem[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  onOpenCheckout: (item?: InventoryItem, defaultAction?: 'Check Out' | 'Check In', presetTeam?: string) => void;
  onReturnItem: (item: InventoryItem) => void;
  onReturnAllForTeam: (team: string, itemsToReturn: InventoryItem[]) => void;
  isAdmin?: boolean;
  onOpenAdminUnlock?: () => void;
  isMobileMode?: boolean;
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
  isMobileMode = false,
}) => {
  const [customTeamInput, setCustomTeamInput] = useState('');
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    setBarsReady(false);
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, [selectedTeam]);

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
      const cat = classifyVexCategory(i.category, i.itemName, i.itemId);
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [teamItems]);

  const { containerRef: teamBarRef, setItemRef: setTeamRef, indicator: teamIndicator } =
    useSlidingIndicator<string>(selectedTeam, [allTeamsInSystem.length]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272d]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">
              Team Parts
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              See which brains, radios, and sensors each robotics team currently has checked out
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick();
                window.print();
              }}
              title={`Print Team ${selectedTeam} parts sheet`}
              className="flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-0 px-3 py-2 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-xl sm:rounded-lg transition-colors btn-tactile no-print"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Print Sheet</span>
            </button>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl sm:rounded-lg shadow-sm btn-crimson-glow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check Out to Team {selectedTeam}</span>
            </button>
          </div>
        </div>

        {/* Team Selector Row with Spring Sliding Pill (horizontally swipeable on mobile) */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mt-4">
          <div
            ref={teamBarRef}
            className="relative flex flex-nowrap sm:flex-wrap items-center gap-1 p-1 bg-[#111114] border border-[#27272d] rounded-xl overflow-x-auto no-scrollbar"
          >
            {teamIndicator.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${teamIndicator.left}px, ${teamIndicator.top}px, 0)`,
                  width: `${teamIndicator.width}px`,
                  height: `${teamIndicator.height}px`,
                }}
                className="absolute top-0 left-0 rounded-lg bg-[#1a1a1f] border border-red-500/45 shadow-sm pointer-events-none transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
              />
            )}
            {allTeamsInSystem.map((team) => {
              const isSelected = selectedTeam === team;
              const count = items.filter((i) => i.status === 'Checked Out' && i.currentUser === team).length;
              return (
                <button
                  key={team}
                  ref={setTeamRef(team)}
                  onClick={() => {
                    playClick();
                    onSelectTeam(team);
                  }}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'text-zinc-100 font-bold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team {team}</span>
                  <span
                    className={`text-[11px] tabular-nums font-mono ${
                      isSelected ? 'text-red-400 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {count}
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
              className="flex-1 sm:w-40 px-3 py-2 sm:py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-xl sm:rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow font-mono"
            />
            <button
              type="submit"
              disabled={!customTeamInput.trim()}
              className="px-3.5 py-2 sm:py-1.5 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] disabled:opacity-40 rounded-xl sm:rounded-lg transition-colors btn-tactile shrink-0"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Selected Team Detail Body (re-animates smoothly on team switch) */}
      <div key={selectedTeam} className="space-y-6 animate-tab-enter">
        {/* Selected Team Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SpotlightCard tilt className="p-5 rounded-xl bg-[#111114] border border-[#27272d] card-hover-lift animate-card-enter stagger-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">CHECKED OUT</span>
              <span className="text-xs font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                TEAM {selectedTeam}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-zinc-100">
                <AnimatedNumber value={teamItems.length} />
              </span>
              <span className="text-xs text-zinc-500 font-mono">parts</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              On the robot or in the team pit box
            </div>
          </SpotlightCard>

          <SpotlightCard tilt className="p-5 rounded-xl bg-[#111114] border border-[#27272d] card-hover-lift animate-card-enter stagger-2">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">BY CATEGORY</span>
            <div className="mt-2.5 text-xs text-zinc-300 space-y-2">
              {Object.keys(categoryBreakdown).length === 0 ? (
                <span className="text-zinc-500 font-mono">Nothing checked out right now</span>
              ) : (
                Object.entries(categoryBreakdown).map(([cat, cnt]) => {
                  const pct = teamItems.length > 0 ? Math.round((cnt / teamItems.length) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-zinc-400">{cat}</span>
                        <span className="text-zinc-100 font-bold tabular-nums">{cnt} pcs</span>
                      </div>
                      <div className="h-1 w-full bg-[#1a1a1f] rounded-full overflow-hidden">
                        <div
                          style={{ width: barsReady ? `${pct}%` : '0%' }}
                          className="h-full bg-red-600 rounded-full progress-fill"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SpotlightCard>

          {isAdmin ? (
            <SpotlightCard tilt className="p-5 rounded-xl bg-[#111114] border border-[#27272d] flex flex-col justify-between card-hover-lift animate-card-enter stagger-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">BATCH TEAM ACTION</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    ADMIN ONLY
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Check in all parts after tournament or season rebuild</p>
              </div>
              <button
                onClick={() => onReturnAllForTeam(selectedTeam, teamItems)}
                disabled={teamItems.length === 0}
                className="mt-3 w-full py-2 px-3 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-mono shadow-sm btn-tactile"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETURN ALL ({teamItems.length}) ITEMS</span>
              </button>
            </SpotlightCard>
          ) : (
            <SpotlightCard tilt className="p-5 rounded-xl bg-[#111114] border border-[#27272d] flex flex-col justify-between card-hover-lift animate-card-enter stagger-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">TEAM EQUIPMENT</span>
                  <span className="text-xs text-zinc-300 font-mono font-bold">Team {selectedTeam}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {teamItems.length > 0
                    ? `${teamItems.length} part(s) checked out to Team ${selectedTeam}. Click below to check out more.`
                    : `Team ${selectedTeam} has no parts checked out right now.`}
                </p>
              </div>
              <button
                onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
                className="mt-3 w-full py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-1.5 shadow-sm btn-crimson-glow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Check Out to {selectedTeam}</span>
              </button>
            </SpotlightCard>
          )}
        </div>

        {/* Team Item Table */}
        <div className="rounded-xl border border-[#27272d] bg-[#111114] overflow-hidden shadow-none">
        <div className="px-5 py-4 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-zinc-100 tracking-wider">
              PARTS CHECKED OUT · Team {selectedTeam}
            </span>
            <span className="text-xs text-zinc-400">· {teamItems.length} parts</span>
          </div>
        </div>

        {teamItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-zinc-200 mb-2" />
            <p className="text-sm font-semibold text-zinc-100">All equipment returned</p>
            <p className="text-xs text-zinc-400 mt-1">Team {selectedTeam} has zero active checkouts.</p>
            <button
              onClick={() => onOpenCheckout(undefined, 'Check Out', selectedTeam)}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Check Out Parts to {selectedTeam}
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Touch Cards View (phones or forced Phone UI) */}
            <div className={`${isMobileMode ? 'block' : 'block md:hidden'} divide-y divide-[#1a1a1f]`}>
              {teamItems.map((item) => {
                const daysOut = getDaysOut(item.dateOut);
                return (
                  <div key={item.itemId} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-zinc-100 bg-[#1a1a1f] px-2 py-0.5 rounded border border-zinc-700">
                            {item.itemId}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            · {item.category}
                          </span>
                          {daysOut !== null && daysOut >= 14 && (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              {daysOut}d out
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-zinc-100 mt-1">
                          {item.itemName}
                        </h4>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-300 space-y-1">
                      {item.dateOut && (
                        <div className="flex items-center gap-1.5 font-mono text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>OUT: {item.dateOut}</span>
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-zinc-300 bg-[#09090b] p-2.5 rounded-lg border border-[#27272d] font-mono text-xs">
                          <span className="text-zinc-500 uppercase">Subsystem: </span>
                          {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      {isAdmin ? (
                        <button
                          onClick={() => onReturnItem(item)}
                          className="w-full min-h-[42px] py-2 px-3 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Admin Check In</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenCheckout(item, 'Check In', selectedTeam)}
                          className="w-full min-h-[42px] py-2 px-3 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Check In / Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className={`${isMobileMode ? 'hidden' : 'hidden md:block'} overflow-x-auto`}>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#09090b] text-zinc-400 border-b border-[#27272d] select-none font-medium">
                  <tr>
                    <th className="py-3 px-4 font-semibold">PART ID</th>
                    <th className="py-3 px-4 font-semibold">ITEM NAME</th>
                    <th className="py-3 px-4 font-semibold">CATEGORY</th>
                    <th className="py-3 px-4 font-semibold">DATE OUT</th>
                    <th className="py-3 px-4 font-semibold">NOTES / SUBSYSTEM</th>
                    <th className="py-3 px-4 text-right font-semibold">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1f] font-sans">
                  {teamItems.map((item, idx) => {
                    const daysOut = getDaysOut(item.dateOut);
                    return (
                      <tr
                        key={item.itemId}
                        style={{ '--row-idx': idx } as React.CSSProperties}
                        className="hover:bg-[#1a1a1f] transition-colors animate-row-enter"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-zinc-100 whitespace-nowrap">
                          <span className="bg-[#1a1a1f] px-2 py-0.5 rounded border border-zinc-700">
                            {item.itemId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-100">
                          {item.itemName}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{item.dateOut || '—'}</span>
                            {daysOut !== null && daysOut >= 14 && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                {daysOut}d
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono text-xs max-w-sm truncate">
                          {item.notes || '—'}
                        </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <button
                            onClick={() => onReturnItem(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-colors btn-tactile"
                            title="Admin Quick Return"
                          >
                            Return
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check In', selectedTeam)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-100 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm btn-tactile"
                            title="Check In this item to return it to inventory"
                          >
                            <span>Check In</span>
                            <ArrowRight className="w-3 h-3 text-zinc-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
