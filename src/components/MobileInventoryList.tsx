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
          placeholder="Search by Part ID, team, name..."
          className="w-full bg-[#12161f] border border-[#1e242c] rounded-xl pl-9 pr-9 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Monospace Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[32px] flex items-center justify-center border ${
                isSelected
                  ? 'bg-[#222834] text-white border-zinc-700 shadow-sm'
                  : 'bg-[#12161f] text-zinc-400 hover:text-white border-[#1e242c]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Status Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b0d11] border border-[#1e242c] rounded-xl text-xs font-mono">
        <button
          onClick={() => setStatusFilter('All')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'All'
              ? 'bg-[#222834] text-white font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          ALL [{filteredItems.length}]
        </button>
        <button
          onClick={() => setStatusFilter('Available')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'Available'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          READY [{availableCount}]
        </button>
        <button
          onClick={() => setStatusFilter('Checked Out')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[32px] flex items-center justify-center ${
            statusFilter === 'Checked Out'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          OUT [{checkedOutCount}]
        </button>
      </div>

      {/* Item count ticker */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
        <span>SHOWING {filteredItems.length} HARDWARE ITEMS</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-400 hover:text-white underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-[#12161f] border border-[#1e242c] rounded-xl font-mono">
            <Tag className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">[NO_HARDWARE_FOUND]</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting filters or search terms</p>
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
                className={`bg-[#12161f] border rounded-xl p-3.5 transition-colors ${
                  isOverdue
                    ? 'border-red-500/50 bg-red-950/20'
                    : 'border-[#1e242c]'
                }`}
              >
                {/* Header row: Item ID + Status */}
                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-white bg-[#1a202c] px-2 py-0.5 rounded border border-zinc-700">
                      {item.itemId}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      · {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isAvailable ? (
                      <span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                        AVAILABLE
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 text-[10px]">
                        {item.currentUser ? `TEAM ${item.currentUser}` : 'CHECKED OUT'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Location */}
                <div className="mt-2">
                  <h3 className="text-sm font-bold text-white leading-snug font-sans">
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

                {/* Overdue Warning Alert */}
                {isOverdue && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400 font-mono font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>[OVERDUE ALERT] ({daysOut} days held &gt; 100d limit)</span>
                  </div>
                )}

                {/* Expandable details drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#1e242c] text-xs text-zinc-300 space-y-1 font-mono">
                    {item.notes && (
                      <div className="bg-[#0b0d11] p-2 rounded-lg border border-[#1e242c] text-zinc-300">
                        <span className="text-zinc-500 uppercase">Subsystem/Notes: </span>
                        <span>{item.notes}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Checkouts Logged:</span>
                      <span className="text-white font-bold">{item.timesCheckedOut || 0} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pit Cabinet Bay:</span>
                      <span className="text-white font-bold">{item.location || 'Central Shelf'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="mt-2.5 pt-2 border-t border-[#1e242c] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : item.itemId)}
                    className="py-1 px-2 text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1"
                  >
                    <span>{isExpanded ? '[-LESS]' : '[+DETAILS]'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <div>
                    {isAvailable ? (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check Out')}
                        className="px-3.5 py-1.5 bg-[#ea580c] hover:bg-orange-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenCheckout(item, 'Check In')}
                        className="px-3.5 py-1.5 bg-[#059669] hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
