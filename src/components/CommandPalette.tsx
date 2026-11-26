import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  LayoutDashboard,
  Boxes,
  CheckSquare,
  FileText,
  Printer,
  QrCode,
  Volume2,
  VolumeX,
  RefreshCw,
  Keyboard,
  Activity,
  Download,
  Wrench,
  CornerDownLeft,
} from 'lucide-react';
import { ActiveTab, CLUB_TEAMS, InventoryItem } from '../types';
import { playClick } from '../services/soundFx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onNavigateToTeam: (team: string) => void;
  onOpenCheckout: (item?: InventoryItem, action?: 'Check Out' | 'Check In', presetTeam?: string) => void;
  onSyncNow: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onOpenShortcuts: () => void;
  onOpenDiagnostics: () => void;
  onOpenAssetsModal: () => void;
  onOpenLabelPrinter: () => void;
  onInstallApp?: () => void;
  canInstallApp?: boolean;
}

interface PaletteEntry {
  id: string;
  group: 'Actions' | 'Pages' | 'Club Teams' | 'Parts';
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: 'amber' | 'red' | 'neutral';
  keywords: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  onNavigateTab,
  onNavigateToTeam,
  onOpenCheckout,
  onSyncNow,
  onToggleSound,
  soundEnabled,
  onOpenShortcuts,
  onOpenDiagnostics,
  onOpenAssetsModal,
  onOpenLabelPrinter,
  onInstallApp,
  canInstallApp = false,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const allEntries = useMemo<PaletteEntry[]>(() => {
    const actions: PaletteEntry[] = [
      {
        id: 'act-checkout',
        group: 'Actions',
        title: 'Check Out / Check In Part',
        subtitle: 'Open fast checkout modal or batch queue',
        badge: 'C',
        badgeTone: 'red',
        keywords: 'checkout check out in return borrow batch queue',
        icon: <ArrowUpRight className="w-4 h-4 text-red-400" />,
        onSelect: () => onOpenCheckout(undefined, 'Check Out'),
      },
      {
        id: 'act-labels',
        group: 'Actions',
        title: 'Print QR Bin Labels',
        subtitle: 'Generate printable Avery / Pelican bin QR stickers',
        badgeTone: 'neutral',
        keywords: 'qr print labels bin stickers avery',
        icon: <QrCode className="w-4 h-4 text-red-400" />,
        onSelect: () => onOpenLabelPrinter(),
      },
      {
        id: 'act-sync',
        group: 'Actions',
        title: 'Sync Google Sheet Now',
        subtitle: 'Refresh live spreadsheet parts & activity logs',
        keywords: 'sync refresh google sheet update live',
        icon: <RefreshCw className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onSyncNow(),
      },
      {
        id: 'act-print',
        group: 'Actions',
        title: 'Print Current Sheet',
        subtitle: 'Open browser print layout for active tab',
        badge: 'P',
        keywords: 'print sheet pdf tournament travel manifest',
        icon: <Printer className="w-4 h-4 text-zinc-300" />,
        onSelect: () => window.print(),
      },
      {
        id: 'act-sound',
        group: 'Actions',
        title: soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects',
        subtitle: 'Toggle UI clicks and confirmation chimes',
        badge: 'M',
        keywords: 'sound audio mute unmute volume',
        icon: soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />,
        onSelect: () => onToggleSound(),
      },
      {
        id: 'act-assets',
        group: 'Actions',
        title: 'Download Club Logos & QR Badges',
        subtitle: 'Lake Travis VEX Robotics transparent PNGs',
        keywords: 'logo download club files badge png',
        icon: <Download className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onOpenAssetsModal(),
      },
      {
        id: 'act-status',
        group: 'Actions',
        title: 'App Status & Cache',
        subtitle: 'Check connection ping, storage quota, and JSON export',
        badge: 'D',
        keywords: 'status cache storage ping diagnostics json',
        icon: <Activity className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onOpenDiagnostics(),
      },
      {
        id: 'act-shortcuts',
        group: 'Actions',
        title: 'Keyboard Shortcuts',
        subtitle: 'View quick single-key navigation shortcuts',
        badge: '?',
        keywords: 'keyboard shortcuts keys help guide',
        icon: <Keyboard className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onOpenShortcuts(),
      },
    ];

    if (canInstallApp && onInstallApp) {
      actions.splice(2, 0, {
        id: 'act-install',
        group: 'Actions',
        title: 'Install VEX 654 App',
        subtitle: 'Add to Home Screen / Desktop for offline pit access',
        badgeTone: 'red',
        keywords: 'install pwa app home screen offline tablet phone',
        icon: <Download className="w-4 h-4 text-red-400" />,
        onSelect: () => onInstallApp(),
      });
    }

    const pages: PaletteEntry[] = [
      {
        id: 'page-dashboard',
        group: 'Pages',
        title: 'Dashboard',
        subtitle: 'Overview, cabinets, and repair flags',
        badge: '1',
        keywords: 'dashboard home overview summary cabinets',
        icon: <LayoutDashboard className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onNavigateTab('dashboard'),
      },
      {
        id: 'page-inventory',
        group: 'Pages',
        title: 'Full Parts Inventory',
        subtitle: `Search and filter all ${items.length} tracked parts`,
        badge: '2',
        keywords: 'inventory stock parts search table sensors brains',
        icon: <Boxes className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onNavigateTab('inventory'),
      },
      {
        id: 'page-teams',
        group: 'Pages',
        title: 'Team Parts Lookup',
        subtitle: 'Check which parts each 654 sub-team has out',
        badge: '3',
        keywords: 'teams lookup subteam pit box',
        icon: <Users className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onNavigateTab('teams'),
      },
      {
        id: 'page-packlist',
        group: 'Pages',
        title: 'Competition Pack List',
        subtitle: 'Tournament pit box spare checklist',
        badge: '4',
        keywords: 'pack list competition tournament spares pelican',
        icon: <CheckSquare className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onNavigateTab('packlist'),
      },
      {
        id: 'page-logs',
        group: 'Pages',
        title: 'Activity Log',
        subtitle: 'History of recent checkouts and returns',
        badge: '5',
        keywords: 'activity logs history audit recent',
        icon: <FileText className="w-4 h-4 text-zinc-300" />,
        onSelect: () => onNavigateTab('logs'),
      },
    ];

    const teamCounts: Record<string, number> = {};
    items.forEach((i) => {
      if (i.status === 'Checked Out' && i.currentUser) {
        teamCounts[i.currentUser] = (teamCounts[i.currentUser] || 0) + 1;
      }
    });

    const teams: PaletteEntry[] = CLUB_TEAMS.map((t) => {
      const count = teamCounts[t] || 0;
      return {
        id: `team-${t}`,
        group: 'Club Teams',
        title: `Team ${t}`,
        subtitle: count > 0 ? `${count} part${count === 1 ? '' : 's'} checked out` : 'No active checkouts',
        badge: count > 0 ? `${count} out` : '0 out',
        badgeTone: count > 0 ? 'amber' : 'neutral',
        keywords: `team ${t} roster parts`,
        icon: <Users className="w-4 h-4 text-zinc-400" />,
        onSelect: () => onNavigateToTeam(t),
      };
    });

    const parts: PaletteEntry[] = items.map((item) => {
      const isAvail = item.status === 'Available';
      const needsRepair = item.condition === 'Needs Repair';
      return {
        id: `part-${item.itemId}`,
        group: 'Parts',
        title: `${item.itemId} — ${item.itemName}`,
        subtitle: `${item.category}${item.location ? ` · ${item.location}` : ''}${
          item.currentUser ? ` · With Team ${item.currentUser}` : ''
        }`,
        badge: needsRepair ? 'Needs Repair' : isAvail ? 'Available' : 'Checked Out',
        badgeTone: needsRepair ? 'red' : isAvail ? 'neutral' : 'amber',
        keywords: `${item.itemId} ${item.itemName} ${item.category} ${item.currentUser || ''} ${item.notes || ''} ${item.location || ''}`,
        icon: needsRepair ? (
          <Wrench className="w-4 h-4 text-rose-400" />
        ) : isAvail ? (
          <ArrowUpRight className="w-4 h-4 text-zinc-200" />
        ) : (
          <ArrowDownLeft className="w-4 h-4 text-amber-400" />
        ),
        onSelect: () => onOpenCheckout(item, isAvail ? 'Check Out' : 'Check In'),
      };
    });

    return [...actions, ...pages, ...teams, ...parts];
  }, [
    items,
    soundEnabled,
    canInstallApp,
    onInstallApp,
    onOpenCheckout,
    onOpenLabelPrinter,
    onSyncNow,
    onToggleSound,
    onOpenAssetsModal,
    onOpenDiagnostics,
    onOpenShortcuts,
    onNavigateTab,
    onNavigateToTeam,
  ]);

