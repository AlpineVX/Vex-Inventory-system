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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-none animate-fade-in font-sans">
      <div className="bg-white border border-slate-300 rounded-sm shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
              [SECURITY_LOCK]
            </span>
            <h2 className="text-sm font-bold text-slate-900">Admin Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Method */}
        <div className="p-5 pb-0">
          <p className="text-xs text-slate-500 mb-3 font-sans">
            Admin access is required to modify spreadsheet API connections, reset database records, or manage system settings.
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-sm border border-slate-200 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMethod('pin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm font-bold transition-colors ${
                method === 'pin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>[PIN]</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm font-bold transition-colors ${
                method === 'email'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>[EMAIL]</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="p-5 space-y-4">
          {method === 'pin' ? (
            <div>
              <label className="block text-xs font-bold font-mono text-slate-800 mb-1.5">
                ENTER ADMIN PIN
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter security PIN"
                className="w-full px-3 py-2 text-center text-sm tracking-widest font-mono bg-slate-50 border border-slate-300 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600"
              />
              <span className="block text-[11px] text-slate-500 mt-1 text-center font-mono">
                Security PIN set by team mentor or lead
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold font-mono text-slate-800 mb-1.5">
                AUTHORIZED ADMIN EMAIL
              </label>
              <input
                type="email"
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="coach@school.edu or admin email"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600"
              />
              <span className="block text-[11px] text-slate-500 mt-1 font-mono">
                Must match an authorized coach/lead email
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-sm transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors"
            >
              [UNLOCK_PRIVILEGES]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
