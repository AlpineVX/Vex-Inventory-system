import React from 'react';
import { X, Download, QrCode, Image as ImageIcon, Sparkles, Check } from 'lucide-react';

interface ClubAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClubAssetsModal: React.FC<ClubAssetsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const assets = [
    {
      title: 'Transparent Club Logo',
      subtitle: 'Original emblem with background removed (PNG)',
      src: '/assets/aistudio/lt_logo_transparent.png',
      downloadName: 'lake_travis_robotics_logo_transparent.png',
      tag: 'Website Logo',
    },
    {
      title: 'QR Code Center Badge (Circle)',
      subtitle: 'Solid white badge with dark shield border for QR centers',
      src: '/lake_travis_qr_badge_round.png',
      downloadName: 'lake_travis_qr_badge_round.png',
      tag: 'QR Badge',
    },
    {
      title: 'QR Code Center Badge (Squircle)',
      subtitle: 'Rounded-corner solid badge optimized for custom QR codes',
      src: '/lake_travis_qr_badge_squircle.png',
      downloadName: 'lake_travis_qr_badge_squircle.png',
      tag: 'QR Badge',
    },
    {
      title: 'Ready-to-Use High-Res QR Code',
      subtitle: 'High contrast black & white QR code with embedded club crest',
      src: '/lake_travis_ready_to_use_qr_code.png',
      downloadName: 'lake_travis_robotics_qr_code.png',
      tag: 'Print Ready',
    },
    {
      title: 'Original Image as Sent',
      subtitle: 'Direct high-resolution original file',
      src: '/lake_travis_logo_original.png',
      downloadName: 'lake_travis_logo_original.png',
      tag: 'Original',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-none animate-fade-in font-sans">
      <div className="bg-white border border-slate-300 rounded-sm w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
              [CLUB_ASSETS]
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">Club Brand Assets &amp; QR Codes</h2>
              <p className="text-xs text-slate-500 font-mono">Download high-res emblems &amp; custom QR badges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-none">
                      [{asset.tag.toUpperCase()}]
                    </span>
                  </div>
                  <div className="w-full h-28 bg-slate-50 rounded-none flex items-center justify-center p-2 mb-3 border border-slate-200">
                    <img
                      src={asset.src}
                      alt={asset.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{asset.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{asset.subtitle}</p>
                </div>

                <a
                  href={asset.src}
                  download={asset.downloadName}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold rounded-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>[DOWNLOAD_PNG]</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end font-mono">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
