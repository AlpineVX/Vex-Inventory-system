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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">System Settings &amp; Administration</h2>
            <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Privileges Active</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-zinc-800 flex items-center gap-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'url'
                ? 'text-white border-b-2 border-zinc-200 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Endpoint Connection
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'text-white border-b-2 border-zinc-200 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Admin Privileges &amp; Roles
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'instructions'
                ? 'text-white border-b-2 border-zinc-200 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Step-by-Step Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'code'
                ? 'text-white border-b-2 border-zinc-200 font-semibold'
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
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
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
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-40 rounded-md transition-colors shadow-sm"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing &amp; Syncing...</span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Inventory</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Admin Privileges Explanation */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-white text-xs">Role-Based Access Control</span>
                <p className="text-zinc-400 text-xs">
                  Regular members and students in the lab are restricted to the <strong>Checkout &amp; Checkin</strong> tool, scanner, and inventory lookup. Only designated admins can modify API links, reset data, or manage system parameters.
                </p>
              </div>

              {/* 1. Admin PIN Management */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-zinc-200">Admin Passcode / PIN</span>
                  </div>
                  {pinSavedNotice && (
                    <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>PIN Updated!</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSavePin} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter 3-8 digit PIN"
                    className="w-40 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Update PIN
                  </button>
                </form>
              </div>

              {/* 2. Authorized Admin Emails */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Authorized Admin Emails</span>
                  <span className="text-zinc-500 text-[11px]">{adminSettings.adminEmails.length} coaches/leads</span>
                </div>

                <form onSubmit={handleAddAdminEmail} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="coach@school.edu"
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!newAdminEmail.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-40"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Add Admin</span>
                  </button>
                </form>

                <div className="divide-y divide-zinc-850 border border-zinc-800/80 rounded-lg overflow-hidden bg-zinc-900/60 max-h-48 overflow-y-auto">
                  {adminSettings.adminEmails.map((email) => (
                    <div key={email} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-200">{email}</span>
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
              </div>

              {/* 3. Strict Kiosk Mode Toggle */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Strict Member Kiosk Mode</div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    adminSettings.kioskOnly
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {adminSettings.kioskOnly ? 'Kiosk Mode ON' : 'Standard Mode'}
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
                      In your Google Sheet, click <span className="text-zinc-200">Extensions &gt; Apps Script</span> in the top menu. Delete any existing code in <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded">Code.gs</code>, paste the code from the <em>Apps Script Backend Code</em> tab, and click the Save floppy disk icon.
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
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-200 text-xs">
                <strong className="text-emerald-300 font-semibold block mb-1">
                  ✓ Pure LOGS-Only Architecture (Zero Category Sheet Overwrites):
                </strong>
                Checkouts and check-ins <strong>only append a new row to your LOGS sheet</strong>. This script completely leaves all your category sheets (Motors, Brain, Sensor, Solenoid, etc.) and your <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-300 font-mono">ARRAYFORMULA / MAP / XLOOKUP</code> formulas untouched! Your spreadsheet formulas do 100% of the status calculation automatically.
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">Google Apps Script Source Code (`Code.gs`)</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-colors shadow-sm"
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
