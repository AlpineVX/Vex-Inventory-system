import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Wrench,
  Hash,
  Sparkles,
} from 'lucide-react';
import {
  InventoryItem,
  VexCategory,
  CLUB_TEAMS,
  CATEGORY_PREFIX_MAP,
  normalizeItemId,
} from '../types';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  preselectedItem?: InventoryItem;
  defaultAction?: 'Check Out' | 'Check In';
  presetTeam?: string;
  defaultEmail?: string;
  onSubmit: (data: {
    action: 'Check Out' | 'Check In';
    itemId: string;
    team: string;
    notes: string;
    email: string;
    category?: string;
  }) => Promise<void>;
}

const CATEGORIES: VexCategory[] = [
  'Brain',
  'Radio',
  'Optical',
  'Distance',
  'Inertial',
  'Rotational',
  'Solenoids',
];

const QUICK_NOTES = [
  'Primary chassis drive base',
  'Autonomous tracking wheel pod',
  'Flywheel shooter assembly',
  'Intake mechanism roller',
  'Pneumatics clamp actuator',
  'Pit box emergency spare',
  'Firmware verified & calibrated',
];

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  isOpen,
  onClose,
  items,
  preselectedItem,
  defaultAction = 'Check Out',
  presetTeam = '654V',
  defaultEmail = '',
  onSubmit,
}) => {
  const [action, setAction] = useState<'Check Out' | 'Check In'>(defaultAction);

  // Selection mode: 'assemble' (click Type + Part #) or 'search' (browse/search catalog)
  const [selectionMode, setSelectionMode] = useState<'assemble' | 'search'>('assemble');

  // Assembly state: Type (category) + Part Number
  const [assembledType, setAssembledType] = useState<VexCategory>('Solenoids');
  const [assembledPartNum, setAssembledPartNum] = useState<string>('001');

  // Direct item ID state (either assembled or selected)
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemSearch, setItemSearch] = useState<string>('');

  // Team state
  const [team, setTeam] = useState<string>(presetTeam);
  const [customTeam, setCustomTeam] = useState<string>('');
  const [isCustomTeam, setIsCustomTeam] = useState<boolean>(false);

  // Notes & Email
  const [notes, setNotes] = useState<string>('');
  const [email, setEmail] = useState<string>(defaultEmail);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Items under the active assembled category
  const categoryItems = useMemo(() => {
    return items.filter((i) => i.category === assembledType);
  }, [items, assembledType]);

  // Derived assembled item ID
  const computedAssembledId = useMemo(() => {
    const prefix = CATEGORY_PREFIX_MAP[assembledType] || 'VEX';
    const cleanNum = assembledPartNum.trim().toUpperCase();
    if (!cleanNum) return `${prefix}-1`;

    const normClean = normalizeItemId(cleanNum);
    // 1. If user typed or pasted the full Item ID directly (e.g. "VEXSOL-21", "VEX-O-1", "VEXS-ROT-24276GS")
    const fullMatch = items.find((i) => {
      const cur = normalizeItemId(i.itemId).toUpperCase();
      return (
        cur === normClean ||
        cur === cleanNum ||
        cur.replace(/[-\s]/g, '') === cleanNum.replace(/[-\s]/g, '') ||
        cur.replace(/[-\s]/g, '') === normClean.replace(/[-\s]/g, '')
      );
    });
    if (fullMatch) return fullMatch.itemId;

    // 2. If it already starts with the category prefix
    if (cleanNum.startsWith(prefix.toUpperCase()) || normClean.startsWith(prefix.toUpperCase())) {
      return normClean || cleanNum;
    }

    // 3. Check exact combined ID with hyphen
    const combinedHyphen = `${prefix}-${cleanNum}`;
    const hyphenMatch = items.find((i) => {
      const cur = normalizeItemId(i.itemId).toUpperCase();
      return cur === combinedHyphen.toUpperCase() || cur === normalizeItemId(combinedHyphen).toUpperCase();
    });
    if (hyphenMatch) return hyphenMatch.itemId;

    // 4. Check unpadded vs padded if numeric
    const rawNum = parseInt(cleanNum, 10);
    if (!isNaN(rawNum)) {
      const unpaddedId = `${prefix}-${rawNum}`;
      const directMatch = items.find((i) => {
        const cur = normalizeItemId(i.itemId).toUpperCase();
        return cur === unpaddedId.toUpperCase() || cur === normalizeItemId(unpaddedId).toUpperCase();
      });
      if (directMatch) return directMatch.itemId;

      const padded = cleanNum.length < 3 ? cleanNum.padStart(3, '0') : cleanNum;
      const paddedId = `${prefix}-${padded}`;
      const paddedMatch = items.find((i) => {
        const cur = normalizeItemId(i.itemId).toUpperCase();
        return cur === paddedId.toUpperCase() || cur === normalizeItemId(paddedId).toUpperCase();
      });
      if (paddedMatch) return paddedMatch.itemId;
    }

    return combinedHyphen;
  }, [assembledType, assembledPartNum, items]);

  // Currently matched item in database
  const effectiveItemId = selectionMode === 'assemble' ? computedAssembledId : selectedItemId;

  const currentMatchedItem = useMemo(() => {
    const normEff = normalizeItemId(effectiveItemId).toUpperCase();
    return items.find((i) => {
      const cur = normalizeItemId(i.itemId).toUpperCase();
      return cur === normEff || i.itemId.toUpperCase() === effectiveItemId.toUpperCase();
    });
  }, [items, effectiveItemId]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setAction(defaultAction);
      setErrorMessage(null);
      setIsSubmitting(false);

      if (preselectedItem) {
        setSelectedItemId(preselectedItem.itemId);
        setAssembledType(preselectedItem.category);
        const prefix = CATEGORY_PREFIX_MAP[preselectedItem.category] || 'VEX';
        let numPart = preselectedItem.itemId;
        if (numPart.toUpperCase().startsWith(`${prefix.toUpperCase()}-`)) {
          numPart = numPart.slice(prefix.length + 1);
        } else if (numPart.toUpperCase().startsWith(prefix.toUpperCase())) {
          numPart = numPart.slice(prefix.length);
        } else {
          const match = preselectedItem.itemId.match(/\d+$/);
          if (match) numPart = match[0];
        }
        setAssembledPartNum(numPart);
        setSelectionMode('assemble');
      } else {
        // Default to Solenoids or Motors as requested
        setAssembledType('Solenoids');
        setAssembledPartNum('001');
        setSelectedItemId('');
        setSelectionMode('assemble');
      }

      const activeTeam = presetTeam || preselectedItem?.currentUser || '654V';
      setTeam(activeTeam);
      const isClubTeam = CLUB_TEAMS.includes(activeTeam as any);
      setIsCustomTeam(!isClubTeam && Boolean(activeTeam));
      if (!isClubTeam && activeTeam) {
        setCustomTeam(activeTeam);
      }
      setNotes(
        preselectedItem?.notes && defaultAction === 'Check In'
          ? 'Returned in good working order'
          : ''
      );
      setEmail(defaultEmail || '');
    }
  }, [isOpen, preselectedItem, defaultAction, presetTeam, defaultEmail]);

  // Auto-sync team if checking in an item that has an assigned team
  useEffect(() => {
    if (action === 'Check In' && currentMatchedItem?.currentUser) {
      setTeam(currentMatchedItem.currentUser);
      setIsCustomTeam(!CLUB_TEAMS.includes(currentMatchedItem.currentUser as any));
    }
  }, [action, currentMatchedItem]);

  // Filter items for search mode
  const eligibleItems = useMemo(() => {
    let pool = items;
    if (action === 'Check Out') {
      pool = [...items].sort((a, b) => (a.status === 'Available' ? -1 : 1));
    } else {
      pool = [...items].sort((a, b) => (a.status === 'Checked Out' ? -1 : 1));
    }

    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      pool = pool.filter(
        (i) =>
          i.itemId.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.currentUser.toLowerCase().includes(q)
      );
    }
    return pool.slice(0, 24);
  }, [items, action, itemSearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalItemId = effectiveItemId;
    if (!finalItemId) {
      setErrorMessage('Please specify a valid component Type and Part Number.');
      return;
    }

    const effectiveTeam = isCustomTeam ? customTeam.trim().toUpperCase() : team;
    if (action === 'Check Out' && !effectiveTeam) {
      setErrorMessage('Please assign a team or user for this checkout.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Borrower email address is required.');
      return;
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. s123456@ltisdschools.net or student@school.org).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        action,
        itemId: finalItemId,
        team: effectiveTeam,
        notes: notes.trim(),
        email: cleanEmail,
        category: currentMatchedItem?.category || assembledType,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[94vh] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white">
              {action === 'Check Out' ? 'Hardware Check Out' : 'Hardware Check In'}
            </h2>
            <span className="text-xs text-zinc-400">· VEX Robotics Control</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toggle Strip */}
        <div className="p-4 sm:p-5 pb-0 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setAction('Check Out')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                action === 'Check Out'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Check Out (Assign to Team)</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('Check In')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                action === 'Check In'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Check In (Return to Stock)</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Item Selection Section: Assemble (Type + Part #) vs Search */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">
                1. Select Component (Type &amp; Part #) <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] bg-zinc-950 p-0.5 rounded border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectionMode('assemble')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectionMode === 'assemble'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Type + Part #
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('search')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectionMode === 'search'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Search Catalog
                </button>
              </div>
            </div>

            {selectionMode === 'assemble' ? (
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                {/* Step A: Click Type (Category) */}
                <div>
                  <div className="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                    <span>Click Component Type:</span>
                    <span className="text-zinc-300 font-mono">
                      Prefix: {CATEGORY_PREFIX_MAP[assembledType]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = assembledType === cat;
                      const prefix = CATEGORY_PREFIX_MAP[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setAssembledType(cat)}
                          className={`px-2 py-1.5 text-xs rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-200 font-bold shadow-sm'
                              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                          }`}
                        >
                          <div className="truncate">{cat}</div>
                          <div
                            className={`text-[10px] font-mono ${
                              isSelected ? 'text-zinc-700' : 'text-zinc-500'
                            }`}
                          >
                            [{prefix}]
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step B: Enter or Click Part Number */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 mb-1.5">
                    <span>Part Number:</span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {categoryItems.length} items cataloged
                    </span>
                  </div>

                  {/* Unified High-Craft Segmented Input Group */}
                  <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-700/80 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400/20 transition-all overflow-hidden shadow-inner">
                    {/* Fixed Prefix Add-on */}
                    <div className="px-3.5 py-2.5 bg-zinc-800/90 border-r border-zinc-700/80 text-xs font-mono font-bold text-zinc-200 flex items-center select-none shrink-0 tracking-wider">
                      {CATEGORY_PREFIX_MAP[assembledType]}-
                    </div>

                    {/* Numeric / Identifier Input */}
                    <input
                      type="text"
                      value={assembledPartNum}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
                        setAssembledPartNum(val);
                      }}
                      placeholder="e.g. 1"
                      className="flex-1 bg-transparent px-3 py-2 text-sm font-mono font-bold text-white placeholder-zinc-600 focus:outline-none"
                    />

                    {/* Integrated Increment / Decrement Stepper */}
                    <div className="flex items-center border-l border-zinc-700/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.max(1, (parseInt(assembledPartNum, 10) || 1) - 1);
                          setAssembledPartNum(String(n));
                        }}
                        className="px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-mono font-semibold"
                        title="Previous part number"
                      >
                        -1
                      </button>
                      <div className="w-[1px] h-4 bg-zinc-700/60" />
                      <button
                        type="button"
                        onClick={() => {
                          const n = (parseInt(assembledPartNum, 10) || 0) + 1;
                          setAssembledPartNum(String(n));
                        }}
                        className="px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-mono font-semibold"
                        title="Next part number"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Clean Quick Part Number Selector - All Parts Visible */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                      <span className="font-medium">Quick Part Select:</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        All {categoryItems.length} parts
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {categoryItems.map((item) => {
                        const numStr = item.itemId.split('-').pop() || item.itemId;
                        const isCurrent =
                          assembledPartNum === numStr ||
                          assembledPartNum === String(parseInt(numStr, 10));
                        const isAvailable = item.status === 'Available';

                        return (
                          <button
                            key={item.itemId}
                            type="button"
                            onClick={() => setAssembledPartNum(numStr)}
                            title={`${item.itemName} · ${item.status}${item.currentUser ? ` (Team ${item.currentUser})` : ''}`}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                              isCurrent
                                ? 'bg-zinc-100 text-zinc-950 border-zinc-200 font-bold shadow-sm'
                                : isAvailable
                                ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                                : 'bg-zinc-900/60 text-amber-300 border-amber-900/50 hover:border-amber-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            <span>{numStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Identified Component Confirmation Card */}
                <div className="mt-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono text-sm font-bold text-zinc-300 shrink-0">
                      #
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Resolved Hardware ID
                      </div>
                      <div className="text-sm font-bold font-mono text-white flex items-center gap-2 mt-0.5">
                        <span className="text-zinc-100">{effectiveItemId}</span>
                        {currentMatchedItem ? (
                          <span className="text-xs font-sans text-zinc-300 font-normal truncate max-w-[200px]">
                            · {currentMatchedItem.itemName}
                          </span>
                        ) : (
                          <span className="text-xs font-sans text-zinc-500 font-normal">
                            · Custom Component
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    {currentMatchedItem ? (
                      <div>
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              currentMatchedItem.status === 'Available'
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              currentMatchedItem.status === 'Available'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {currentMatchedItem.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {currentMatchedItem.currentUser
                            ? `Held by Team ${currentMatchedItem.currentUser}`
                            : 'Ready in Pit Storage'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Uncataloged Hardware</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Search Catalog mode */
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search by ID (e.g. SOL-001) or component name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-zinc-800 rounded-lg divide-y divide-zinc-800/60 bg-zinc-950">
                  {eligibleItems.map((item) => (
                    <button
                      key={item.itemId}
                      type="button"
                      onClick={() => {
                        setSelectedItemId(item.itemId);
                        setAssembledType(item.category);
                        const num = item.itemId.match(/\d+$/);
                        if (num) setAssembledPartNum(num[0]);
                        if (item.currentUser) setTeam(item.currentUser);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800/50 flex items-center justify-between transition-colors ${
                        selectedItemId === item.itemId ? 'bg-zinc-800/60' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-zinc-200">
                          <span className="font-bold">{item.itemId}</span>
                          <span className="font-sans text-zinc-300 font-normal truncate max-w-[200px]">
                            {item.itemName}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                          {item.category} {item.location ? `· ${item.location}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[11px] font-sans ${
                            item.status === 'Available' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.currentUser && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Team {item.currentUser}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Team Selector: All 11 Club Teams */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                2. {action === 'Check Out' ? 'Assign to Club Team' : 'Returning Team'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500">11 Club Teams</span>
            </div>

            {/* Club Teams Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {CLUB_TEAMS.map((t) => {
                const isSelected = !isCustomTeam && team === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTeam(t);
                      setIsCustomTeam(false);
                    }}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomTeam(true)}
                className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                  isCustomTeam
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Other...
              </button>
            </div>

            {isCustomTeam && (
              <input
                type="text"
                value={customTeam}
                onChange={(e) => setCustomTeam(e.target.value)}
                placeholder="Enter custom team or builder identifier (e.g. 654W or Mentor)"
                className="mt-2 w-full px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
              />
            )}
          </div>

          {/* 3. Deployment Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                3. Deployment Purpose &amp; Condition Notes
              </label>
              <span className="text-[11px] text-zinc-500">Optional</span>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pneumatics clamp actuator, 100 PSI tested, competition robot chassis..."
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none font-sans"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {QUICK_NOTES.slice(0, 4).map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setNotes(quick)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80 transition-colors"
                >
                  + {quick}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Responsible Person Email (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                <span>4. Borrower / Student Email Address</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-rose-400/90 font-medium">Required</span>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. s123456@ltisdschools.net or student@school.org"
              className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
            />
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-800">
            <div className="text-[11px] text-zinc-400 font-mono text-center sm:text-left">
              Selected: <span className="text-white font-semibold">{effectiveItemId}</span> &rarr;{' '}
              <span className="text-white font-semibold">
                Team {isCustomTeam ? customTeam || 'Custom' : team}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-[2] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all disabled:opacity-50 min-h-[44px] active:scale-[0.98] ${
                  action === 'Check Out'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Transaction...</span>
                  </>
                ) : (
                  <span>Record {action}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
