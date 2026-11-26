import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-3 right-3 sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 sm:max-w-md sm:w-full pointer-events-none font-sans">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl transition-all duration-200 bg-[#111114]/95 backdrop-blur-md animate-toast-in ${
            toast.type === 'success'
              ? 'border-zinc-400/40 text-zinc-100'
              : toast.type === 'error'
              ? 'border-rose-500/40 text-zinc-100'
              : 'border-[#27272d] text-zinc-100'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-zinc-100 animate-pop" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 animate-pop" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-red-400 animate-pop" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-100 leading-tight font-mono">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="px-2.5 py-1 text-[11px] font-mono font-bold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors flex items-center gap-1 btn-tactile"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{toast.actionLabel}</span>
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-zinc-100 p-1 rounded-lg transition-colors btn-tactile"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* GPU-composited auto-dismiss countdown progress bar */}
          <div
            aria-hidden="true"
            className={`absolute bottom-0 left-0 right-0 h-[2px] animate-toast-progress ${
              toast.type === 'success'
                ? 'bg-zinc-200/80'
                : toast.type === 'error'
                ? 'bg-rose-500/80'
                : 'bg-red-500/80'
            }`}
          />
        </div>
      ))}
    </div>
  );
};
