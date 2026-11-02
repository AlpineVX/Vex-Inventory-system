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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161f] border border-[#1e242c] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#0e1218] border-b border-[#1e242c]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
              Brand Assets
            </span>
            <div>
              <h2 className="text-sm font-bold text-white font-sans">Club Brand Assets &amp; QR Badges</h2>
              <p className="text-xs text-zinc-400 font-mono">Download high-res emblems &amp; custom QR badges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
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
                className="bg-[#0b0d11] border border-[#1e242c] rounded-xl p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#161a22] text-zinc-300 border border-[#1e242c] rounded-full">
                      {asset.tag.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full h-28 bg-[#12161f] rounded-lg flex items-center justify-center p-2 mb-3 border border-[#1e242c]">
                    <img
                      src={asset.src}
                      alt={asset.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-white">{asset.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{asset.subtitle}</p>
                </div>

                <a
                  href={asset.src}
                  download={asset.downloadName}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1e242c] bg-[#0e1218] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a202c] hover:bg-[#222834] border border-[#1e242c] text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
