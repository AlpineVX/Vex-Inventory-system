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
} from 'lucide-react';
import { InventoryItem, VexCategory, CLUB_TEAMS } from '../types';

interface InventoryBrowserProps {
  items: InventoryItem[];
  selectedCategory: VexCategory | 'All';
  onSelectCategory: (cat: VexCategory | 'All') => void;
  onOpenCheckout: (item: InventoryItem, defaultAction?: 'Check Out' | 'Check In') => void;
  onBatchAction?: (items: InventoryItem[], action: 'Check Out' | 'Check In') => void;
}

const CATEGORIES: (VexCategory | 'All')[] = [
  'All',
  'Motors',
  'Brain',
  'Radio',
  'Optical',
  'Distance',
  'Inertial',
  'Rotational',
  'Solenoids',
];

export const InventoryBrowser: React.FC<InventoryBrowserProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
  onOpenCheckout,
  onBatchAction,
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
        counts[cat] = items.filter((i) => i.category === cat).length;
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
      result = result.filter((i) => i.category === selectedCategory);
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

    // Sorting
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'itemId') {
        cmp = a.itemId.localeCompare(b.itemId);
      } else if (sortField === 'itemName') {
        cmp = a.itemName.localeCompare(b.itemName);
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

  return (
    <div className="space-y-5">
      {/* Top Header & Fast Filter Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Universal Inventory Browser
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Search and filter across 279 hardware items with live status updates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category Segmented Filter Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isActive ? 'text-zinc-600 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Search + Status Filter + Team Filter */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item ID, name, notes, team... (Press '/' to focus)"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Secondary Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Control */}
          <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'All' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('Available')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'Available'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('Checked Out')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'Checked Out'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Checked Out
            </button>
          </div>

          {/* Team Filter Dropdown */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Teams</option>
            {activeTeams.map((t) => (
              <option key={t} value={t}>
                Team {t}
              </option>
            ))}
            <option value="Unassigned">Unassigned (In Pit)</option>
          </select>

          {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'All' || teamFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar if items selected */}
      {selectedIds.size > 0 && onBatchAction && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-lg bg-indigo-950/50 border border-indigo-800/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-200">{selectedIds.size} items selected</span>
            <span className="text-zinc-400">· Apply batch operation:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchAction(selectedItemsList, 'Check Out')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors"
            >
              Batch Check Out
            </button>
            <button
              onClick={() => onBatchAction(selectedItemsList, 'Check In')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors"
            >
              Batch Check In (Return)
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-200"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Dense High-Performance Data Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => toggleSort('itemId')}
                  className="py-3 px-3 font-semibold hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item ID</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('itemName')}
                  className="py-3 px-3 font-semibold hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item Name & Specs</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('category')}
                  className="py-3 px-3 font-semibold hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-3 font-semibold hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">Team / Current Holder</th>
                <th
                  onClick={() => toggleSort('dateOut')}
                  className="py-3 px-3 font-semibold hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date Out</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">Location & Notes</th>
                <th className="py-3 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <p className="text-sm font-medium text-zinc-400">No matching items found</p>
                    <p className="text-xs text-zinc-500 mt-1">Try adjusting your search criteria or resetting filters</p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-zinc-800/80 rounded-md transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedIds.has(item.itemId);
                  const isAvailable = item.status === 'Available';

                  return (
                    <tr
                      key={item.itemId}
                      className={`group hover:bg-zinc-800/40 transition-colors ${
                        isChecked ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.itemId)}
                          className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Item ID in tabular mono */}
                      <td className="py-2.5 px-3 font-mono font-medium text-zinc-200 whitespace-nowrap">
                        {item.itemId}
                      </td>

                      {/* Item Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-zinc-100 group-hover:text-white">{item.itemName}</div>
                        {item.timesCheckedOut > 0 && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            Checked out {item.timesCheckedOut}x this season
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {item.category}
                      </td>

                      {/* Status - Clean unboxed text with semantic indicator (Zero-pill discipline) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              isAvailable ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>

                      {/* Team / Holder */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.currentUser ? (
                          <span className="font-mono font-semibold text-zinc-200">
                            Team {item.currentUser}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Date Out */}
                      <td className="py-2.5 px-3 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                        {item.dateOut || '—'}
                      </td>

                      {/* Notes / Location */}
                      <td className="py-2.5 px-3 text-zinc-400 max-w-xs truncate" title={item.notes}>
                        <div className="truncate text-zinc-300">{item.notes || '—'}</div>
                        {item.location && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isAvailable ? (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check Out')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/60 rounded transition-colors active:scale-95"
                          >
                            Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckout(item, 'Check In')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 rounded transition-colors active:scale-95"
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
        <div className="px-4 py-3 bg-zinc-950/70 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-mono font-medium text-zinc-200">{filteredItems.length}</span> of{' '}
              <span className="font-mono font-medium text-zinc-200">{items.length}</span> total items
            </span>
            {selectedCategory !== 'All' && <span>in {selectedCategory}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {filteredItems.filter((i) => i.status === 'Available').length} available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {filteredItems.filter((i) => i.status === 'Checked Out').length} checked out
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
