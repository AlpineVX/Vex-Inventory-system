import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { InventoryItem, VexCategory, SENSOR_CATEGORIES } from '../types';

interface MobileInventoryListProps {
  items: InventoryItem[];
  selectedCategory: VexCategory | 'All';
  onSelectCategory: (cat: VexCategory | 'All') => void;
  onOpenCheckout: (item: InventoryItem, action?: 'Check Out' | 'Check In') => void;
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
  selectedCategory,
  onSelectCategory,
  onOpenCheckout,
  isAdmin,
  onOpenAdminUnlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Checked Out'>('All');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

    // Category filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Sensors') {
        result = result.filter(
          (i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors'
        );
      } else if (selectedCategory === 'Solenoids') {
        result = result.filter(
          (i) => i.category === 'Solenoids' || (i as any).category === 'Solenoid'
        );
      } else {
        result = result.filter((i) => i.category === selectedCategory);
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.itemId.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.currentUser && i.currentUser.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, selectedCategory, statusFilter, searchQuery]);

  const availableCount = filteredItems.filter((i) => i.status === 'Available').length;
  const checkedOutCount = filteredItems.filter((i) => i.status === 'Checked Out').length;

  const now = Date.now();

  return (
    <div className="space-y-3 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Part ID, team, name..."
          className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-9 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Monospace Filter Row */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 font-mono text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[32px] flex items-center justify-center border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
            >
              [{cat.toUpperCase()}]
            </button>
          );
        })}
      </div>

      {/* Status Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-sm font-mono text-xs">
        <button
          onClick={() => setStatusFilter('All')}
          className={`py-1 text-xs font-semibold rounded-sm transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'All'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ALL [{filteredItems.length}]
        </button>
        <button
          onClick={() => setStatusFilter('Available')}
          className={`py-1 text-xs font-semibold rounded-sm transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'Available'
              ? 'bg-emerald-700 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          READY [{availableCount}]
        </button>
        <button
          onClick={() => setStatusFilter('Checked Out')}
          className={`py-1 text-xs font-semibold rounded-sm transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'Checked Out'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          OUT [{checkedOutCount}]
        </button>
      </div>

      {/* Item count ticker */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <span>SHOWING {filteredItems.length} HARDWARE ITEMS</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-700 hover:text-slate-900 underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-sm font-mono">
            <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">[NO_HARDWARE_FOUND]</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or search terms</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.status === 'Available';
            const isExpanded = expandedItemId === item.itemId;

            // Check overdue
            let isOverdue = false;
            let daysOut = 0;
            if (!isAvailable && item.dateOut) {
              const diffMs = now - new Date(item.dateOut).getTime();
              daysOut = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              isOverdue = daysOut >= 100;
            }

            return (
              <div
                key={item.itemId}
                className={`bg-white border rounded-sm p-3 transition-colors ${
                  isOverdue
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row: Item ID + Status */}
                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                      {item.itemId}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      · {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isAvailable ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300 text-[10px]">
                        [AVAILABLE]
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-300 text-[10px]">
                        {item.currentUser ? `[TEAM ${item.currentUser}]` : '[CHECKED_OUT]'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Location */}
                <div className="mt-1.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug font-sans">
                    {item.itemName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap font-mono">
                    {item.location && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.location}
                      </span>
                    )}
                    {!isAvailable && item.dateOut && (
                      <span className="text-slate-600">
                        · OUT: {daysOut}d ago
                      </span>
                    )}
                  </div>
                </div>

                {/* Overdue Warning Alert */}
                {isOverdue && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-none flex items-center gap-2 text-xs text-red-800 font-mono font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>[OVERDUE_ALERT] ({daysOut} days held &gt; 100d limit)</span>
                  </div>
                )}

                {/* Expandable details drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                    {item.notes && (
                      <div className="bg-slate-50 p-1.5 border border-slate-200 text-slate-800">
                        <span className="text-slate-500 uppercase">Subsystem/Notes: </span>
                        <span>{item.notes}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Checkouts Logged:</span>
                      <span className="text-slate-900 font-bold">{item.timesCheckedOut || 0} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pit Cabinet Bay:</span>
                      <span className="text-slate-900 font-bold">{item.location || 'Central Shelf'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : item.itemId)}
                    className="py-1 px-2 text-slate-500 hover:text-slate-900 text-xs font-mono flex items-center gap-1"
                  >
                    <span>{isExpanded ? '[-LESS]' : '[+DETAILS]'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <div>
                    {isAvailable ? (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check Out')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs rounded-sm flex items-center gap-1 transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>[CHECK_OUT]</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check In')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs rounded-sm flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>[CHECK_IN]</span>
                      </button>
                    )}
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
