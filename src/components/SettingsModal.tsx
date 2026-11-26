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
  ShieldCheck,
  KeyRound,
  UserPlus,
  Trash2,
  Lock,
} from 'lucide-react';
import { SyncStatus, AdminSettings } from '../types';
import { APPS_SCRIPT_SOURCE } from '../services/sheetApi';
import { useSlidingIndicator } from './MotionPrimitives';
import { playClick } from '../services/soundFx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onSaveUrl: (url: string) => Promise<void>;
  onResetFactoryData: () => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (settings: AdminSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onSaveUrl,
  onResetFactoryData,
  adminSettings,
  onUpdateAdminSettings,
}) => {
  const [urlInput, setUrlInput] = useState(syncStatus.url);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'instructions' | 'code' | 'security'>('url');

  // Admin configuration state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmailError, setAdminEmailError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState(adminSettings.adminPin);
  const [pinSavedNotice, setPinSavedNotice] = useState(false);

  const { containerRef: tabBarRef, setItemRef: setTabRef, indicator: tabIndicator } =
    useSlidingIndicator<'url' | 'instructions' | 'code' | 'security'>(activeTab, [isOpen]);

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

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminEmailError(null);
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setAdminEmailError('Please enter a valid email address.');
      return;
    }
    if (!adminSettings.adminEmails.some((em) => em.toLowerCase() === clean)) {
      onUpdateAdminSettings({
        ...adminSettings,
        adminEmails: [...adminSettings.adminEmails, clean],
      });
      setNewAdminEmail('');
    }
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    setAdminEmailError(null);
    if (adminSettings.adminEmails.length <= 1) {
      setAdminEmailError('You must keep at least one authorized admin email.');
      setTimeout(() => setAdminEmailError(null), 4000);
      return;
    }
    onUpdateAdminSettings({
      ...adminSettings,
      adminEmails: adminSettings.adminEmails.filter((em) => em !== emailToRemove),
    });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPin.trim();
    if (clean.length >= 3) {
      onUpdateAdminSettings({
        ...adminSettings,
        adminPin: clean,
      });
      setPinSavedNotice(true);
      setTimeout(() => setPinSavedNotice(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-backdrop-enter font-sans">
      <div className="bg-[#111114] border-t sm:border border-[#27272d] rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] pb-[env(safe-area-inset-bottom,0px)] animate-modal-enter">
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#09090b] border-b border-[#27272d] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase shrink-0">
              Settings
            </span>
            <h2 className="text-sm font-bold text-zinc-100 font-sans truncate">Google Sheet &amp; Admin Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs with Spring Sliding Underline */}
        <div
          ref={tabBarRef}
          className="relative px-4 sm:px-6 pt-3 border-b border-[#27272d] flex items-center gap-4 text-xs font-mono overflow-x-auto no-scrollbar bg-[#09090b]/50"
        >
          {tabIndicator.ready && (
            <div
              aria-hidden="true"
              style={{
                transform: `translateX(${tabIndicator.left}px)`,
                width: `${tabIndicator.width}px`,
              }}
              className="absolute bottom-0 left-0 h-[2px] rounded-full bg-red-500 pointer-events-none transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
            />
          )}
          <button
            ref={setTabRef('url')}
            onClick={() => {
              playClick();
              setActiveTab('url');
            }}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 font-bold ${
              activeTab === 'url'
                ? 'text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Endpoint
          </button>
          <button
            ref={setTabRef('security')}
            onClick={() => {
              playClick();
              setActiveTab('security');
            }}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 font-bold ${
              activeTab === 'security'
                ? 'text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Admin Security
          </button>
          <button
            ref={setTabRef('instructions')}
            onClick={() => {
              playClick();
              setActiveTab('instructions');
            }}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 font-bold ${
              activeTab === 'instructions'
                ? 'text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Setup Guide
          </button>
          <button
            ref={setTabRef('code')}
            onClick={() => {
              playClick();
              setActiveTab('code');
            }}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 font-bold ${
              activeTab === 'code'
                ? 'text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Backend Code
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs font-sans">
          {activeTab === 'url' && (
            <div key="tab-url" className="space-y-4 animate-tab-enter">
              <form onSubmit={handleTestAndSave} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-zinc-200 mb-1.5">
                    GOOGLE APPS SCRIPT WEB APP URL
                  </label>
                  <p className="text-xs text-zinc-400 mb-2">
                    Paste the Web App URL generated from <span className="text-zinc-200 font-mono">Deploy &gt; New deployment &gt; Web app</span> in your Google Sheet.
                  </p>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3.5 py-2.5 sm:py-2 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        syncStatus.url ? 'bg-red-500 radar-dot' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-zinc-400 text-xs">
                      STATUS:{' '}
                      <strong className="text-zinc-100">
                        {syncStatus.url ? 'Connected to Google Sheet' : 'Local Mode (279 Parts)'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {urlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput('');
                          onSaveUrl('');
                        }}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors btn-tactile"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isTesting || !urlInput.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg transition-colors btn-crimson-glow"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5" />
                          <span>Connect &amp; Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 font-mono ${
                    testResult.success
                      ? 'bg-zinc-200/10 border-zinc-400/30 text-zinc-100'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-100 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</div>
                    <p className="mt-0.5 text-xs font-sans text-zinc-300">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Factory Reset Section */}
              <div className="pt-4 mt-6 border-t border-[#27272d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-zinc-100 font-mono">RESET DEFAULT PARTS LIST</div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Restore the starting 279-part club list (238 Available, 41 Checked Out matching the sheet).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all parts back to the starting club list?')) {
                      onResetFactoryData();
                      onClose();
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 min-h-[38px] sm:min-h-0 px-3 py-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Inventory</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div key="tab-security" className="space-y-6 animate-tab-enter">
              {/* Admin Privileges Explanation */}
              <div className="p-3.5 bg-[#09090b] rounded-xl border border-[#27272d] space-y-1">
                <span className="font-bold text-zinc-100 text-xs font-mono">WHO CAN DO WHAT</span>
                <p className="text-zinc-400 text-xs">
                  Students can check parts in and out and search the parts list. Only coaches or leads with admin access can change Google Sheet links, reset the list, or edit settings.
                </p>
              </div>

              {/* 1. Admin PIN Management */}
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272d] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-zinc-100 font-mono">ADMIN SECURITY PIN</span>
                  </div>
                  {pinSavedNotice && (
                    <span className="text-zinc-100 font-mono font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>PIN UPDATED</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSavePin} noValidate className="flex items-center gap-2 font-mono">
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter 3-8 digit PIN"
                    className="flex-1 sm:flex-initial sm:w-44 px-3 py-2 sm:py-1.5 text-xs bg-[#1a1a1f] border border-[#27272d] rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="min-h-[36px] sm:min-h-0 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold text-xs shrink-0"
                  >
                    Update PIN
                  </button>
                </form>
              </div>

              {/* 2. Authorized Admin Emails */}
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 font-mono">AUTHORIZED ADMIN EMAILS</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{adminSettings.adminEmails.length} coaches/leads</span>
                </div>

                <form onSubmit={handleAddAdminEmail} noValidate className="flex items-center gap-2 font-mono">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="coach@school.edu"
                    className="flex-1 px-3 py-1.5 text-xs bg-[#1a1a1f] border border-[#27272d] rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!newAdminEmail.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="divide-y divide-[#27272d] border border-[#27272d] rounded-lg overflow-hidden bg-[#1a1a1f] max-h-48 overflow-y-auto font-mono">
                  {adminSettings.adminEmails.map((email) => (
                    <div key={email} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-200">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdminEmail(email)}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove admin email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {adminEmailError && (
                  <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg font-sans flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{adminEmailError}</span>
                  </div>
                )}
              </div>

              {/* 3. Strict Kiosk Mode Toggle */}
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <div className="font-bold text-zinc-100">SHARED LAB COMPUTER MODE</div>
                  <p className="text-zinc-400 text-[11px] mt-0.5 font-sans">
                    When turned on, students can only use Check Out/In and Parts Search unless an admin signs in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAdminSettings({
                      ...adminSettings,
                      kioskOnly: !adminSettings.kioskOnly,
                    })
                  }
                  className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors shrink-0 ${
                    adminSettings.kioskOnly
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-[#1a1a1f] text-zinc-400 border-[#27272d] hover:text-zinc-100'
                  }`}
                >
                  {adminSettings.kioskOnly ? 'LOCKED ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div key="tab-instructions" className="space-y-4 text-zinc-300 leading-relaxed font-sans animate-tab-enter">
              <div className="p-4 bg-[#09090b] rounded-xl border border-[#27272d]">
                <span className="font-bold text-zinc-100 font-mono">3-MINUTE SETUP OVERVIEW</span>
                <ol className="list-decimal list-inside space-y-2.5 mt-2.5 text-zinc-400 text-xs">
                  <li>
                    <strong className="text-zinc-100">Upload to Google Sheets:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      In Google Drive, click <span className="font-mono text-zinc-300">+ New &gt; File upload</span> and select your inventory spreadsheet. Open it and select <span className="font-mono text-zinc-300">File &gt; Save as Google Sheets</span>.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-100">Add the Google Apps Script:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      In your Google Sheet, click <span className="font-mono text-zinc-300">Extensions &gt; Apps Script</span> in the top menu. Delete any existing code in <code className="text-zinc-200 bg-[#1a1a1f] px-1.5 py-0.5 rounded font-mono">Code.gs</code>, paste the code from the <em>Backend Code</em> tab, and click Save.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-100">Deploy as Web App API:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      Click <span className="font-mono text-zinc-300">Deploy &gt; New deployment</span>. Select <span className="font-mono text-zinc-300">Web app</span>.<br />
                      Set <strong>Execute as:</strong> <code className="text-zinc-200 font-mono">Me</code>.<br />
                      Set <strong>Who has access:</strong> <code className="text-zinc-100 font-mono font-bold">Anyone</code>.<br />
                      Click <strong>Deploy</strong>, grant Google account access, and copy the Web App URL.
                    </p>
                  </li>
                  <li>
                    <strong className="text-zinc-100">Connect Web App to Website:</strong>
                    <p className="pl-4 mt-0.5 text-zinc-400">
                      Paste the copied Web App URL into the <em>API Endpoint</em> field in this modal and click <strong>Connect &amp; Sync</strong>!
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div key="tab-code" className="space-y-3 font-sans animate-tab-enter">
              <div className="p-3 bg-zinc-200/10 border border-zinc-400/25 rounded-xl text-zinc-200 text-xs font-mono">
                <strong className="block mb-1 font-bold">
                  HOW SAVING WORKS (Never overwrites your part tabs):
                </strong>
                Checkouts and returns <strong>only add a new row to your LOGS sheet</strong>. Your category sheets and formulas update status automatically.
              </div>

              <div className="flex items-center justify-between font-mono">
                <span className="text-zinc-300 font-bold text-xs">APPS SCRIPT SOURCE (<code>Code.gs</code>)</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-zinc-100" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-[#09090b] border border-[#27272d] rounded-xl overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-80 leading-relaxed">
                  {APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#27272d] flex items-center justify-between gap-2 text-xs text-zinc-400 bg-[#09090b] font-mono">
          <span className="truncate">Settings persist in browser storage</span>
          <button
            onClick={onClose}
            className="min-h-[38px] sm:min-h-0 px-4 py-1.5 bg-[#1a1a1f] hover:bg-[#27272d] text-zinc-100 border border-[#27272d] rounded-lg font-bold transition-colors btn-tactile shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
