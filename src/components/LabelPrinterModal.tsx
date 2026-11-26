import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, QrCode, Check, Search } from 'lucide-react';
import { InventoryItem, VexCategory, SENSOR_CATEGORIES } from '../types';
import { playClick, playBeep } from '../services/soundFx';

interface LabelPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  initialCategory?: VexCategory | 'All';
}

const CATEGORIES: (VexCategory | 'All')[] = [
  'All',
  'Brain',
  'Radio',
  'Sensors',
  'Optical',
  'Distance',
  'Inertial',
  'Rotational',
  'Solenoids',
];

export const LabelPrinterModal: React.FC<LabelPrinterModalProps> = ({
  isOpen,
  onClose,
  items,
  initialCategory = 'Brain',
}) => {
  const [category, setCategory] = useState<VexCategory | 'All'>(initialCategory);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [labelColumns, setLabelColumns] = useState<3 | 4>(3);

  const visibleItems = useMemo(() => {
    let pool = items;
    if (category !== 'All') {
      if (category === 'Sensors') {
        pool = pool.filter((i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors');
      } else {
        pool = pool.filter((i) => i.category === category);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      pool = pool.filter(
        (i) =>
          i.itemId.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          (i.location || '').toLowerCase().includes(q)
      );
    }
    return pool;
  }, [items, category, search]);

  const prevOpenRef = useRef(false);

  // Pre-select first 12 visible parts only when the modal transitions from closed to open
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (!justOpened) return;

    const startCat = initialCategory === 'All' ? 'Brain' : initialCategory;
    setCategory(startCat);
    setSearch('');

    const pool =
      startCat === 'Sensors'
        ? items.filter((i) => SENSOR_CATEGORIES.includes(i.category) || i.category === 'Sensors')
        : items.filter((i) => i.category === startCat);
    setSelectedIds(new Set(pool.slice(0, 12).map((i) => i.itemId)));
  }, [isOpen, initialCategory, items]);

  const labelsToPrint = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.itemId));
  }, [items, selectedIds]);

  // Generate QR data URLs locally for the active label set
  useEffect(() => {
    if (!isOpen || labelsToPrint.length === 0) return;
    let cancelled = false;

    const generateAll = async () => {
      const nextEntries: Record<string, string> = {};
      await Promise.all(
        labelsToPrint.slice(0, 48).map(async (item) => {
          if (qrMap[item.itemId]) return;
          try {
            const payload = `VEX654:${item.itemId}`;
            const dataUrl = await QRCode.toDataURL(payload, {
              width: 140,
              margin: 1,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#09090b',
                light: '#ffffff',
              },
            });
            nextEntries[item.itemId] = dataUrl;
          } catch {}
        })
      );

      if (!cancelled && Object.keys(nextEntries).length > 0) {
        setQrMap((prev) => ({ ...prev, ...nextEntries }));
      }
    };

    generateAll();
    return () => {
      cancelled = true;
    };
  }, [isOpen, labelsToPrint, qrMap]);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    playClick();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrintLabels = () => {
    playBeep();
    document.body.classList.add('printing-labels');

    const cleanup = () => {
      document.body.classList.remove('printing-labels');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    requestAnimationFrame(() => {
      window.print();
      setTimeout(cleanup, 1500);
    });
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            playClick();
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter font-sans no-print"
      >
        <div className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] pb-[env(safe-area-inset-bottom,0px)] animate-modal-enter">
          {/* Mobile grab handle */}
          <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 py-3.5 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-zinc-100 truncate">
                  Printable Bin &amp; QR Labels
                </h2>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  Select parts and print sticker sheets for pit bins &amp; hardware
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-[#27272d] bg-[#09090b]/60 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      playClick();
                      setCategory(cat);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg border whitespace-nowrap shrink-0 transition-colors ${
                      category === cat
                        ? 'bg-[#1a1a1f] text-zinc-100 border-red-500/45 font-semibold'
                        : 'bg-[#111114] text-zinc-400 border-[#27272d] hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-zinc-400">Grid:</span>
                <button
                  type="button"
                  onClick={() => setLabelColumns(3)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                    labelColumns === 3
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                      : 'bg-[#111114] text-zinc-400 border-[#27272d]'
                  }`}
                >
                  3 Col
                </button>
                <button
                  type="button"
                  onClick={() => setLabelColumns(4)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                    labelColumns === 4
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                      : 'bg-[#111114] text-zinc-400 border-[#27272d]'
                  }`}
                >
                  4 Col
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter parts to print..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedIds(new Set(visibleItems.slice(0, 36).map((i) => i.itemId)));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1a1a1f] hover:bg-[#27272d] text-zinc-200 border border-[#27272d]"
                >
                  Select Visible (up to 36)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedIds(new Set());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1a1a1f] hover:bg-[#27272d] text-zinc-400 border border-[#27272d]"
                >
                  Clear ({selectedIds.size})
                </button>
              </div>
            </div>

            {/* Part Toggle Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {visibleItems.map((item, idx) => {
                const isPicked = selectedIds.has(item.itemId);
                return (
                  <button
                    key={`${item.itemId}-${idx}`}
                    type="button"
                    onClick={() => toggleId(item.itemId)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded-lg border transition-colors ${
                      isPicked
                        ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                        : 'bg-[#111114] text-zinc-400 border-[#27272d] hover:text-zinc-200'
                    }`}
                  >
                    {isPicked && <Check className="w-3 h-3" />}
                    <span>{item.itemId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Label Sheet Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#09090b]">
            {labelsToPrint.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                Select one or more parts above to preview printable QR bin labels.
              </div>
            ) : (
              <div
                className={`grid gap-3 ${
                  labelColumns === 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {labelsToPrint.slice(0, 48).map((item) => (
                  <div
                    key={item.itemId}
                    className="bg-white text-zinc-950 rounded-lg p-2.5 border border-zinc-300 flex items-center gap-2.5 shadow-sm"
                  >
                    {qrMap[item.itemId] ? (
                      <img
                        src={qrMap[item.itemId]}
                        alt={`QR for ${item.itemId}`}
                        className="w-14 h-14 shrink-0 border border-zinc-200 rounded"
                      />
                    ) : (
                      <div className="w-14 h-14 shrink-0 bg-zinc-100 rounded border border-zinc-200 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                        QR
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-red-700 font-bold">
                        TEAM 654 · {item.category}
                      </div>
                      <div className="text-sm font-mono font-bold text-zinc-950 truncate">
                        {item.itemId}
                      </div>
                      <div className="text-[10px] text-zinc-700 font-medium line-clamp-1">
                        {item.itemName}
                      </div>
                      {item.location && (
                        <div className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">
                          Bin: {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-[#09090b] border-t border-[#27272d] flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-zinc-400">
              {labelsToPrint.length} label{labelsToPrint.length === 1 ? '' : 's'} ready to print
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-300 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={labelsToPrint.length === 0}
                onClick={handlePrintLabels}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl shadow-sm btn-crimson-glow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Hidden Print-Only Label Sheet */}
      <div id="qr-label-print-sheet" className="hidden">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${labelColumns}, minmax(0, 1fr))`,
            gap: '8px',
            padding: '12px',
          }}
        >
          {labelsToPrint.slice(0, 48).map((item) => (
            <div
              key={item.itemId}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                breakInside: 'avoid',
                backgroundColor: '#ffffff',
                color: '#09090b',
              }}
            >
              {qrMap[item.itemId] && (
                <img
                  src={qrMap[item.itemId]}
                  alt={item.itemId}
                  style={{ width: '58px', height: '58px', flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#c52329', textTransform: 'uppercase' }}>
                  TEAM 654 · {item.category}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {item.itemId}
                </div>
                <div style={{ fontSize: '9px', color: '#3f3f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.itemName}
                </div>
                {item.location && (
                  <div style={{ fontSize: '8px', color: '#71717a', marginTop: '2px' }}>
                    {item.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
