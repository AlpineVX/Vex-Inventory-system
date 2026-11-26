import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Cpu,
  History,
  RotateCw,
  Wrench,
  QrCode,
} from 'lucide-react';
import {
  InventoryItem,
  AuditLog,
  VexCategory,
  CLUB_TEAMS,
  SENSOR_CATEGORIES,
  classifyVexCategory,
  normalizeItemId,
} from '../types';
import { SwipeableActionCard, useSlidingIndicator } from './MotionPrimitives';
import { playClick, playBeep } from '../services/soundFx';
import { getVexHardwareSpec } from '../data/vexSpecs';

interface MobileInventoryListProps {
  items: InventoryItem[];
  logs?: AuditLog[];
  selectedCategory: VexCategory | 'All';
  onSelectCategory: (cat: VexCategory | 'All') => void;
  onOpenCheckout: (item: InventoryItem, action?: 'Check Out' | 'Check In') => void;
  onToggleCondition?: (item: InventoryItem) => void;
  onOpenLabelPrinter?: () => void;
  isAdmin: boolean;
  onOpenAdminUnlock: () => void;
}

const CATEGORIES: (VexCategory | 'All')[] = [
  'All',
  'Sensors',
  'Optical',
  'Distance',
  'Inertial',
  'Rotational',
  'Brain',
  'Radio',
  'Solenoids',
];

