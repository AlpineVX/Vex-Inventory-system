import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { CompetitionPackItem, InventoryItem, VexCategory, classifyVexCategory } from '../types';
import { INITIAL_PACK_LIST } from '../data/mockInventory';
import { playClick, playSuccess, playBeep } from '../services/soundFx';
import { SpotlightCard, AnimatedNumber, AnimatedRingGauge, useSlidingIndicator } from './MotionPrimitives';

interface CompetitionPackListProps {
  items: InventoryItem[];
}

const STORAGE_KEY_PACKLIST = 'vex_pack_list_state';

export const CompetitionPackList: React.FC<CompetitionPackListProps> = ({ items }) => {
  const [packList, setPackList] = useState<CompetitionPackItem[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY_PACKLIST);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return INITIAL_PACK_LIST;
  });

  const [filterState, setFilterState] = useState<'all' | 'packed' | 'unpacked'>('all');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<VexCategory>('Sensors');
  const [customTarget, setCustomTarget] = useState(2);
  const [customDesc, setCustomDesc] = useState('');
  const { containerRef: packNavRef, setItemRef: setPackTabRef, indicator: packIndicator } =
    useSlidingIndicator<'all' | 'packed' | 'unpacked'>(filterState, [packList]);

  // Persist packlist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PACKLIST, JSON.stringify(packList));
      } catch (e) {
        console.error('Failed to save packlist', e);
      }
    }
  }, [packList]);

  // Compute available stock per category from live inventory
  const availableStockByCategory = React.useMemo(() => {
    const map: Record<VexCategory, number> = {
      Brain: 0,
      Radio: 0,
      Sensors: 0,
      Optical: 0,
      Distance: 0,
      Inertial: 0,
      Rotational: 0,
      Solenoids: 0,
    };
    items.forEach((item) => {
      if (item.status === 'Available') {
        const cat = classifyVexCategory(item.category, item.itemName, item.itemId);
        map[cat] = (map[cat] || 0) + 1;
      }
    });
    return map;
  }, [items]);

  const togglePacked = (id: string) => {
    setPackList((prev) => {
      const target = prev.find((item) => item.id === id);
      const willBePacked = target ? !target.isPacked : false;
      if (willBePacked) {
        playSuccess();
      } else {
        playClick();
      }
      return prev.map((item) => {
        if (item.id === id) {
          const nextPacked = !item.isPacked;
          return {
            ...item,
            isPacked: nextPacked,
            packedCount: nextPacked ? item.targetCount : 0,
          };
        }
        return item;
      });
    });
  };

  const updatePackedCount = (id: string, delta: number) => {
    playClick();
    setPackList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = Math.max(0, Math.min(item.targetCount, item.packedCount + delta));
          if (next === item.targetCount && item.packedCount < item.targetCount) {
            playSuccess();
          }
          return {
            ...item,
            packedCount: next,
            isPacked: next === item.targetCount,
          };
        }
        return item;
      })
    );
  };

  const resetAllPacked = () => {
    playClick();
    setPackList((prev) =>
      prev.map((item) => ({
        ...item,
        isPacked: false,
        packedCount: 0,
      }))
    );
  };

  const markAllPacked = () => {
    playSuccess();
    setPackList((prev) =>
      prev.map((item) => ({
        ...item,
        isPacked: true,
        packedCount: item.targetCount,
      }))
    );
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customName.trim();
    if (!cleanName) return;
    playSuccess();
    const newItem: CompetitionPackItem = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      category: customCategory,
      targetCount: Math.max(1, customTarget),
      packedCount: 0,
      isPacked: false,
      priority: 'Spare',
      description: customDesc.trim() || 'Custom tournament spare item',
    };
    setPackList((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomTarget(2);
    setCustomDesc('');
    setIsAddingCustom(false);
  };

  const removeCustomItem = (id: string) => {
    playClick();
    setPackList((prev) => prev.filter((item) => item.id !== id));
  };

  // Readiness calculations
  const totalTargetUnits = packList.reduce((acc, i) => acc + i.targetCount, 0);
  const totalPackedUnits = packList.reduce((acc, i) => acc + i.packedCount, 0);
  const readinessPercent = totalTargetUnits > 0 ? Math.round((totalPackedUnits / totalTargetUnits) * 100) : 0;
  const fullyPackedItemsCount = packList.filter((i) => i.isPacked).length;

  const filteredList = packList.filter((item) => {
    if (filterState === 'packed') return item.isPacked;
    if (filterState === 'unpacked') return !item.isPacked;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272d]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">
              Competition Pack List
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Check off spare parts and pit tools before heading to a tournament
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                playClick();
                setIsAddingCustom((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors btn-tactile"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Add Custom Spare</span>
            </button>
            <button
              onClick={resetAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors btn-tactile"
            >
              Unpack All
            </button>
            <button
              onClick={markAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors shadow-sm btn-tactile"
            >
              Mark All Packed
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom Spare Inline Form */}
      {isAddingCustom && (
        <form
          onSubmit={handleAddCustomItem}
          className="p-4 rounded-xl bg-[#111114] border border-red-500/35 space-y-3 animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Add Custom Pit Box Spare
            </span>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Item name (e.g. V5 Smart Cables Pack)"
              className="sm:col-span-2 px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as VexCategory)}
              className="px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
            >
              {(['Brain', 'Radio', 'Sensors', 'Inertial', 'Distance', 'Optical', 'Rotational', 'Solenoids'] as VexCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={99}
              value={customTarget}
              onChange={(e) => setCustomTarget(parseInt(e.target.value, 10) || 1)}
              className="px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-red-500"
              title="Target Quantity"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Optional checklist note (e.g. Pack in red Pelican lid)"
              className="flex-1 px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg btn-crimson-glow shrink-0"
            >
              Save to Pack List
            </button>
          </div>
        </form>
      )}

      {/* Readiness Overview Banner */}
      <SpotlightCard tilt className="p-5 rounded-xl bg-[#111114] border border-[#27272d] animate-card-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">PIT BOX CHECKLIST</span>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                · {totalPackedUnits} of {totalTargetUnits} packed ({readinessPercent}%)
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              {fullyPackedItemsCount} of {packList.length} item groups packed in pit cases
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <AnimatedRingGauge
              percent={readinessPercent}
              size={48}
              strokeWidth={4.5}
              strokeColor={readinessPercent === 100 ? '#f4f4f5' : '#c52329'}
            />
            <div className="text-right">
              <div className={`text-2xl font-bold font-mono tabular-nums ${readinessPercent === 100 ? 'text-white' : 'text-zinc-100'}`}>
                <AnimatedNumber value={readinessPercent} suffix="%" />
              </div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                {readinessPercent === 100 ? 'ALL PACKED' : 'STILL PACKING'}
              </div>
            </div>
          </div>
        </div>

        {/* Crisp Industrial Progress Track */}
        <div className="mt-4 w-full bg-[#1a1a1f] rounded-full h-2.5 overflow-hidden relative">
          <div
            className={`h-full rounded-full progress-fill relative overflow-hidden ${
              readinessPercent === 100 ? 'bg-zinc-100' : 'bg-red-600'
            }`}
            style={{ width: `${readinessPercent}%` }}
          >
            <div className="absolute inset-0 shimmer-active" />
          </div>
        </div>
      </SpotlightCard>

      {/* Filter Tabs with Spring Sliding Indicator */}
      <div className="flex items-center justify-between">
        <div
          ref={packNavRef}
          className="relative flex items-center gap-1 p-1 bg-[#111114] border border-[#27272d] rounded-xl text-xs font-mono overflow-x-auto no-scrollbar max-w-full"
        >
          {packIndicator.ready && (
            <div
              aria-hidden="true"
              style={{
                transform: `translate3d(${packIndicator.left}px, ${packIndicator.top}px, 0)`,
                width: `${packIndicator.width}px`,
                height: `${packIndicator.height}px`,
              }}
              className={`absolute top-0 left-0 rounded-md pointer-events-none transition-[transform,width,height,background-color,border-color] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] border ${
                filterState === 'unpacked'
                  ? 'bg-amber-500/20 border-amber-500/40'
                  : filterState === 'packed'
                  ? 'bg-zinc-200/15 border-zinc-400/40'
                  : 'bg-[#1a1a1f] border-red-500/40'
              }`}
            />
          )}
          <button
            ref={setPackTabRef('all')}
            onClick={() => {
              playClick();
              setFilterState('all');
            }}
            className={`relative z-10 px-3 py-1 rounded-md transition-colors duration-150 ${
              filterState === 'all' ? 'text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            ALL [{packList.length}]
          </button>
          <button
            ref={setPackTabRef('unpacked')}
            onClick={() => {
              playClick();
              setFilterState('unpacked');
            }}
            className={`relative z-10 px-3 py-1 rounded-md transition-colors duration-150 ${
              filterState === 'unpacked' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            NEEDS PACKING [{packList.filter((i) => !i.isPacked).length}]
          </button>
          <button
            ref={setPackTabRef('packed')}
            onClick={() => {
              playClick();
              setFilterState('packed');
            }}
            className={`relative z-10 px-3 py-1 rounded-md transition-colors duration-150 ${
              filterState === 'packed' ? 'text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            PACKED [{packList.filter((i) => i.isPacked).length}]
          </button>
        </div>
      </div>

      {/* Pack List Cards */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-10 rounded-xl border border-[#27272d] bg-[#111114] text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 mx-auto text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-100">
              {filterState === 'unpacked'
                ? 'All pack list items are boxed and ready!'
                : 'No items packed yet.'}
            </p>
            <button
              onClick={() => setFilterState('all')}
              className="text-xs text-red-400 hover:underline font-medium"
            >
              View full pack list
            </button>
          </div>
        ) : (
          filteredList.map((item, idx) => {
            const availableStock = availableStockByCategory[item.category] || 0;
            const isStockShortage = availableStock < item.targetCount;
            const itemPct = item.targetCount > 0 ? Math.round((item.packedCount / item.targetCount) * 100) : 0;
            const isCustom = item.id.startsWith('custom-');

            return (
              <div
                key={item.id}
                style={{ '--row-idx': idx } as React.CSSProperties}
                className={`p-4 rounded-xl border transition-all animate-row-enter card-hover-lift ${
                  item.isPacked
                    ? 'bg-[#111114]/60 border-[#27272d]'
                    : 'bg-[#111114] border-[#27272d] hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox + Name + Description */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => togglePacked(item.id)}
                      className="mt-0.5 text-zinc-400 hover:text-zinc-100 transition-transform active:scale-90 shrink-0"
                    >
                      {item.isPacked ? (
                        <CheckSquare className="w-5 h-5 text-zinc-100 animate-pop" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold ${
                            item.isPacked ? 'text-zinc-500 line-through' : 'text-zinc-100'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          [{item.category}]
                        </span>
                        {item.priority === 'Critical' && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/15 border border-rose-500/30 font-mono font-bold px-1.5 py-0.5 rounded">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl font-sans">{item.description}</p>

                      {/* Mini per-item progress track */}
                      <div className="mt-2.5 max-w-xs flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${itemPct}%` }}
                            className={`h-full rounded-full progress-fill ${
                              item.isPacked ? 'bg-zinc-100' : 'bg-red-600'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{itemPct}%</span>
                      </div>

                      {/* Stock shortage warning */}
                      {isStockShortage && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>
                            Low stock: need {item.targetCount}, only {availableStock} available in storage.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Target vs Packed Controls & In-Stock indicator */}
                  <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1a1a1f] shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">Stock</div>
                      <div className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
                        {availableStock} pcs
                      </div>
                    </div>

                    {/* Quantity Counter */}
                    <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded-xl border border-[#27272d] font-mono">
                      <button
                        onClick={() => updatePackedCount(item.id, -1)}
                        disabled={item.packedCount <= 0}
                        className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-30 rounded-lg hover:bg-[#1a1a1f] btn-tactile"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-zinc-100 w-14 text-center tabular-nums">
                        {item.packedCount} / {item.targetCount}
                      </span>
                      <button
                        onClick={() => updatePackedCount(item.id, 1)}
                        disabled={item.packedCount >= item.targetCount}
                        className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-30 rounded-lg hover:bg-[#1a1a1f] btn-tactile"
                      >
                        +
                      </button>
                    </div>

                    {/* Pack Status Action */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => togglePacked(item.id)}
                        className={`min-h-[38px] sm:min-h-0 px-3.5 py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg transition-colors btn-tactile ${
                          item.isPacked
                            ? 'bg-zinc-200/15 text-zinc-100 border border-zinc-400/30 hover:bg-zinc-200/25'
                            : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-sm'
                        }`}
                      >
                        {item.isPacked ? 'Packed' : 'Mark Packed'}
                      </button>

                      {isCustom && (
                        <button
                          onClick={() => removeCustomItem(item.id)}
                          title="Remove custom item"
                          aria-label="Remove custom item"
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-[#1a1a1f] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
