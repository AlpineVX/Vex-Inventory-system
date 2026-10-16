import React, { useState } from 'react';
import {
  X,
  Link,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import { SyncStatus } from '../types';
import { APPS_SCRIPT_SOURCE } from '../services/sheetApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onSaveUrl: (url: string) => Promise<void>;
  onResetFactoryData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onSaveUrl,
  onResetFactoryData,
}) => {
  const [urlInput, setUrlInput] = useState(syncStatus.url);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'instructions' | 'code'>('url');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      await onSaveUrl(urlInput.trim());
      setTestResult({
        success: true,
        message: 'Successfully connected and synced with Google Apps Script Web App!',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed. Verify your Web App deployment settings.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Google Sheet Live Integration</h2>
            <span className="text-xs text-zinc-400">· Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-zinc-800 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 transition-colors ${
              activeTab === 'url'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Endpoint Connection
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 transition-colors ${
              activeTab === 'instructions'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Step-by-Step Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 transition-colors ${
              activeTab === 'code'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Apps Script Backend Code
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                    Google Apps Script Web App URL
                  </label>
                  <p className="text-xs text-zinc-400 mb-2">
                    Paste the Web App URL generated from <span className="text-zinc-300">Deploy &gt; New deployment &gt; Web app</span> in your Google Sheet.
                  </p>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        syncStatus.url ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-zinc-400">
                      Current State:{' '}
                      <strong className="text-zinc-200">
                        {syncStatus.url ? 'Live Linked to Sheet' : 'Using Local Fallback (279 Items)'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {urlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput('');
                          onSaveUrl('');
                        }}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-md transition-colors"
                      >
                        Disconnect URL
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isTesting || !urlInput.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-md transition-colors shadow-sm"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing & Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5" />
                          <span>Connect & Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</div>
                    <p className="mt-0.5 text-xs opacity-90">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Factory Reset Section */}
              <div className="pt-4 mt-6 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Reset Demo Data</div>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Restore the exact 279-item benchmark inventory (239 Available, 40 Checked Out to 654V, 654T, 654B).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetFactoryData();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Inventory</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="font-bold text-white">3-Minute Setup Overview:</span>
                <ol className="list-decimal list-inside space-y-2.5 mt-2.5 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Upload to Google Sheets:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      In Google Drive, click <span className="text-zinc-200">+ New &gt; File upload</span> and select your inventory spreadsheet. Open it and select <span className="text-zinc-200">File &gt; Save as Google Sheets</span>.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-200">Add the Google Apps Script:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      In your Google Sheet, click <span className="text-zinc-200">Extensions &gt; Apps Script</span> in the top menu. Delete any existing code in <code className="text-indigo-300 bg-zinc-900 px-1 py-0.5 rounded">Code.gs</code>, paste the code from the <em>Apps Script Backend Code</em> tab, and click the Save floppy disk icon.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-200">Deploy as Web App API:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      Click <span className="text-zinc-200">Deploy &gt; New deployment</span>. Next to Select type, click the gear icon and pick <span className="text-zinc-200">Web app</span>.<br />
                      Set <strong>Execute as:</strong> <code className="text-zinc-200">Me</code>.<br />
                      Set <strong>Who has access:</strong> <code className="text-emerald-400 font-semibold">Anyone</code>.<br />
                      Click <strong>Deploy</strong>, grant Google account access, and copy the Web App URL.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-200">Connect Web App to Website:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      Paste the copied Web App URL into the <em>API Endpoint Connection</em> field in this modal and click <strong>Connect &amp; Sync</strong>!
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">Google Apps Script Source Code (`Code.gs`)</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Apps Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-80 leading-relaxed">
                  {APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 bg-zinc-950/60">
          <span>Settings persist automatically in your browser's localStorage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
