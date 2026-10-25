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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID (e.g. VEXS-O-001), team, name..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Horizontal Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[36px] flex items-center justify-center ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Status Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900 border border-zinc-800/80 rounded-xl">
        <button
          onClick={() => setStatusFilter('All')}
          className={`py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] flex items-center justify-center ${
            statusFilter === 'All'
              ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All ({filteredItems.length})
        </button>
        <button
          onClick={() => setStatusFilter('Available')}
          className={`py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] flex items-center justify-center ${
            statusFilter === 'Available'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Available ({availableCount})
        </button>
        <button
          onClick={() => setStatusFilter('Checked Out')}
          className={`py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] flex items-center justify-center ${
            statusFilter === 'Checked Out'
              ? 'bg-blue-950/60 border border-blue-500/40 text-blue-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Checked Out ({checkedOutCount})
        </button>
      </div>

      {/* Item count ticker */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Showing {filteredItems.length} items</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-400 hover:text-zinc-200 underline text-[11px]"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No hardware found</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting filters or search terms</p>
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
                className={`bg-zinc-900/90 border rounded-2xl p-3.5 transition-all shadow-sm ${
                  isOverdue
                    ? 'border-red-500/50 bg-red-950/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header row: ID + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-100 tracking-tight">
                      {item.itemId}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-full">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {item.currentUser || 'Out'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Location */}
                <div className="mt-1.5">
                  <h3 className="text-sm font-semibold text-zinc-200 leading-snug">
                    {item.itemName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                    {item.location && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        {item.location}
                      </span>
                    )}
                    {!isAvailable && item.dateOut && (
                      <span className="text-zinc-500">
                        Checked out {daysOut}d ago
                      </span>
                    )}
                  </div>
                </div>

                {/* Overdue Warning Alert */}
                {isOverdue && (
                  <div className="mt-2 p-2 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300 font-medium">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Overdue for return ({daysOut} days held &gt; 100 day limit)</span>
                  </div>
                )}

                {/* Expandable details drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-400 space-y-1">
                    {item.notes && (
                      <div>
                        <span className="text-zinc-500">Condition/Notes: </span>
                        <span className="text-zinc-300">{item.notes}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500">Total Checkouts: </span>
                      <span className="font-mono text-zinc-300">{item.timesCheckedOut || 0} times</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Default Bay: </span>
                      <span className="text-zinc-300">{item.location || 'Cabinet'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center gap-2">
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : item.itemId)}
                    className="p-2 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 min-h-[44px] min-w-[44px]"
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 flex justify-end">
                    {isAvailable ? (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check Out')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all min-h-[44px]"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Check Out</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check In')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all min-h-[44px]"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Check In</span>
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
