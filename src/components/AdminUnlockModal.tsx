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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-white">Admin Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Method */}
        <div className="p-5 pb-0">
          <p className="text-xs text-zinc-400 mb-3">
            Admin access is required to modify spreadsheet API connections, reset database records, or manage system settings.
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMethod('pin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
                method === 'pin'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
                method === 'email'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Admin Email</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="p-5 space-y-4">
          {method === 'pin' ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Enter Admin PIN
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter security PIN"
                className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
              />
              <span className="block text-[11px] text-zinc-500 mt-1 text-center">
                Enter the security PIN set by your team mentor or lead
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Authorized Admin Email
              </label>
              <input
                type="email"
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="coach@school.edu or admin email"
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
              />
              <span className="block text-[11px] text-zinc-500 mt-1">
                Must match an authorized coach/lead admin email
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-colors shadow-sm"
            >
              Unlock Admin Privileges
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