export const MobileInventoryList: React.FC<MobileInventoryListProps> = ({
  items,
  logs = [],
  selectedCategory,
  onSelectCategory,
  onOpenCheckout,
  onToggleCondition,
  onOpenLabelPrinter,
  isAdmin,
  onOpenAdminUnlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Checked Out'>('All');
  const [repairOnly, setRepairOnly] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(35);

  useEffect(() => {
    setVisibleLimit(35);
  }, [selectedCategory, statusFilter, repairOnly, teamFilter, searchQuery]);

  const { containerRef: statusBarRef, setItemRef: setStatusTabRef, indicator: statusIndicator } =
    useSlidingIndicator<'All' | 'Available' | 'Checked Out'>(statusFilter, [items.length, selectedCategory, searchQuery]);

  const activeTeams = useMemo(() => {
    const teams = new Set<string>(CLUB_TEAMS);
    items.forEach((i) => {
      if (i.currentUser) teams.add(i.currentUser);
    });
    return Array.from(teams);
  }, [items]);

  // Pre-status filtered items so tab badge counts stay accurate when switching Ready / Out
  const preStatusItems = useMemo(() => {
    let result = items;

    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Sensors') {
        result = result.filter(
          (i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors'
        );
      } else if (selectedCategory === 'Solenoids') {
        result = result.filter(
          (i) => classifyVexCategory(i.category, i.itemName, i.itemId) === 'Solenoids'
        );
      } else {
        result = result.filter((i) => i.category === selectedCategory);
      }
    }

    if (repairOnly) {
      result = result.filter((i) => i.condition === 'Needs Repair');
    }

    if (teamFilter !== 'All') {
      if (teamFilter === 'Unassigned') {
        result = result.filter((i) => !i.currentUser);
      } else {
        result = result.filter((i) => i.currentUser === teamFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          String(i.itemId || '').toLowerCase().includes(q) ||
          String(i.itemName || '').toLowerCase().includes(q) ||
          String(i.category || '').toLowerCase().includes(q) ||
          String(i.currentUser || '').toLowerCase().includes(q) ||
          String(i.location || '').toLowerCase().includes(q) ||
          String(i.notes || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, selectedCategory, repairOnly, teamFilter, searchQuery]);

  // Apply active status tab filter
  const filteredItems = useMemo(() => {
    if (statusFilter === 'All') return preStatusItems;
    return preStatusItems.filter((i) => i.status === statusFilter);
  }, [preStatusItems, statusFilter]);

  const availableCount = preStatusItems.filter((i) => i.status === 'Available').length;
  const checkedOutCount = preStatusItems.filter((i) => i.status === 'Checked Out').length;
  const repairCount = items.filter((i) => i.condition === 'Needs Repair').length;

  const hasActiveFilters =
    Boolean(searchQuery) || selectedCategory !== 'All' || statusFilter !== 'All' || repairOnly || teamFilter !== 'All';

  const resetAllFilters = () => {
    playClick();
    setSearchQuery('');
    onSelectCategory('All');
    setStatusFilter('All');
    setRepairOnly(false);
    setTeamFilter('All');
  };

  const displayedItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit]
  );

  const now = Date.now();

  return (
    <div className="space-y-3 pb-24">
      {/* Sticky Thumb-Friendly Search & Filter Controls */}
      <div className="sticky top-14 z-20 -mx-3 px-3 pt-2 pb-2.5 bg-[#09090b]/98 border-b border-[#1a1a1f] space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            data-global-search="true"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, part name, cabinet, team..."
            className="w-full bg-[#111114] border border-[#27272d] rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 p-2 btn-tactile"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Swipe Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  playClick();
                  onSelectCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all min-h-[34px] flex items-center justify-center border btn-tactile ${
                  isSelected
                    ? 'bg-[#1a1a1f] text-zinc-100 border-red-500/45 shadow-sm'
                    : 'bg-[#111114] text-zinc-400 hover:text-zinc-100 border-[#27272d]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Status Segmented Control + Team Selector Row */}
        <div className="flex items-center gap-2">
          <div
            ref={statusBarRef}
            className="relative flex-1 grid grid-cols-3 gap-1 p-1 bg-[#111114] border border-[#27272d] rounded-xl text-[11px] font-mono"
          >
            {statusIndicator.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${statusIndicator.left}px, ${statusIndicator.top}px, 0)`,
                  width: `${statusIndicator.width}px`,
                  height: `${statusIndicator.height}px`,
                }}
                className={`absolute top-0 left-0 rounded-lg pointer-events-none transition-[transform,width,height,background-color,border-color] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] border ${
                  statusFilter === 'Checked Out'
                    ? 'bg-amber-500/20 border-amber-500/35'
                    : statusFilter === 'Available'
                    ? 'bg-zinc-200/15 border-zinc-400/35'
                    : 'bg-[#1a1a1f] border-red-500/40'
                }`}
              />
            )}
            <button
              ref={setStatusTabRef('All')}
              onClick={() => {
                playClick();
                setStatusFilter('All');
              }}
              className={`relative z-10 py-1.5 rounded-lg transition-colors min-h-[34px] flex items-center justify-center ${
                statusFilter === 'All'
                  ? 'text-zinc-100 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              All ({filteredItems.length})
            </button>
            <button
              ref={setStatusTabRef('Available')}
              onClick={() => {
                playClick();
                setStatusFilter('Available');
              }}
              className={`relative z-10 py-1.5 rounded-lg transition-colors min-h-[34px] flex items-center justify-center ${
                statusFilter === 'Available'
                  ? 'text-zinc-100 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Ready ({availableCount})
            </button>
            <button
              ref={setStatusTabRef('Checked Out')}
              onClick={() => {
                playClick();
                setStatusFilter('Checked Out');
              }}
              className={`relative z-10 py-1.5 rounded-lg transition-colors min-h-[34px] flex items-center justify-center ${
                statusFilter === 'Checked Out'
                  ? 'text-amber-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Out ({checkedOutCount})
            </button>
          </div>

          <select
            value={teamFilter}
            onChange={(e) => {
              playClick();
              setTeamFilter(e.target.value);
            }}
            aria-label="Filter by Team"
            className="min-h-[42px] px-2.5 text-[11px] bg-[#111114] border border-[#27272d] rounded-xl text-zinc-200 font-mono focus:outline-none focus:border-red-500 shrink-0"
          >
            <option value="All">All Teams</option>
            {activeTeams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="Unassigned">In Pit</option>
          </select>
        </div>
      </div>

      {/* Item count ticker + Repair Filter & Label shortcut */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 px-1 flex-wrap">
        <span>Showing {filteredItems.length} of {items.length} parts · Swipe left for quick action</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              setRepairOnly((prev) => !prev);
            }}
            className={`px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
              repairOnly
                ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                : 'bg-[#111114] text-zinc-400 border-[#27272d]'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>Repair ({repairCount})</span>
          </button>
          {onOpenLabelPrinter && (
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenLabelPrinter();
              }}
              className="px-2 py-0.5 rounded-md border bg-[#111114] text-zinc-300 border-[#27272d] flex items-center gap-1"
            >
              <QrCode className="w-3 h-3 text-red-400" />
              <span>Labels</span>
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-red-400 hover:underline font-medium flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-[#111114] border border-[#27272d] rounded-xl animate-fade-in-up space-y-2.5">
            <Tag className="w-8 h-8 text-zinc-500 mx-auto" />
            <p className="text-sm font-semibold text-zinc-100">No parts found</p>
            <p className="text-xs text-zinc-400">Try clearing filters or searching another part ID.</p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 text-xs font-semibold text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-xl"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          displayedItems.map((item, idx) => {
            const isAvailable = item.status === 'Available';
            const isExpanded = expandedItemId === item.itemId;

            // Check overdue
            let isOverdue = false;
            let daysOut = 0;
            if (!isAvailable && item.dateOut) {
              const parsedMs = new Date(item.dateOut).getTime();
              if (!isNaN(parsedMs)) {
                daysOut = Math.max(0, Math.floor((now - parsedMs) / (1000 * 60 * 60 * 24)));
                isOverdue = daysOut >= 100;
              }
            }

            const spec = getVexHardwareSpec(item.category);
            const itemNorm = normalizeItemId(String(item.itemId || ''), item.category).toUpperCase();
            const rawItemUpper = String(item.itemId || '').toUpperCase();
            const recentItemLogs = isExpanded
              ? logs
                  .filter(
                    (l) =>
                      normalizeItemId(String(l.itemId || ''), l.category).toUpperCase() === itemNorm ||
                      String(l.itemId || '').toUpperCase() === rawItemUpper
                  )
                  .sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0))
                  .slice(0, 3)
              : [];

            const needsRepair = item.condition === 'Needs Repair';

            return (
              <SwipeableActionCard
                key={`${item.itemId}-${idx}`}
                actionLabel={isAvailable ? 'Check Out' : 'Check In'}
                actionTone={isAvailable ? 'red' : 'light'}
                onSwipeAction={() => {
                  playBeep();
                  onOpenCheckout(item, isAvailable ? 'Check Out' : 'Check In');
                }}
                className={`rounded-2xl ${idx < 10 ? 'animate-row-enter' : ''}`}
              >
                <div
                  style={idx < 10 ? ({ '--row-idx': idx } as React.CSSProperties) : undefined}
                  className={`bg-[#111114] border rounded-2xl p-4 transition-colors ${
                    needsRepair
                      ? 'border-red-500/45 bg-[#151114]'
                      : isOverdue
                      ? 'border-red-500/50 bg-red-950/20'
                      : 'border-[#27272d]'
                  }`}
                >
                  {/* Tappable Header & Summary to toggle Specs/Logs */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => {
                      playClick();
                      setExpandedItemId(isExpanded ? null : item.itemId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playClick();
                        setExpandedItemId(isExpanded ? null : item.itemId);
                      }
                    }}
                    className="cursor-pointer rounded-xl focus-visible:outline-none"
                  >
                    {/* Header row: Item ID + Status */}
                    <div className="flex items-center justify-between gap-2 font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-zinc-100 bg-[#1a1a1f] px-2.5 py-0.5 rounded-md border border-zinc-700 shrink-0">
                          {item.itemId}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate">
                          · {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                        {needsRepair && (
                          <span className="text-red-400 font-bold bg-red-500/15 px-1.5 py-0.5 rounded-md border border-red-500/35 text-[9px]">
                            REPAIR
                          </span>
                        )}
                        {isAvailable ? (
                          <span className="text-zinc-100 font-bold bg-zinc-200/10 px-2 py-0.5 rounded-md border border-zinc-400/25 text-[10px]">
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 text-[10px]">
                            {item.currentUser ? `TEAM ${item.currentUser}` : 'CHECKED OUT'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Location */}
                    <div className="mt-2">
                      <h3 className="text-sm font-bold text-zinc-100 leading-snug font-sans">
                        {item.itemName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap font-mono">
                        {item.location && (
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {item.location}
                          </span>
                        )}
                        {!isAvailable && item.dateOut && (
                          <span className="text-zinc-400">
                            · OUT: {daysOut}d ago
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Overdue Warning Alert */}
                  {isOverdue && (
                    <div className="mt-2.5 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400 font-mono font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Checked out {daysOut} days (over 100-day limit)</span>
                    </div>
                  )}

                  {/* Smooth CSS Grid Expandable Specs & Custody History */}
                  <div className="accordion-grid" data-open={isExpanded ? 'true' : 'false'}>
                    <div className="accordion-inner">
                      <div className="mt-3 pt-3 border-t border-[#27272d] text-xs text-zinc-300 space-y-2.5 font-mono">
                        {item.notes && (
                          <div className="bg-[#09090b] p-2.5 rounded-xl border border-[#27272d] text-zinc-300 font-sans">
                            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-0.5">Active Notes</div>
                            <span>{item.notes}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-[#09090b] p-2 rounded-lg border border-[#1a1a1f]">
                            <div className="text-[10px] text-zinc-500">SEASON USES</div>
                            <div className="text-zinc-100 font-bold mt-0.5">{item.timesCheckedOut || 0}x</div>
                          </div>
                          <div className="bg-[#09090b] p-2 rounded-lg border border-[#1a1a1f]">
                            <div className="text-[10px] text-zinc-500">PART NUMBER</div>
                            <div className="text-zinc-100 font-bold mt-0.5">{spec.officialPartNumber}</div>
                          </div>
                        </div>

                        <div className="bg-[#09090b] p-2.5 rounded-xl border border-[#1a1a1f] space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                            <Cpu className="w-3.5 h-3.5 text-red-400" />
                            <span>{spec.interfaceProtocol}</span>
                          </div>
                          <div className="text-zinc-400">{spec.operatingRange}</div>
                        </div>

                        {onToggleCondition && (
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              onToggleCondition(item);
                            }}
                            className={`w-full py-2 px-3 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              needsRepair
                                ? 'bg-zinc-100 text-zinc-950 border-zinc-200'
                                : 'bg-[#09090b] text-red-400 border-red-500/35 hover:bg-red-500/10'
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{needsRepair ? 'Mark Part Condition as Good' : 'Flag Part as Needs Repair'}</span>
                          </button>
                        )}

                        {recentItemLogs.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                              <History className="w-3 h-3" />
                              <span>Recent History</span>
                            </div>
                            <div className="bg-[#09090b] rounded-xl border border-[#1a1a1f] divide-y divide-[#1a1a1f]">
                              {recentItemLogs.map((l) => (
                                <div key={l.id} className="px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                                  <span className={l.action === 'Check Out' ? 'text-amber-400' : 'text-zinc-200'}>
                                    {l.action} · {l.team || '—'}
                                  </span>
                                  <span className="text-zinc-500">
                                    {new Date(l.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Touch Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-[#27272d] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playClick();
                          setExpandedItemId(isExpanded ? null : item.itemId);
                        }}
                        className="min-h-[38px] px-2.5 text-zinc-400 hover:text-zinc-100 text-xs font-medium flex items-center gap-1 rounded-lg hover:bg-[#1a1a1f] btn-tactile"
                      >
                        <span>{isExpanded ? 'Less' : 'Specs & History'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-red-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(item.itemId).catch(() => {});
                          playClick();
                          setCopiedId(item.itemId);
                          setTimeout(() => setCopiedId(null), 1400);
                        }}
                        aria-label="Copy Part ID"
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-[#1a1a1f] btn-tactile"
                      >
                        {copiedId === item.itemId ? <Check className="w-3.5 h-3.5 text-zinc-100 animate-pop" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      {isAvailable ? (
                        <button
                          onClick={() => {
                            playBeep();
                            onOpenCheckout(item, 'Check Out');
                          }}
                          className="min-h-[40px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm btn-crimson-glow"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Check Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            playBeep();
                            onOpenCheckout(item, 'Check In');
                          }}
                          className="min-h-[40px] px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] text-zinc-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm btn-tactile"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-200" />
                          <span>Check In</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableActionCard>
            );
          })
        )}

        {filteredItems.length > visibleLimit && (
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setVisibleLimit((prev) => prev + 40);
              }}
              className="flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] text-xs font-semibold text-zinc-100 btn-tactile"
            >
              Show More ({filteredItems.length - visibleLimit} remaining)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setVisibleLimit(filteredItems.length);
              }}
              className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] text-xs font-mono text-zinc-300 btn-tactile"
            >
              All ({filteredItems.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
