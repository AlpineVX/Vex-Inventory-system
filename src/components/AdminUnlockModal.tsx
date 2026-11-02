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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161f] border border-[#1e242c] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0e1218] border-b border-[#1e242c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
              SECURITY LOCK
            </span>
            <h2 className="text-sm font-bold text-white">Admin Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Method */}
        <div className="p-5 pb-0">
          <p className="text-xs text-zinc-400 mb-3 font-sans">
            Admin access is required to modify spreadsheet API connections, reset database records, or manage system settings.
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0b0d11] rounded-lg border border-[#1e242c] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMethod('pin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-colors ${
                method === 'pin'
                  ? 'bg-[#222834] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
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
                  ? 'bg-[#222834] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>EMAIL</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="p-5 space-y-4">
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
                className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono bg-[#0b0d11] border border-[#1e242c] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
                className="w-full px-3 py-2 text-xs font-mono bg-[#0b0d11] border border-[#1e242c] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
              className="px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-[#161a22] border border-[#1e242c] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
            >
              Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
