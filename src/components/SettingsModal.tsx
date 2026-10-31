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
  const [newPin, setNewPin] = useState(adminSettings.adminPin);
  const [pinSavedNotice, setPinSavedNotice] = useState(false);

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
    const clean = newAdminEmail.trim().toLowerCase();
    if (clean && !adminSettings.adminEmails.some((em) => em.toLowerCase() === clean)) {
      onUpdateAdminSettings({
        ...adminSettings,
        adminEmails: [...adminSettings.adminEmails, clean],
      });
      setNewAdminEmail('');
    }
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    if (adminSettings.adminEmails.length <= 1) {
      alert('You must keep at least one authorized admin email.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-none animate-fade-in font-sans">
      <div className="bg-white border border-slate-300 rounded-sm shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
              [SYSTEM_CONFIG]
            </span>
            <h2 className="text-sm font-bold text-slate-900 font-sans">System Settings &amp; Administration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4 text-xs font-mono overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 border-b-2 font-bold ${
              activeTab === 'url'
                ? 'text-slate-900 border-amber-600'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            [API_ENDPOINT]
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 border-b-2 font-bold ${
              activeTab === 'security'
                ? 'text-slate-900 border-amber-600'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            [ADMIN_SECURITY]
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 border-b-2 font-bold ${
              activeTab === 'instructions'
                ? 'text-slate-900 border-amber-600'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            [SETUP_GUIDE]
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 transition-colors whitespace-nowrap shrink-0 border-b-2 font-bold ${
              activeTab === 'code'
                ? 'text-slate-900 border-amber-600'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            [BACKEND_CODE]
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs font-sans">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-800 mb-1.5">
                    GOOGLE APPS SCRIPT WEB APP URL
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Paste the Web App URL generated from <span className="text-slate-700 font-mono">Deploy &gt; New deployment &gt; Web app</span> in your Google Sheet.
                  </p>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`w-2 h-2 rounded-none ${
                        syncStatus.url ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    />
                    <span className="text-slate-600 text-xs">
                      STATUS:{' '}
                      <strong className="text-slate-900">
                        {syncStatus.url ? '[LIVE_LINKED_TO_SHEET]' : '[LOCAL_BENCHMARK_279_ITEMS]'}
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
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-sm transition-colors"
                      >
                        [DISCONNECT]
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isTesting || !urlInput.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-sm transition-colors"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>TESTING...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5" />
                          <span>[CONNECT_&amp;_SYNC]</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-sm border flex items-start gap-2.5 font-mono ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? '[CONNECTION_SUCCESSFUL]' : '[CONNECTION_FAILED]'}</div>
                    <p className="mt-0.5 text-xs font-sans">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Factory Reset Section */}
              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 font-mono">[RESET_BENCHMARK_DATA]</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Restore the exact 279-item benchmark inventory (238 Available, 41 Checked Out matching Google Sheet).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all inventory records to the default benchmark?')) {
                      onResetFactoryData();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-sm transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>[RESET_INVENTORY]</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Admin Privileges Explanation */}
              <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-xs font-mono">[ROLE_BASED_ACCESS_CONTROL]</span>
                <p className="text-slate-600 text-xs">
                  Regular members and students in the lab are restricted to the <strong>Checkout &amp; Checkin</strong> tool, scanner, and inventory lookup. Only designated admins can modify API links, reset data, or manage system parameters.
                </p>
              </div>

              {/* 1. Admin PIN Management */}
              <div className="p-4 bg-white rounded-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 font-mono">[ADMIN_SECURITY_PIN]</span>
                  </div>
                  {pinSavedNotice && (
                    <span className="text-emerald-700 font-mono font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>[PIN_UPDATED]</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSavePin} className="flex items-center gap-2 font-mono">
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter 3-8 digit PIN"
                    className="w-40 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-sm text-slate-900 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm transition-colors font-bold text-xs"
                  >
                    UPDATE PIN
                  </button>
                </form>
              </div>

              {/* 2. Authorized Admin Emails */}
              <div className="p-4 bg-white rounded-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 font-mono">[AUTHORIZED_ADMIN_EMAILS]</span>
                  <span className="text-slate-500 font-mono text-[11px]">{adminSettings.adminEmails.length} coaches/leads</span>
                </div>

                <form onSubmit={handleAddAdminEmail} className="flex items-center gap-2 font-mono">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="coach@school.edu"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-sm text-slate-900 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!newAdminEmail.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-sm transition-colors disabled:opacity-40"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>ADD</span>
                  </button>
                </form>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-sm overflow-hidden bg-white max-h-48 overflow-y-auto font-mono">
                  {adminSettings.adminEmails.map((email) => (
                    <div key={email} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-slate-800">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdminEmail(email)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-sm transition-colors"
                        title="Remove admin email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Strict Kiosk Mode Toggle */}
              <div className="p-4 bg-white rounded-sm border border-slate-200 flex items-center justify-between font-mono">
                <div>
                  <div className="font-bold text-slate-800">[STRICT_KIOSK_MODE]</div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-sans">
                    When active, non-admin members can only access the Checkout/Checkin panel and Inventory search.
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                    adminSettings.kioskOnly
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {adminSettings.kioskOnly ? '[KIOSK_ON]' : '[KIOSK_OFF]'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 text-slate-700 leading-relaxed font-sans">
              <div className="p-4 bg-slate-50 rounded-sm border border-slate-200">
                <span className="font-bold text-slate-900 font-mono">[3_MINUTE_SETUP_OVERVIEW]</span>
                <ol className="list-decimal list-inside space-y-2.5 mt-2.5 text-slate-600 text-xs">
                  <li>
                    <strong className="text-slate-900">Upload to Google Sheets:</strong>
                    <p className="pl-4 mt-0.5 text-slate-600">
                      In Google Drive, click <span className="font-mono text-slate-800">+ New &gt; File upload</span> and select your inventory spreadsheet. Open it and select <span className="font-mono text-slate-800">File &gt; Save as Google Sheets</span>.
                    </p>
                  </li>
                  <li>
                    <strong className="text-slate-900">Add the Google Apps Script:</strong>
                    <p className="pl-4 mt-0.5 text-slate-600">
                      In your Google Sheet, click <span className="font-mono text-slate-800">Extensions &gt; Apps Script</span> in the top menu. Delete any existing code in <code className="text-slate-900 bg-slate-200 px-1 py-0.5 rounded-none font-mono">Code.gs</code>, paste the code from the <em>[BACKEND_CODE]</em> tab, and click Save.
                    </p>
                  </li>
                  <li>
                    <strong className="text-slate-900">Deploy as Web App API:</strong>
                    <p className="pl-4 mt-0.5 text-slate-600">
                      Click <span className="font-mono text-slate-800">Deploy &gt; New deployment</span>. Select <span className="font-mono text-slate-800">Web app</span>.<br />
                      Set <strong>Execute as:</strong> <code className="text-slate-900 font-mono">Me</code>.<br />
                      Set <strong>Who has access:</strong> <code className="text-emerald-700 font-mono font-bold">Anyone</code>.<br />
                      Click <strong>Deploy</strong>, grant Google account access, and copy the Web App URL.
                    </p>
                  </li>
                  <li>
                    <strong className="text-slate-900">Connect Web App to Website:</strong>
                    <p className="pl-4 mt-0.5 text-slate-600">
                      Paste the copied Web App URL into the <em>[API_ENDPOINT]</em> field in this modal and click <strong>Connect &amp; Sync</strong>!
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 font-sans">
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-800 text-xs font-mono">
                <strong className="block mb-1 font-bold">
                  [LOGS_ONLY_ARCHITECTURE] (Zero Category Sheet Overwrites):
                </strong>
                Checkouts and check-ins <strong>only append a new row to your LOGS sheet</strong>. All category sheets and spreadsheet formulas calculate status automatically.
              </div>

              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-700 font-bold text-xs">[APPS_SCRIPT_SOURCE] (`Code.gs`)</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>[COPIED!]</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>[COPY_CODE]</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-sm overflow-x-auto text-[11px] font-mono text-slate-200 max-h-80 leading-relaxed">
                  {APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50 font-mono">
          <span>Settings persist automatically in localStorage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
