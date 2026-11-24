import React, { useState } from 'react';
import { X, Lock, KeyRound, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AdminSettings } from '../types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter font-sans">
      <div className="bg-[#111114] border border-[#27272d] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-modal-enter">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
              SECURITY LOCK
            </span>
            <h2 className="text-sm font-bold text-zinc-100">Admin Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Method */}
        <div className="p-5 pb-0">
          <p className="text-xs text-zinc-400 mb-3 font-sans">
            Admin access is required to modify spreadsheet API connections, reset database records, or manage system settings.
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#09090b] rounded-lg border border-[#27272d] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMethod('pin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors ${
                method === 'pin'
                  ? 'bg-[#1a1a1f] text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors ${
                method === 'email'
                  ? 'bg-[#1a1a1f] text-zinc-100 shadow-sm'
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
            <div>
              <label className="block text-xs font-bold font-mono text-zinc-300 mb-1.5">
                ENTER ADMIN PIN
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter security PIN"
                className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <span className="block text-[11px] text-zinc-500 mt-1 text-center font-mono">
                Security PIN set by team mentor or lead
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold font-mono text-zinc-300 mb-1.5">
                AUTHORIZED ADMIN EMAIL
              </label>
              <input
                type="email"
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="coach@school.edu or admin email"
                className="w-full px-3 py-2 text-xs font-mono bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <span className="block text-[11px] text-zinc-500 mt-1 font-mono">
                Must match an authorized coach/lead email
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
