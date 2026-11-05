import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  RotateCcw,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { InventoryItem, VexCategory, CLUB_TEAMS, SENSOR_CATEGORIES } from '../types';
import { MobileInventoryList } from './MobileInventoryList';
import { playClick, playBeep } from '../services/soundFx';
import { getVexHardwareSpec } from '../data/vexSpecs';

interface InventoryBrowserProps {
  items: InventoryItem[];
  selectedCategory: VexCategory | 'All';
  onSelectCategory: (cat: VexCategory | 'All') => void;
  onOpenCheckout: (item: InventoryItem, defaultAction?: 'Check Out' | 'Check In') => void;
  onBatchAction?: (items: InventoryItem[], action: 'Check Out' | 'Check In') => void;
  isAdmin?: boolean;
  onOpenAdminUnlock?: () => void;
  isMobileMode?: boolean;
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

export const InventoryBrowser: React.FC<InventoryBrowserProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
  onOpenCheckout,
  onBatchAction,
  isAdmin = false,
  onOpenAdminUnlock,
  isMobileMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Checked Out'>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'itemId' | 'itemName' | 'category' | 'status' | 'dateOut'>('itemId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        if (cat === 'Sensors') {
          counts[cat] = items.filter(
            (i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors'
          ).length;
        } else if (cat === 'Solenoids') {
          counts[cat] = items.filter((i) => i.category === 'Solenoids' || (i as any).category === 'Solenoid').length;
        } else {
          counts[cat] = items.filter((i) => i.category === cat).length;
        }
      }
    });
    return counts;
  }, [items]);

  // Unique teams currently with items plus official club teams
  const activeTeams = useMemo(() => {
    const teams = new Set<string>(CLUB_TEAMS);
    items.forEach((item) => {
      if (item.currentUser) teams.add(item.currentUser);
    });
    return Array.from(teams);
  }, [items]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Category filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Sensors') {
        result = result.filter(
          (i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors'
        );
      } else if (selectedCategory === 'Solenoids') {
        result = result.filter((i) => i.category === 'Solenoids' || (i as any).category === 'Solenoid');
      } else {
        result = result.filter((i) => i.category === selectedCategory);
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Team filter
    if (teamFilter !== 'All') {
      if (teamFilter === 'Unassigned') {
        result = result.filter((i) => !i.currentUser);
      } else {
        result = result.filter((i) => i.currentUser === teamFilter);
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.itemId.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.currentUser.toLowerCase().includes(q) ||
          i.notes.toLowerCase().includes(q) ||
          (i.location && i.location.toLowerCase().includes(q))
      );
    }

    // Sorting (with natural numeric sorting so VEXM-2 comes before VEXM-10)
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'itemId') {
        cmp = a.itemId.localeCompare(b.itemId, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'itemName') {
        cmp = a.itemName.localeCompare(b.itemName, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'category') {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'dateOut') {
        cmp = (a.dateOut || '').localeCompare(b.dateOut || '');
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [items, selectedCategory, statusFilter, teamFilter, searchQuery, sortField, sortAsc]);

  // Instant Item Profile matching (Page 10 in spreadsheet)
  const matchedExactItem = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toUpperCase();
    return items.find((i) => i.itemId.toUpperCase() === q);
  }, [searchQuery, items]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((i) => i.itemId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const exportToCSV = () => {
    const headers = ['Item ID', 'Item Name', 'Category', 'Status', 'Current Team/User', 'Date Out', 'Notes', 'Location'];
    const rows = filteredItems.map((i) => [
      i.itemId,
      `"${i.itemName.replace(/"/g, '""')}"`,
      i.category,
      i.status,
      i.currentUser || '',
      i.dateOut || '',
      `"${(i.notes || '').replace(/"/g, '""')}"`,
      `"${(i.location || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VEX_Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedItemsList = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.itemId));
  }, [items, selectedIds]);

  const resetFilters = () => {
    setSearchQuery('');
    onSelectCategory('All');
    setStatusFilter('All');
    setTeamFilter('All');
  };

  if (isMobileMode) {
    return (
      <MobileInventoryList
        items={items}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        onOpenCheckout={onOpenCheckout}
        isAdmin={isAdmin}
        onOpenAdminUnlock={onOpenAdminUnlock || (() => {})}
      />
    );
  }

  return (
    <>
      {/* Dedicated Mobile View for phones */}
      <div className="block md:hidden">
        <MobileInventoryList
          items={items}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onOpenCheckout={onOpenCheckout}
          isAdmin={isAdmin}
          onOpenAdminUnlock={onOpenAdminUnlock || (() => {})}
        />
      </div>

      {/* Desktop Rich Table View */}
      <div className="hidden md:block space-y-4">
        {/* Top Header & Fast Filter Bar */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#1c222b]">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                Universal Inventory Master Catalog
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Search, audit, and batch process {items.length} registered hardware items.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 bg-[#161a22] hover:bg-[#21262d] border border-[#1e242c] rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Category Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#222834] text-white font-semibold border-zinc-700 shadow-sm'
                      : 'bg-[#12161f] text-zinc-400 hover:text-white hover:bg-[#1a202a] border-[#1e242c]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-amber-400 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    [{count}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Control Bar: Search + Status Filter + Team Filter */}
        <div className="p-3 bg-[#12161f] border border-[#1e242c] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item ID, specs, team... (Press '/' to focus)"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#0b0d11] border border-[#1e242c] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Secondary Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Segmented Control */}
            <div className="flex items-center bg-[#0b0d11] p-0.5 rounded-lg border border-[#1e242c] text-xs font-mono">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'All' ? 'bg-[#222834] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setStatusFilter('Available')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'Available'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                AVAILABLE
              </button>
              <button
                onClick={() => setStatusFilter('Checked Out')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'Checked Out'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                OUT
              </button>
            </div>

            {/* Team Filter Dropdown */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#0b0d11] border border-[#1e242c] rounded-lg text-zinc-300 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="All">[ALL_TEAMS]</option>
              {activeTeams.map((t) => (
                <option key={t} value={t}>
                  Team {t}
                </option>
              ))}
              <option value="Unassigned">[UNASSIGNED_IN_PIT]</option>
            </select>

            {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'All' || teamFilter !== 'All') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-[#161a22] border border-[#1e242c] rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Instant Item Profile & Scan Tool */}
        {matchedExactItem && (
          <div className="p-4 bg-[#161a22] border border-[#212631] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  QUICK ITEM LOOKUP
                </span>
                <span className="text-xs font-mono font-bold text-white bg-[#0b0d11] px-2 py-0.5 rounded border border-[#212631]">
                  {matchedExactItem.itemId}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{matchedExactItem.itemName}</div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span>
                  Status:{' '}
                  <strong
                    className={
                      matchedExactItem.status === 'Available'
                        ? 'text-emerald-400 font-mono'
                        : 'text-amber-400 font-mono'
                    }
                  >
                    [{matchedExactItem.status.toUpperCase()}]
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Current Holder:{' '}
                  <strong className="text-zinc-200">
                    {matchedExactItem.currentUser
                      ? `Team ${matchedExactItem.currentUser}`
                      : 'In Pit Warehouse'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Season Checkouts:{' '}
                  <strong className="text-zinc-200 font-mono">
                    {matchedExactItem.timesCheckedOut}
                  </strong>
                </span>
                {matchedExactItem.dateOut && (
                  <>
                    <span>·</span>
                    <span>Date Out: <span className="font-mono text-zinc-300">{matchedExactItem.dateOut}</span></span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {matchedExactItem.status === 'Available' ? (
                <button
                  onClick={() => onOpenCheckout(matchedExactItem, 'Check Out')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
                >
                  Check Out {matchedExactItem.itemId}
                </button>
              ) : (
                <button
                  onClick={() => onOpenCheckout(matchedExactItem, 'Check In')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                >
                  Check In (Return)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bulk Action Toolbar if items selected */}
        {selectedIds.size > 0 && onBatchAction && (
          <div className="flex items-center justify-between p-3 bg-[#161a22] border border-[#212631] rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">[{selectedIds.size}_ITEMS_SELECTED]</span>
              <span className="text-zinc-400">· Batch action:</span>
            </div>
            <div className="flex items-center gap-2 font-sans">
              <button
                onClick={() => {
                  onBatchAction(selectedItemsList, 'Check Out');
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 bg-[#ea580c] hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Batch Check Out
              </button>
              <button
                onClick={() => {
                  onBatchAction(selectedItemsList, 'Check In');
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Batch Check In
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Dense High-Performance Data Table */}
        <div className="border border-[#1e242c] bg-[#12161f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0e1218] border-b border-[#1e242c] text-zinc-400 select-none font-medium">
                <tr>
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-zinc-700 bg-[#0b0d11] text-amber-500 accent-amber-500 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => toggleSort('itemId')}
                    className="py-3 px-3 w-32 font-semibold hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>PART ID</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('itemName')}
                    className="py-3 px-3 w-64 font-semibold hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ITEM NAME &amp; SPECS</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('category')}
                    className="py-3 px-3 w-32 font-semibold hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>CATEGORY</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="py-3 px-3 w-28 font-semibold hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>STATUS</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 w-36 font-semibold">CURRENT HOLDER</th>
                  <th
                    onClick={() => toggleSort('dateOut')}
                    className="py-3 px-3 w-28 font-semibold hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>DATE OUT</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[180px] font-semibold">LOCATION &amp; NOTES</th>
                  <th className="py-3 px-3 w-24 text-right font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2029] font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400 font-mono">
                      <p className="text-sm font-medium text-white">[NO_MATCHING_ITEMS_FOUND]</p>
                      <p className="text-xs text-zinc-500 mt-1 font-sans">Try adjusting search parameters or reset filters</p>
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#161a22] hover:bg-[#21262d] border border-[#1e242c] rounded-lg transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isChecked = selectedIds.has(item.itemId);
                    const isAvailable = item.status === 'Available';
                    const cleanItemName =
                      !item.itemName || item.itemName === '#N/A' || item.itemName.startsWith('Dashboard #')
                        ? `VEX ${item.category} Component`
                        : item.itemName;
                    const cleanNotes =
                      item.notes && !item.notes.includes('█') && !item.notes.includes('#') && !item.notes.includes('░')
                        ? item.notes
                        : '';
                    const spec = getVexHardwareSpec(item.category);

                    return (
                      <tr
                        key={item.itemId}
                        className={`group hover:bg-[#181d27] transition-colors ${
                          isChecked ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              playClick();
                              handleToggleSelect(item.itemId);
                            }}
                            className="rounded border-zinc-700 bg-[#0b0d11] text-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </td>

                        {/* Item ID */}
                        <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                          <span className="truncate max-w-[140px] inline-block bg-[#161a22] px-2 py-0.5 rounded border border-zinc-700 font-mono">
                            {item.itemId}
                          </span>
                        </td>

                        {/* Item Name */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-white group-hover:text-amber-400 line-clamp-1 transition-colors">
                            {cleanItemName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span className="text-zinc-400 truncate max-w-[180px]" title={spec.interfaceProtocol}>
                              {spec.interfaceProtocol}
                            </span>
                            {item.timesCheckedOut > 0 && (
                              <span className="text-zinc-500">· {item.timesCheckedOut}x out</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 text-zinc-300 text-xs whitespace-nowrap font-mono">
                          {item.category}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isAvailable ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                              AVAILABLE
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded">
                              CHECKED OUT
                            </span>
                          )}
                        </td>

                        {/* Team / Holder */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.currentUser ? (
                            <span className="font-mono font-bold text-white">
                              Team {item.currentUser}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-mono">—</span>
                          )}
                        </td>

                        {/* Date Out */}
                        <td className="py-2.5 px-3 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                          {item.dateOut || '—'}
                        </td>

                        {/* Notes / Location */}
                        <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate" title={cleanNotes || item.location}>
                          <div className="truncate text-zinc-300">{cleanNotes || '—'}</div>
                          {item.location && (
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isAvailable ? (
                            <button
                              onClick={() => {
                                playBeep();
                                onOpenCheckout(item, 'Check Out');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded-md transition-colors active:translate-y-px btn-tactile"
                            >
                              Check Out
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                playBeep();
                                onOpenCheckout(item, 'Check In');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-600 rounded-md transition-colors active:translate-y-px btn-tactile"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="px-4 py-3 bg-[#0e1218] border-t border-[#1e242c] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <span>
                SHOWING <span className="font-bold text-white">{filteredItems.length}</span> OF{' '}
                <span className="font-bold text-white">{items.length}</span> ITEMS
              </span>
              {selectedCategory !== 'All' && <span>IN [{selectedCategory.toUpperCase()}]</span>}
            </div>
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-emerald-400 font-bold">{filteredItems.filter((i) => i.status === 'Available').length}</strong> AVAILABLE
              </span>
              <span>·</span>
              <span>
                <strong className="text-amber-400 font-bold">{filteredItems.filter((i) => i.status === 'Checked Out').length}</strong> DEPLOYED
              </span>
            </div>
          </div>
        </div>
      </div>
  </>
);
};
