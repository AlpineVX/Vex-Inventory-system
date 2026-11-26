import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Loader2,
  Plus,
  Wrench,
} from 'lucide-react';
import {
  InventoryItem,
  VexCategory,
  CLUB_TEAMS,
  CATEGORY_PREFIX_MAP,
  normalizeItemId,
  classifyVexCategory,
  isValidVexId,
} from '../types';
import { playClick, playSuccess } from '../services/soundFx';
import { getVexHardwareSpec } from '../data/vexSpecs';
import { useSlidingIndicator } from './MotionPrimitives';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  preselectedItem?: InventoryItem;
  defaultAction?: 'Check Out' | 'Check In';
  presetTeam?: string;
  defaultEmail?: string;
  isAdmin?: boolean;
  onSubmit: (data: {
    action: 'Check Out' | 'Check In';
    itemId: string;
    team: string;
    notes: string;
    email: string;
    category?: string;
    flagNeedsRepair?: boolean;
  }) => Promise<void>;
  onBatchSubmit?: (
    entries: Array<{
      action: 'Check Out' | 'Check In';
      itemId: string;
      team: string;
      notes: string;
      email: string;
      category?: string;
      flagNeedsRepair?: boolean;
    }>
  ) => Promise<void>;
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
  isAdmin = false,
  onSubmit,
  onBatchSubmit,
}) => {
  const [action, setAction] = useState<'Check Out' | 'Check In'>(defaultAction);

  // Selection mode: 'assemble' (click Type + Part #) or 'search' (browse/search catalog)
  const [selectionMode, setSelectionMode] = useState<'assemble' | 'search'>('assemble');
  const { containerRef: modeBarRef, setItemRef: setModeTabRef, indicator: modeIndicator } =
    useSlidingIndicator<'assemble' | 'search'>(selectionMode, [isOpen]);

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

  // Notes, Health & Email
  const [notes, setNotes] = useState<string>('');
  const [email, setEmail] = useState<string>(defaultEmail);
  const [flagNeedsRepair, setFlagNeedsRepair] = useState<boolean>(false);

  // Batch queue state
  const [queuedItems, setQueuedItems] = useState<
    Array<{ itemId: string; category: string; itemName?: string }>
  >([]);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Items under the active assembled category
  const categoryItems = useMemo(() => {
    return items.filter((i) => i.category === assembledType);
  }, [items, assembledType]);

  // Live availability summary per category for quick orientation
  const categoryStats = useMemo(() => {
    const stats: Record<string, { avail: number; total: number }> = {};
    CATEGORIES.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      stats[cat] = {
        avail: catItems.filter((i) => i.status === 'Available').length,
        total: catItems.length,
      };
    });
    return stats;
  }, [items]);

  // Derived assembled item ID
  const computedAssembledId = useMemo(() => {
    const cleanInput = assembledPartNum.trim();
    if (!cleanInput) {
      const prefix = CATEGORY_PREFIX_MAP[assembledType] || 'VEX';
      return `${prefix}-1`;
    }

    // 1. Direct normalization with category hint (handles "4", "DIST-4", "VEX-DIST-4", "04", etc.)
    const normalized = normalizeItemId(cleanInput, assembledType);

    // 2. Check if normalized ID matches any catalog item
    const normUpper = normalized.toUpperCase();
    const catalogMatch = items.find((i) => {
      const curNorm = normalizeItemId(i.itemId, i.category).toUpperCase();
      return (
        curNorm === normUpper ||
        i.itemId.toUpperCase() === normUpper ||
        curNorm.replace(/[-\s]/g, '') === normUpper.replace(/[-\s]/g, '')
      );
    });
    if (catalogMatch) return catalogMatch.itemId;

    // 3. If valid VEX ID after normalization, return it
    if (isValidVexId(normalized)) {
      return normalized;
    }

    // 4. Fallback: prepend category prefix if not already present
    const prefix = CATEGORY_PREFIX_MAP[assembledType] || 'VEX';
    if (!cleanInput.toUpperCase().startsWith(prefix.toUpperCase())) {
      const numOnly = cleanInput.replace(/\D+/g, '');
      const cleanNum = numOnly ? parseInt(numOnly, 10) : cleanInput;
      return `${prefix}-${cleanNum}`;
    }

    return normalized;
  }, [assembledType, assembledPartNum, items]);

  // Currently matched item in database
  const effectiveItemId = useMemo(() => {
    if (selectionMode === 'assemble') {
      return computedAssembledId;
    }
    // In search mode: if an item was explicitly clicked
    if (selectedItemId) {
      return selectedItemId;
    }
    // Fallback: if user typed directly into search box
    if (itemSearch.trim()) {
      const normSearch = normalizeItemId(itemSearch.trim());
      const normUpper = normSearch.toUpperCase();
      const found = items.find((i) => {
        const curNorm = normalizeItemId(i.itemId, i.category).toUpperCase();
        return (
          curNorm === normUpper ||
          i.itemId.toUpperCase() === normUpper ||
          curNorm.replace(/[-\s]/g, '') === normUpper.replace(/[-\s]/g, '')
        );
      });
      if (found) return found.itemId;
      if (isValidVexId(normSearch)) return normSearch;
    }
    return '';
  }, [selectionMode, computedAssembledId, selectedItemId, itemSearch, items]);

  const currentMatchedItem = useMemo(() => {
    if (!effectiveItemId) return undefined;
    const normEff = normalizeItemId(effectiveItemId).toUpperCase();
    return items.find((i) => {
      const cur = normalizeItemId(i.itemId, i.category).toUpperCase();
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
        const safeCat = classifyVexCategory(preselectedItem.category, preselectedItem.itemName, preselectedItem.itemId);
        const resolvedCat: VexCategory = safeCat === 'Sensors' ? 'Distance' : safeCat;
        setAssembledType(resolvedCat);
        const prefix = CATEGORY_PREFIX_MAP[resolvedCat] || 'VEX';
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
        setAssembledType('Solenoids');
        setAssembledPartNum('1');
        setSelectedItemId('');
        setSelectionMode('assemble');
      }

      const activeTeam =
        defaultAction === 'Check In' && preselectedItem?.currentUser
          ? preselectedItem.currentUser
          : presetTeam || preselectedItem?.currentUser || '654V';
      setTeam(activeTeam);
      const isClubTeam = CLUB_TEAMS.includes(activeTeam as any);
      setIsCustomTeam(!isClubTeam && Boolean(activeTeam));
      setCustomTeam(!isClubTeam && activeTeam ? activeTeam : '');
      setNotes(
        preselectedItem?.notes && defaultAction === 'Check In'
          ? 'Returned in good working order'
          : ''
      );
      setEmail(defaultEmail || '');
      setFlagNeedsRepair(false);
      setQueuedItems([]);
    }
  }, [isOpen, preselectedItem, defaultAction, presetTeam, defaultEmail]);

  // Auto-sync team if checking in an item that has an assigned team
  useEffect(() => {
    if (action === 'Check In' && currentMatchedItem?.currentUser) {
      const holder = currentMatchedItem.currentUser;
      setTeam(holder);
      const isClub = CLUB_TEAMS.includes(holder as any);
      setIsCustomTeam(!isClub);
      if (!isClub) {
        setCustomTeam(holder);
      }
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
          String(i.itemId || '').toLowerCase().includes(q) ||
          String(i.itemName || '').toLowerCase().includes(q) ||
          String(i.category || '').toLowerCase().includes(q) ||
          String(i.currentUser || '').toLowerCase().includes(q)
      );
    }
    return pool.slice(0, 24);
  }, [items, action, itemSearch]);

  const activeSpec = useMemo(() => {
    return getVexHardwareSpec(currentMatchedItem?.category || assembledType);
  }, [currentMatchedItem, assembledType]);

  if (!isOpen) return null;

  const handleAddCurrentToQueue = () => {
    if (!effectiveItemId) return;
    const normalizedFinalId = normalizeItemId(
      effectiveItemId,
      currentMatchedItem?.category || assembledType
    );
    const cat =
      currentMatchedItem?.category ||
      classifyVexCategory(undefined, undefined, normalizedFinalId) ||
      assembledType;

    setQueuedItems((prev) => {
      if (prev.some((q) => q.itemId.toUpperCase() === normalizedFinalId.toUpperCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          itemId: normalizedFinalId,
          category: cat,
          itemName: currentMatchedItem?.itemName,
        },
      ];
    });
    playClick();
  };

  const handleRemoveQueued = (itemId: string) => {
    playClick();
    setQueuedItems((prev) => prev.filter((q) => q.itemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalItemId = effectiveItemId;
    if (queuedItems.length === 0 && !finalItemId) {
      setErrorMessage('Please specify a valid component Type and Part Number.');
      return;
    }

    const rawTeam = isCustomTeam ? customTeam.trim().toUpperCase() : team;
    const effectiveTeam = rawTeam || currentMatchedItem?.currentUser || presetTeam || '654V';
    if (action === 'Check Out' && !rawTeam) {
      setErrorMessage('Please assign a team or user for this checkout.');
      return;
    }

    const cleanEmail = email.trim();
    if (!isAdmin && !cleanEmail) {
      setErrorMessage('Borrower email address is required.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. s123456@ltisdschools.net or student@school.org).');
      return;
    }

    const effectiveNotes =
      flagNeedsRepair && action === 'Check In' && !/repair|broken|damage|issue/i.test(notes)
        ? `${notes.trim() ? `${notes.trim()} · ` : ''}Needs repair check`
        : notes.trim();

    setIsSubmitting(true);
    try {
      if (queuedItems.length > 0) {
        const entries = queuedItems.map((q) => ({
          action,
          itemId: q.itemId,
          team: effectiveTeam,
          notes: effectiveNotes,
          email: cleanEmail,
          category: q.category,
          flagNeedsRepair: action === 'Check In' ? flagNeedsRepair : undefined,
        }));
        if (onBatchSubmit) {
          await onBatchSubmit(entries);
        } else {
          for (const entry of entries) {
            await onSubmit(entry);
          }
        }
      } else {
        const normalizedFinalId = normalizeItemId(
          finalItemId,
          currentMatchedItem?.category || assembledType
        );
        await onSubmit({
          action,
          itemId: normalizedFinalId,
          team: effectiveTeam,
          notes: effectiveNotes,
          email: cleanEmail,
          category:
            currentMatchedItem?.category ||
            classifyVexCategory(undefined, undefined, normalizedFinalId) ||
            assembledType,
          flagNeedsRepair: action === 'Check In' ? flagNeedsRepair : undefined,
        });
      }
      playSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter"
    >
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[94vh] pb-[env(safe-area-inset-bottom,0px)] animate-modal-enter">
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              {action === 'Check Out' ? 'Check Out Part' : 'Check In Part'}
            </h2>
            <span className="text-xs text-zinc-400">· Team 654</span>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toggle Strip with Sliding Pill */}
        <div className="p-4 sm:p-5 pb-0 shrink-0">
          <div className="relative grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <div
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-sm pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] ${
                action === 'Check Out'
                  ? 'translate-x-0 bg-red-600'
                  : 'translate-x-full bg-zinc-100'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                playClick();
                setAction('Check Out');
              }}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-2.5 sm:py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${
                action === 'Check Out'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Check Out</span>
              <span className="hidden sm:inline">Check Out (Assign to Team)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setAction('Check In');
              }}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-2.5 sm:py-2 text-xs font-semibold rounded-md transition-colors duration-200 ${
                action === 'Check In'
                  ? 'text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Check In</span>
              <span className="hidden sm:inline">Check In (Return to Stock)</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Item Selection Section: Assemble (Type + Part #) vs Search */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">
                1. Select Component (Type &amp; Part #) <span className="text-rose-400">*</span>
              </label>
              <div
                ref={modeBarRef}
                className="relative flex items-center gap-1 text-[11px] bg-zinc-950 p-0.5 rounded border border-zinc-800"
              >
                {modeIndicator.ready && (
                  <div
                    aria-hidden="true"
                    style={{
                      transform: `translate3d(${modeIndicator.left}px, ${modeIndicator.top}px, 0)`,
                      width: `${modeIndicator.width}px`,
                      height: `${modeIndicator.height}px`,
                    }}
                    className="absolute top-0 left-0 rounded bg-zinc-800 border border-red-500/35 pointer-events-none transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
                  />
                )}
                <button
                  ref={setModeTabRef('assemble')}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectionMode('assemble');
                  }}
                  className={`relative z-10 px-2 py-0.5 rounded transition-colors ${
                    selectionMode === 'assemble'
                      ? 'text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Type + Part #
                </button>
                <button
                  ref={setModeTabRef('search')}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectionMode('search');
                  }}
                  className={`relative z-10 px-2 py-0.5 rounded transition-colors ${
                    selectionMode === 'search'
                      ? 'text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Search Catalog
                </button>
              </div>
            </div>

            {selectionMode === 'assemble' ? (
              <div key="mode-assemble" className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 animate-fade-in-up">
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
                      const stat = categoryStats[cat] || { avail: 0, total: 0 };
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            playClick();
                            setAssembledType(cat);
                          }}
                          className={`px-2 py-1.5 text-xs rounded-lg border text-left transition-all btn-tactile ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-200 font-bold shadow-sm'
                              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-zinc-100'
                          }`}
                        >
                          <div className="truncate">{cat}</div>
                          <div
                            className={`text-[10px] font-mono flex items-center justify-between gap-1 ${
                              isSelected ? 'text-zinc-700' : 'text-zinc-500'
                            }`}
                          >
                            <span>{prefix}</span>
                            <span>
                              {stat.avail}/{stat.total}
                            </span>
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
                      className="flex-1 min-w-0 bg-transparent px-3 py-2.5 sm:py-2 text-sm font-mono font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />

                    {/* Integrated Increment / Decrement Stepper */}
                    <div className="flex items-center border-l border-zinc-700/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          const match = assembledPartNum.match(/\d+/);
                          const currentNum = match ? parseInt(match[0], 10) : 1;
                          setAssembledPartNum(String(Math.max(1, currentNum - 1)));
                        }}
                        className="px-3.5 sm:px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors font-mono font-semibold"
                        title="Previous part number"
                      >
                        -1
                      </button>
                      <div className="w-[1px] h-4 bg-zinc-700/60" />
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          const match = assembledPartNum.match(/\d+/);
                          const currentNum = match ? parseInt(match[0], 10) : 0;
                          setAssembledPartNum(String(currentNum + 1));
                        }}
                        className="px-3.5 sm:px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors font-mono font-semibold"
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
                        const parsedInput = parseInt(assembledPartNum.replace(/\D+/g, ''), 10);
                        const parsedNumStr = parseInt(numStr.replace(/\D+/g, ''), 10);
                        const isCurrent =
                          assembledPartNum === numStr ||
                          (!isNaN(parsedInput) && !isNaN(parsedNumStr) && parsedInput === parsedNumStr);
                        const isAvailable = item.status === 'Available';

                        return (
                          <button
                            key={item.itemId}
                            type="button"
                            onClick={() => {
                              playClick();
                              setAssembledPartNum(numStr);
                            }}
                            title={`${item.itemName} · ${item.status}${item.currentUser ? ` (Team ${item.currentUser})` : ''}`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 min-h-[34px] sm:min-h-0 text-xs font-mono rounded-lg border transition-all btn-tactile ${
                              isCurrent
                                ? 'bg-zinc-100 text-zinc-950 border-zinc-200 font-bold shadow-sm'
                                : isAvailable
                                ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-zinc-100'
                                : 'bg-zinc-900/60 text-amber-300 border-amber-900/50 hover:border-amber-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? 'bg-zinc-200' : 'bg-amber-400'
                              }`}
                            />
                            <span>{numStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Part Preview & VEX Spec Strip */}
                <div className="mt-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-2.5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono text-sm font-bold text-zinc-300 shrink-0">
                        #
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Selected Part ID
                        </div>
                        <div className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2 mt-0.5">
                          <span className="text-zinc-100">{effectiveItemId}</span>
                          {currentMatchedItem ? (
                            <span className="text-xs font-sans text-zinc-300 font-normal truncate max-w-[200px]">
                              · {currentMatchedItem.itemName}
                            </span>
                          ) : (
                            <span className="text-xs font-sans text-zinc-500 font-normal">
                              · Custom Part
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      {currentMatchedItem ? (
                        <div>
                          <div className="flex items-center sm:justify-end gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                currentMatchedItem.status === 'Available'
                                  ? 'bg-zinc-200'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span
                              className={`text-xs font-semibold ${
                                currentMatchedItem.status === 'Available'
                                  ? 'text-zinc-100'
                                  : 'text-amber-400'
                              }`}
                            >
                              {currentMatchedItem.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {currentMatchedItem.currentUser
                              ? `With Team ${currentMatchedItem.currentUser}`
                              : 'Ready in Storage'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">Not in list yet</span>
                      )}
                      {effectiveItemId && (
                        <button
                          type="button"
                          onClick={handleAddCurrentToQueue}
                          className="px-2.5 py-1 text-[11px] font-mono font-semibold text-zinc-200 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1 btn-tactile"
                          title="Queue multiple parts to check out or check in together"
                        >
                          <Plus className="w-3 h-3 text-red-400" />
                          <span>
                            {queuedItems.some((q) => q.itemId.toUpperCase() === effectiveItemId.toUpperCase())
                              ? 'Queued'
                              : 'Add to Batch'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Needs Repair Health Warning */}
                  {currentMatchedItem?.condition === 'Needs Repair' && (
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-rose-300 font-medium">
                      <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>
                        Flagged <strong>Needs Repair</strong> — test or inspect before competition use.
                      </span>
                    </div>
                  )}

                  {/* Smart Status-Mismatch Helper */}
                  {currentMatchedItem && action === 'Check Out' && currentMatchedItem.status === 'Checked Out' && (
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5">
                      <span className="text-amber-300 font-medium">
                        Already checked out{currentMatchedItem.currentUser ? ` to Team ${currentMatchedItem.currentUser}` : ''}.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setAction('Check In');
                        }}
                        className="px-2 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[10px] flex items-center gap-1 shrink-0 btn-tactile"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Switch to Check In</span>
                      </button>
                    </div>
                  )}
                  {currentMatchedItem && action === 'Check In' && currentMatchedItem.status === 'Available' && (
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] bg-zinc-800/40 border border-zinc-700/60 rounded-lg px-2.5 py-1.5">
                      <span className="text-zinc-300">
                        This part is already available in pit storage.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setAction('Check Out');
                        }}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[10px] flex items-center gap-1 shrink-0 btn-tactile"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Switch to Check Out</span>
                      </button>
                    </div>
                  )}

                  {/* VEX Part Spec Strip */}
                  {activeSpec && (
                    <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 font-mono">
                      <span className="text-zinc-300">
                        <span className="text-zinc-500">PN:</span> {activeSpec.officialPartNumber} ·{' '}
                        <span className="text-zinc-500">Port:</span> {activeSpec.interfaceProtocol}
                      </span>
                      <span className="text-amber-400/90 font-medium truncate">
                        {activeSpec.operatingRange}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Search Catalog mode */
              <div key="mode-search" className="space-y-2 animate-fade-in-up">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      if (selectedItemId) setSelectedItemId('');
                    }}
                    placeholder="Search by ID (e.g. SOL-001) or component name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-zinc-800 rounded-lg divide-y divide-zinc-800/60 bg-zinc-950">
                  {eligibleItems.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-zinc-500">
                      <p>No parts match &ldquo;{itemSearch}&rdquo;.</p>
                      {itemSearch && (
                        <button
                          type="button"
                          onClick={() => setItemSearch('')}
                          className="mt-2 text-[11px] text-red-400 hover:underline font-medium"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    eligibleItems.map((item) => (
                      <button
                        key={item.itemId}
                        type="button"
                        onClick={() => {
                          setSelectedItemId(item.itemId);
                          const safeCat = classifyVexCategory(item.category, item.itemName, item.itemId);
                          setAssembledType(safeCat === 'Sensors' ? 'Distance' : safeCat);
                          const num = item.itemId.match(/\d+$/);
                          if (num) setAssembledPartNum(num[0]);
                          if (item.currentUser) {
                            setTeam(item.currentUser);
                            const isClub = CLUB_TEAMS.includes(item.currentUser as any);
                            setIsCustomTeam(!isClub);
                            setCustomTeam(isClub ? '' : item.currentUser);
                          }
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
                              item.status === 'Available' ? 'text-zinc-200' : 'text-amber-400'
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
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Multi-Part Batch Queue Tray */}
            {queuedItems.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-red-500/35 space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-200 font-bold">
                    Batch Queue · {queuedItems.length} part{queuedItems.length === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQueuedItems([])}
                    className="text-zinc-400 hover:text-zinc-200 text-[10px]"
                  >
                    Clear Queue
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {queuedItems.map((q) => (
                    <span
                      key={q.itemId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100"
                    >
                      <span>{q.itemId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQueued(q.itemId)}
                        aria-label={`Remove ${q.itemId} from batch`}
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Team Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                2. {action === 'Check Out' ? 'Assign to Club Team' : 'Returning Team'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500">{CLUB_TEAMS.length} Club &amp; Event Teams</span>
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
                      playClick();
                      setTeam(t);
                      setIsCustomTeam(false);
                    }}
                    className={`py-2.5 sm:py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all btn-tactile ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-zinc-100'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsCustomTeam(true);
                }}
                className={`py-2.5 sm:py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all btn-tactile ${
                  isCustomTeam
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-100'
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
                placeholder="Enter custom team or builder identifier (e.g. 654M or Mentor)"
                className="mt-2 w-full px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
              />
            )}
          </div>

          {/* 3. Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                3. What&apos;s it for / Condition Notes
              </label>
              <span className="text-[11px] text-zinc-500">Optional</span>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Going on drivetrain, front intake, or returned working fine..."
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none font-sans"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {QUICK_NOTES.slice(0, 4).map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => {
                    playClick();
                    setNotes(quick);
                  }}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80 transition-colors btn-tactile"
                >
                  + {quick}
                </button>
              ))}
            </div>
            {action === 'Check In' && (
              <label className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={flagNeedsRepair}
                  onChange={(e) => {
                    playClick();
                    setFlagNeedsRepair(e.target.checked);
                  }}
                  className="rounded border-zinc-700 bg-zinc-900 accent-red-600 cursor-pointer"
                />
                <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Flag part as damaged / needs repair</span>
              </label>
            )}
          </div>

          {/* 4. Responsible Person Email (Required for regular members, optional for admins) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>4. Borrower / Student Email Address</span>
                {!isAdmin && <span className="text-rose-400">*</span>}
                {defaultEmail && email === defaultEmail && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                    Remembered
                  </span>
                )}
              </label>
              {isAdmin ? (
                <span className="text-[11px] text-amber-400 font-medium font-mono">
                  Optional (Admin)
                </span>
              ) : (
                <span className="text-[11px] text-rose-400/90 font-medium">Required</span>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                required={!isAdmin}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Optional in Admin mode — or enter borrower email'
                    : 'e.g. s123456@ltisdschools.net or student@school.org'
                }
                className="w-full px-3 pr-14 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  title="Switch borrower email"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  Clear
                </button>
              )}
            </div>
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
              {queuedItems.length > 0 ? (
                <>
                  Batch: <span className="text-zinc-100 font-semibold">{queuedItems.length} parts</span> &rarr;{' '}
                </>
              ) : (
                <>
                  Selected: <span className="text-zinc-100 font-semibold">{effectiveItemId}</span> &rarr;{' '}
                </>
              )}
              <span className="text-zinc-100 font-semibold">
                Team {isCustomTeam ? customTeam || 'Custom' : team}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors min-h-[44px] flex items-center justify-center btn-tactile"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-[2] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 min-h-[44px] ${
                  action === 'Check Out'
                    ? 'bg-red-600 hover:bg-red-700 text-white btn-crimson-glow'
                    : 'bg-zinc-100 hover:bg-white text-zinc-950 btn-tactile'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : queuedItems.length > 0 ? (
                  <span>
                    {action} {queuedItems.length} Part{queuedItems.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span>{action === 'Check Out' ? 'Check Out Part' : 'Check In Part'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