  const filteredEntries = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show top quick actions, pages, and first few teams by default before searching
      return allEntries
        .filter((e) => e.group === 'Actions' || e.group === 'Pages')
        .slice(0, 12);
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const matches = allEntries.filter((entry) => {
      const haystack = `${entry.title} ${entry.subtitle} ${entry.keywords}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });

    // Prioritize exact ID prefix or title startsWith
    return matches
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 1 : 0;
        const bExact = b.title.toLowerCase().startsWith(q) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return 0;
      })
      .slice(0, 16);
  }, [allEntries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (filteredEntries.length === 0 ? 0 : (prev + 1) % filteredEntries.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredEntries.length === 0 ? 0 : (prev - 1 + filteredEntries.length) % filteredEntries.length
      );
    } else if (e.key === 'Enter' && filteredEntries[activeIndex]) {
      e.preventDefault();
      playClick();
      onClose();
      filteredEntries[activeIndex].onSelect();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-12 sm:pt-0 p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter font-sans"
    >
      <div
        role="dialog"
        aria-label="Command Palette"
        className="bg-[#111114] border border-[#27272d] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[82vh] animate-modal-enter"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#09090b] border-b border-[#27272d]">
          <Search className="w-4 h-4 text-red-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to part (VEXB-1), team (654V), or action..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-zinc-200 p-1 rounded"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#1a1a1f] border border-[#27272d] rounded">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredEntries.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <p className="text-xs font-semibold text-zinc-200">No matches for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-zinc-500">
                Try searching a part ID (e.g. VEXSOL-1), team (654K), or action name.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    playClick();
                    onClose();
                    entry.onSelect();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-[#1a1a1f] border border-red-500/40'
                      : 'border border-transparent hover:bg-[#1a1a1f]/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#09090b] border border-[#27272d] flex items-center justify-center shrink-0">
                      {entry.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100 truncate">
                        {entry.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {entry.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                      {entry.group}
                    </span>
                    {entry.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          entry.badgeTone === 'red'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : entry.badgeTone === 'amber'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-[#09090b] text-zinc-300 border-[#27272d]'
                        }`}
                      >
                        {entry.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-[#09090b] border-t border-[#27272d] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1f] border border-[#27272d] rounded text-zinc-300">↑↓</kbd>
              <span>Select</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-zinc-400" />
              <span>Run</span>
            </span>
          </div>
          <span>Team 654 Quick Command</span>
        </div>
      </div>
    </div>
  );
};
