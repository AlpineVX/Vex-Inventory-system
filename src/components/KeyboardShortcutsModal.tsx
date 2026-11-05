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
      category: 'Navigation & Views',
      items: [
        { keys: ['1'], description: 'Jump to Command Center Dashboard' },
        { keys: ['2'], description: 'Jump to Master Inventory Catalog' },
        { keys: ['3'], description: 'Jump to Team Hardware Lookup' },
        { keys: ['4'], description: 'Jump to Competition Pack List' },
        { keys: ['5'], description: 'Jump to Audit & Activity Logs' },
      ],
    },
    {
      category: 'Search & Rapid Actions',
      items: [
        { keys: ['/'], description: 'Focus instant inventory catalog search' },
        { keys: ['C'], description: 'Open Hardware Check Out / Check In Station' },
        { keys: ['P'], description: 'Print official hardware manifest sheet (Ctrl+P)' },
        { keys: ['Esc'], description: 'Close any active dialog, modal or drawer' },
        { keys: ['?'], description: 'Toggle this keyboard shortcuts cheatsheet' },
      ],
    },
    {
      category: 'Kiosk & Sound Ergonomics',
      items: [
        { keys: ['M'], description: 'Toggle industrial tactile Web Audio feedback' },
        { keys: ['D'], description: 'Open System Telemetry & Diagnostics Inspector' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12161f] border border-[#232b38] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0e1218] border-b border-[#1e242c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Keyboard Shortcuts &amp; Ergonomics
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Power-user hotkeys for competition pit operations
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#1a202c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.category} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 font-mono">
                {section.category}
              </span>
              <div className="rounded-xl border border-[#1e242c] bg-[#0b0d11] divide-y divide-[#1e242c]/60 overflow-hidden">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-[#161a22]/50 transition-colors"
                  >
                    <span className="text-zinc-300">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 rounded bg-[#1e242c] border border-zinc-700 text-zinc-200 font-mono text-[11px] font-bold shadow-sm"
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

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-zinc-400 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-[#1e242c] rounded border border-zinc-700 text-zinc-200">?</kbd> anywhere in the app to open this guide.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0e1218] border-t border-[#1e242c] flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-200 bg-[#161a22] hover:bg-[#21262d] border border-[#1e242c] rounded-lg transition-colors font-mono"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
