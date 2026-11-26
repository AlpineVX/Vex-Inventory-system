import React from 'react';
import { X, Command, Keyboard, Search, ArrowRight, CornerDownLeft } from 'lucide-react';
import { playClick } from '../services/soundFx';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    playClick();
    onClose();
  };

  const SHORTCUTS = [
    {
      category: 'Pages',
      items: [
        { keys: ['1'], description: 'Go to Overview' },
        { keys: ['2'], description: 'Go to Full Parts Inventory' },
        { keys: ['3'], description: 'Go to Team Parts' },
        { keys: ['4'], description: 'Go to Competition Pack List' },
        { keys: ['5'], description: 'Go to Activity Log' },
      ],
    },
    {
      category: 'Quick Actions',
      items: [
        { keys: ['/', '⌘K'], description: 'Jump to search bar' },
        { keys: ['C'], description: 'Open Check Out / Check In' },
        { keys: ['P'], description: 'Print current inventory sheet (Ctrl+P)' },
        { keys: ['Esc'], description: 'Close open window or popup' },
        { keys: ['?'], description: 'Show or hide this shortcuts list' },
      ],
    },
    {
      category: 'Sound & Status',
      items: [
        { keys: ['M'], description: 'Turn sound effects on or off' },
        { keys: ['D'], description: 'Open App Status & Cache info' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter">
      <div className="bg-[#111114] border border-[#27272d] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter">
        {/* Header */}
        <div className="px-5 py-4 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-wide">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Quick keys for getting around the app
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-[#1a1a1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {SHORTCUTS.map((section, sIdx) => (
            <div
              key={section.category}
              style={{ '--row-idx': sIdx * 2 } as React.CSSProperties}
              className="space-y-2 animate-row-enter"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/90 font-mono">
                {section.category}
              </span>
              <div className="rounded-xl border border-[#27272d] bg-[#09090b] divide-y divide-[#27272d]/60 overflow-hidden">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-[#1a1a1f]/50 transition-colors group"
                  >
                    <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 rounded bg-[#1a1a1f] border border-zinc-700 text-zinc-200 font-mono text-[11px] font-bold shadow-sm group-hover:border-red-500/40 transition-colors"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[11px] text-zinc-400 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 radar-dot" />
            <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-[#1a1a1f] rounded border border-zinc-700 text-zinc-200">?</kbd> anywhere in the app to open this guide.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#09090b] border-t border-[#27272d] flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors font-mono btn-tactile"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
