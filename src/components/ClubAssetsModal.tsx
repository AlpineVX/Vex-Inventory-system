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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Club Logos & QR Badges</h2>
              <p className="text-xs text-zinc-400">Download high-res transparent logos & custom QR badges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md">
                      {asset.tag}
                    </span>
                  </div>
                  <div className="w-full h-28 bg-zinc-900/50 rounded-lg flex items-center justify-center p-2 mb-3 border border-zinc-800/50">
                    <img
                      src={asset.src}
                      alt={asset.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-200">{asset.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{asset.subtitle}</p>
                </div>

                <a
                  href={asset.src}
                  download={asset.downloadName}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 text-xs font-medium rounded-lg transition-colors min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
