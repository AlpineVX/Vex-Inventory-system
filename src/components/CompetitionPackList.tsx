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
import { CompetitionPackItem, InventoryItem, VexCategory } from '../types';
import { INITIAL_PACK_LIST } from '../data/mockInventory';

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
      localStorage.setItem(STORAGE_KEY_PACKLIST, JSON.stringify(packList));
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
        map[item.category] = (map[item.category] || 0) + 1;
      }
    });
    return map;
  }, [items]);

  const togglePacked = (id: string) => {
    setPackList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextPacked = !item.isPacked;
          return {
            ...item,
            isPacked: nextPacked,
            packedCount: nextPacked ? item.targetCount : 0,
          };
        }
        return item;
      })
    );
  };

  const updatePackedCount = (id: string, delta: number) => {
    setPackList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = Math.max(0, Math.min(item.targetCount, item.packedCount + delta));
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
    setPackList((prev) =>
      prev.map((item) => ({
        ...item,
        isPacked: false,
        packedCount: 0,
      }))
    );
  };

  const markAllPacked = () => {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Tournament Competition Pack List
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Verify tournament readiness, pit toolbox spare quotas, and stock buffers before travel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAllPacked}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-md transition-colors"
            >
              Unpack All
            </button>
            <button
              onClick={markAllPacked}
              className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/60 transition-colors"
            >
              Mark All Packed
            </button>
          </div>
        </div>
      </div>

      {/* Readiness Overview Banner */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Pit Box Readiness Score</span>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                · {totalPackedUnits} of {totalTargetUnits} units boxed ({readinessPercent}%)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {fullyPackedItemsCount} of {packList.length} sub-assemblies verified in competition flight cases
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-2xl font-bold font-mono tabular-nums ${readinessPercent === 100 ? 'text-emerald-400' : 'text-zinc-100'}`}>
                {readinessPercent}%
              </div>
              <div className="text-[11px] text-zinc-500">
                {readinessPercent === 100 ? 'Tournament Ready' : 'Packing in Progress'}
              </div>
            </div>
          </div>
        </div>

        {/* Big Progress Track */}
        <div className="mt-4 w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readinessPercent === 100 ? 'bg-emerald-500' : 'bg-zinc-300'
            }`}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterState === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Items ({packList.length})
          </button>
          <button
            onClick={() => setFilterState('unpacked')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterState === 'unpacked'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/60 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Needs Packing ({packList.filter((i) => !i.isPacked).length})
          </button>
          <button
            onClick={() => setFilterState('packed')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterState === 'packed'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Packed ({packList.filter((i) => i.isPacked).length})
          </button>
        </div>
      </div>

      {/* Pack List Cards / Table */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const availableStock = availableStockByCategory[item.category] || 0;
          const isStockShortage = availableStock < item.targetCount;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.isPacked
                  ? 'bg-zinc-900/30 border-zinc-800/60 opacity-90'
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Checkbox + Name + Description */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => togglePacked(item.id)}
                    className="mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {item.isPacked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          item.isPacked ? 'text-zinc-300 line-through' : 'text-zinc-100'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {item.category}
                      </span>
                      {item.priority === 'Critical' && (
                        <span className="text-[10px] text-rose-400 font-mono font-medium">
                          [Critical]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl">{item.description}</p>

                    {/* Stock shortage warning */}
                    {isStockShortage && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Warning: Target ({item.targetCount}) exceeds current available warehouse stock ({availableStock}).
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Target vs Packed Controls & In-Stock indicator */}
                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">Available In Stock</div>
                    <div className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
                      {availableStock} pcs ready
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => updatePackedCount(item.id, -1)}
                      disabled={item.packedCount <= 0}
                      className="w-6 h-6 flex items-center justify-center text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-900"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-100 w-12 text-center tabular-nums">
                      {item.packedCount} / {item.targetCount}
                    </span>
                    <button
                      onClick={() => updatePackedCount(item.id, 1)}
                      disabled={item.packedCount >= item.targetCount}
                      className="w-6 h-6 flex items-center justify-center text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-900"
                    >
                      +
                    </button>
                  </div>

                  {/* Pack Status Pill */}
                  <button
                    onClick={() => togglePacked(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      item.isPacked
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
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
