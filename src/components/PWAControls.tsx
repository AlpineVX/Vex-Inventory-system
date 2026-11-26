import React, { useState } from 'react';
import { Download, Share, X, WifiOff, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { playClick } from '../services/soundFx';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallGuideModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
      <div className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-2xl max-w-sm w-full overflow-hidden pb-[env(safe-area-inset-bottom,0px)] shadow-2xl animate-modal-enter">
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />
        <div className="px-5 py-3.5 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold text-zinc-100">Install on iPhone / iPad</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p className="text-zinc-400">
            Install VEX 654 Inventory to your home screen for quick pit access even when venue Wi-Fi drops:
          </p>
          <ol className="space-y-2 list-decimal list-inside text-zinc-200">
            <li>
              Tap the <strong className="inline-flex items-center gap-1 text-white"><Share className="w-3.5 h-3.5 inline text-red-400" /> Share</strong> button in Safari.
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong> in the top-right corner.
            </li>
          </ol>
        </div>
        <div className="px-5 py-3 bg-[#09090b] border-t border-[#27272d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

interface OfflineQueueBannerProps {
  pendingCount: number;
  onRetrySync: () => void;
}

export const OfflineQueueBanner: React.FC<OfflineQueueBannerProps> = ({
  pendingCount,
  onRetrySync,
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-3 sm:left-4 z-40 flex items-center gap-2.5 rounded-xl bg-[#111114]/95 backdrop-blur-md border border-amber-500/40 px-3 py-2 text-xs text-zinc-100 shadow-2xl animate-fade-in-up">
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <div className="font-mono text-[11px]">
        {!isOnline ? (
          <span>
            Offline Mode{pendingCount > 0 ? ` · ${pendingCount} queued` : ' · Using cached list'}
          </span>
        ) : (
          <span>{pendingCount} pending check-out{pendingCount === 1 ? '' : 's'} ready to sync</span>
        )}
      </div>
      {isOnline && pendingCount > 0 && (
        <button
          type="button"
          onClick={() => {
            playClick();
            onRetrySync();
          }}
          className="px-2 py-1 text-[10px] font-mono font-bold bg-zinc-100 hover:bg-white text-zinc-950 rounded-md flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync</span>
        </button>
      )}
    </div>
  );
};

export function usePWAInstallTrigger() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const canShowInstall = !isInstalled && (isInstallable || isIOS);

  const triggerInstall = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return {
    canShowInstall,
    isInstalled,
    triggerInstall,
    showIOSGuide,
    closeIOSGuide: () => setShowIOSGuide(false),
  };
}
