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
} from 'lucide-react';
import { CompetitionPackItem, InventoryItem, VexCategory, classifyVexCategory } from '../types';
import { INITIAL_PACK_LIST } from '../data/mockInventory';
import { playClick, playSuccess, playBeep } from '../services/soundFx';
import { SpotlightCard, AnimatedNumber, AnimatedRingGauge } from './MotionPrimitives';

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
              Tournament Competition Pack List
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Verify tournament readiness, pit toolbox spare quotas, and stock buffers before travel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors"
            >
              Unpack All
            </button>
            <button
              onClick={markAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              Mark All Packed
            </button>
          </div>
        </div>
      </div>

      {/* Readiness Overview Banner */}
      <SpotlightCard className="p-5 rounded-xl bg-[#111114] border border-[#27272d] animate-card-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">PIT BOX READINESS SCORE</span>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                · {totalPackedUnits} of {totalTargetUnits} units boxed ({readinessPercent}%)
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              {fullyPackedItemsCount} of {packList.length} sub-assemblies verified in competition flight cases
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
                {readinessPercent === 100 ? 'TOURNAMENT READY' : 'PACKING IN PROGRESS'}
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

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-[#111114] border border-[#27272d] rounded-lg text-xs font-mono">
          <button
            onClick={() => {
              playClick();
              setFilterState('all');
            }}
            className={`px-3 py-1 rounded-md transition-colors btn-tactile ${
              filterState === 'all' ? 'bg-[#1a1a1f] text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            ALL [{packList.length}]
          </button>
          <button
            onClick={() => {
              playClick();
              setFilterState('unpacked');
            }}
            className={`px-3 py-1 rounded-md transition-colors btn-tactile ${
              filterState === 'unpacked'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            NEEDS PACKING [{packList.filter((i) => !i.isPacked).length}]
          </button>
          <button
            onClick={() => {
              playClick();
              setFilterState('packed');
            }}
            className={`px-3 py-1 rounded-md transition-colors btn-tactile ${
              filterState === 'packed'
                ? 'bg-zinc-200/15 text-zinc-100 border border-zinc-400/40 font-bold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            PACKED [{packList.filter((i) => i.isPacked).length}]
          </button>
        </div>
      </div>

      {/* Pack List Cards */}
      <div className="space-y-3">
        {filteredList.map((item, idx) => {
          const availableStock = availableStockByCategory[item.category] || 0;
          const isStockShortage = availableStock < item.targetCount;

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
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => togglePacked(item.id)}
                    className="mt-0.5 text-zinc-400 hover:text-zinc-100 transition-transform active:scale-90"
                  >
                    {item.isPacked ? (
                      <CheckSquare className="w-5 h-5 text-zinc-100 animate-pop" />
                    ) : (
                      <Square className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
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

                    {/* Stock shortage warning */}
                    {isStockShortage && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>
                          [STOCK DEFICIT] Target ({item.targetCount}) exceeds available warehouse stock ({availableStock}).
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Target vs Packed Controls & In-Stock indicator */}
                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Available Warehouse</div>
                    <div className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
                      {availableStock} pcs
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-2 bg-[#09090b] p-1 rounded-lg border border-[#27272d] font-mono">
                    <button
                      onClick={() => updatePackedCount(item.id, -1)}
                      disabled={item.packedCount <= 0}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-[#1a1a1f]"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-100 w-14 text-center tabular-nums">
                      {item.packedCount} / {item.targetCount}
                    </span>
                    <button
                      onClick={() => updatePackedCount(item.id, 1)}
                      disabled={item.packedCount >= item.targetCount}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-[#1a1a1f]"
                    >
                      +
                    </button>
                  </div>

                  {/* Pack Status Action */}
                  <button
                    onClick={() => togglePacked(item.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      item.isPacked
                        ? 'bg-zinc-200/15 text-zinc-100 border border-zinc-400/30 hover:bg-zinc-200/25'
                        : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-sm'
                    }`}
                  >
                    {item.isPacked ? 'Packed' : 'Mark Packed'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
