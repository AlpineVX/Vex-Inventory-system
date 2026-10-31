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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
                [PIT_PACK_VERIFICATION]
              </span>
              <span className="text-xs font-mono text-slate-500">TRAVEL_LOGISTICS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Tournament Competition Pack List
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify tournament readiness, pit toolbox spare quotas, and stock buffers before travel
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={resetAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-sm transition-colors"
            >
              [UNPACK_ALL]
            </button>
            <button
              onClick={markAllPacked}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-sm hover:bg-emerald-100 transition-colors"
            >
              [MARK_ALL_PACKED]
            </button>
          </div>
        </div>
      </div>

      {/* Readiness Overview Banner */}
      <div className="p-5 rounded-sm bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">[PIT_BOX_READINESS_SCORE]</span>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                · {totalPackedUnits} of {totalTargetUnits} units boxed ({readinessPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              {fullyPackedItemsCount} of {packList.length} sub-assemblies verified in competition flight cases
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-2xl font-bold font-mono tabular-nums ${readinessPercent === 100 ? 'text-emerald-700' : 'text-slate-900'}`}>
                {readinessPercent}%
              </div>
              <div className="text-[10px] font-mono uppercase text-slate-500">
                {readinessPercent === 100 ? '[TOURNAMENT_READY]' : '[PACKING_IN_PROGRESS]'}
              </div>
            </div>
          </div>
        </div>

        {/* Crisp Industrial Progress Track */}
        <div className="mt-4 w-full bg-slate-100 rounded-none h-2.5 overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-none transition-all duration-300 ${
              readinessPercent === 100 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-sm text-xs font-mono">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1 rounded-sm transition-colors ${
              filterState === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ALL [{packList.length}]
          </button>
          <button
            onClick={() => setFilterState('unpacked')}
            className={`px-3 py-1 rounded-sm transition-colors ${
              filterState === 'unpacked'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NEEDS PACKING [{packList.filter((i) => !i.isPacked).length}]
          </button>
          <button
            onClick={() => setFilterState('packed')}
            className={`px-3 py-1 rounded-sm transition-colors ${
              filterState === 'packed'
                ? 'bg-emerald-700 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PACKED [{packList.filter((i) => i.isPacked).length}]
          </button>
        </div>
      </div>

      {/* Pack List Cards */}
      <div className="space-y-2">
        {filteredList.map((item) => {
          const availableStock = availableStockByCategory[item.category] || 0;
          const isStockShortage = availableStock < item.targetCount;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-sm border transition-colors ${
                item.isPacked
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Checkbox + Name + Description */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => togglePacked(item.id)}
                    className="mt-0.5 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {item.isPacked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          item.isPacked ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        [{item.category}]
                      </span>
                      {item.priority === 'Critical' && (
                        <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 font-mono font-bold px-1 py-0.5">
                          [CRITICAL]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl font-sans">{item.description}</p>

                    {/* Stock shortage warning */}
                    {isStockShortage && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-mono font-bold bg-amber-50 border border-amber-200 px-2 py-1 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>
                          [STOCK_DEFICIT] Target ({item.targetCount}) exceeds available warehouse stock ({availableStock}).
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Target vs Packed Controls & In-Stock indicator */}
                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Available Warehouse</div>
                    <div className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                      {availableStock} pcs
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-sm border border-slate-200 font-mono">
                    <button
                      onClick={() => updatePackedCount(item.id, -1)}
                      disabled={item.packedCount <= 0}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-slate-900 disabled:opacity-30 rounded-none hover:bg-slate-200"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-900 w-14 text-center tabular-nums">
                      {item.packedCount} / {item.targetCount}
                    </span>
                    <button
                      onClick={() => updatePackedCount(item.id, 1)}
                      disabled={item.packedCount >= item.targetCount}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-slate-900 disabled:opacity-30 rounded-none hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Pack Status Action */}
                  <button
                    onClick={() => togglePacked(item.id)}
                    className={`px-3 py-1.5 text-xs font-bold font-mono rounded-sm transition-colors ${
                      item.isPacked
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.isPacked ? '[PACKED]' : '[MARK_PACKED]'}
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
