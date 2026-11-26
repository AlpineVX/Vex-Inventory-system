import React, { useState, useEffect } from 'react';
import { X, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { AdminSettings } from '../types';
import { useSlidingIndicator } from './MotionPrimitives';
import { playClick } from '../services/soundFx';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  onUnlockSuccess: () => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  onUnlockSuccess,
}) => {
  const [method, setMethod] = useState<'pin' | 'email'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { containerRef: methodBarRef, setItemRef: setMethodRef, indicator: methodIndicator } =
    useSlidingIndicator<'pin' | 'email'>(method, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPinInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === 'pin') {
      const cleanPin = pinInput.trim();
      if (cleanPin === adminSettings.adminPin) {
        onUnlockSuccess();
        onClose();
        setPinInput('');
      } else {
        setError('Incorrect Admin PIN.');
      }
    } else {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail) {
        setError('Please enter an admin email address.');
        return;
      }
      const match = adminSettings.adminEmails.some(
        (adminEmail) => adminEmail.toLowerCase() === cleanEmail
      );
      if (match) {
        onUnlockSuccess();
        onClose();
        setEmailInput('');
      } else {
        setError('Email address not found in authorized admin list.');
      }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter font-sans"
    >
      <div className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-xl shadow-2xl max-w-sm w-full overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-modal-enter">
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
              ADMIN
            </span>
            <h2 className="text-sm font-bold text-zinc-100">Admin Sign In</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Method */}
        <div className="p-5 pb-0">
          <p className="text-xs text-zinc-400 mb-3 font-sans">
            Sign in as an admin to edit Google Sheet links, reset the parts list, or change club settings.
          </p>

          <div
            ref={methodBarRef}
            className="relative grid grid-cols-2 gap-1 p-1 bg-[#09090b] rounded-lg border border-[#27272d] text-xs font-mono"
          >
            {methodIndicator.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${methodIndicator.left}px, ${methodIndicator.top}px, 0)`,
                  width: `${methodIndicator.width}px`,
                  height: `${methodIndicator.height}px`,
                }}
                className="absolute top-0 left-0 rounded-md bg-[#1a1a1f] border border-red-500/40 shadow-sm pointer-events-none transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
              />
            )}
            <button
              ref={setMethodRef('pin')}
              type="button"
              onClick={() => {
                playClick();
                setMethod('pin');
                setError(null);
              }}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors ${
                method === 'pin'
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN</span>
            </button>
            <button
              ref={setMethodRef('email')}
              type="button"
              onClick={() => {
                playClick();
                setMethod('email');
                setError(null);
              }}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors ${
                method === 'email'
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>EMAIL</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} noValidate className="p-5 space-y-4">
          {method === 'pin' ? (
            <div key="auth-pin" className="animate-fade-in-up">
              <label className="block text-xs font-bold font-mono text-zinc-300 mb-1.5">
                ENTER ADMIN PIN
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter security PIN"
                className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow"
              />
              <span className="block text-[11px] text-zinc-500 mt-1 text-center font-mono">
                Ask a team lead or mentor for the PIN
              </span>
            </div>
          ) : (
            <div key="auth-email" className="animate-fade-in-up">
              <label className="block text-xs font-bold font-mono text-zinc-300 mb-1.5">
                AUTHORIZED ADMIN EMAIL
              </label>
              <input
                type="email"
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="coach@school.edu or admin email"
                className="w-full px-3 py-2 text-xs font-mono bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow"
              />
              <span className="block text-[11px] text-zinc-500 mt-1 font-mono">
                Must match an authorized coach/lead email
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono animate-pop">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[42px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-xl sm:rounded-lg transition-colors btn-tactile"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] sm:flex-initial min-h-[42px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl sm:rounded-lg transition-colors shadow-sm btn-crimson-glow"
            >
              Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
