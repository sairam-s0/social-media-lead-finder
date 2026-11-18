import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building, 
  Bell, 
  Search, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Key, 
  Download, 
  RefreshCw, 
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Send,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  Check,
  Server
} from 'lucide-react';
import { 
  getSettings, 
  updateSettings, 
  testExa, 
  testTelegram, 
  testEmail,
  sendEmailReport,
  getNetworkStatus,
  getLicenseStatus, 
  activateLicense, 
  checkForUpdates,
  exportLeads
} from '../services/api';

const Settings = ({ onBrandingUpdated }) => {
  const [settings, setSettings] = useState({
    company_name: 'LeadPulse AI',
    company_tagline: 'Automated Social Lead Discovery Engine',
    company_logo: '⚡',
    primary_color: '#4F46E5',
    search_interval_minutes: '60',
    telegram_enabled: 'false',
    email_enabled: 'false',
    smtp_from_email: '',
    smtp_to_email: '',
    smtp_server: 'smtp.gmail.com',
    smtp_port: '587',
  });

  const [vaultStatus, setVaultStatus] = useState({
    exa_configured: false,
    exa_masked: '',
    telegram_bot_configured: false,
    telegram_bot_masked: '',
    telegram_chat_configured: false,
    telegram_chat_masked: '',
    smtp_configured: false,
    smtp_password_masked: '',
  });

  // User input secret drafts (only submitted if changed)
  const [exaDraftKey, setExaDraftKey] = useState('');
  const [telegramDraftToken, setTelegramDraftToken] = useState('');
  const [telegramDraftChatId, setTelegramDraftChatId] = useState('');
  const [smtpPasswordDraft, setSmtpPasswordDraft] = useState('');

  // Email Action States
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendReportResult, setSendReportResult] = useState(null);

  // Network State
  const [networkStatus, setNetworkStatus] = useState(null);
  const [checkingNetwork, setCheckingNetwork] = useState(false);

  // Licensing State
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [licenseDraftKey, setLicenseDraftKey] = useState('');
  const [licenseClientName, setLicenseClientName] = useState('');
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState('');

  // Test Connection States
  const [testingExa, setTestingExa] = useState(false);
  const [exaTestResult, setExaTestResult] = useState(null);

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);

  // Update check states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  const [systemHealth, setSystemHealth] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettingsData = async () => {
    try {
      const res = await getSettings();
      if (res.success) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
        if (res.vault) {
          setVaultStatus(res.vault);
          if (res.vault.exa_masked && !exaDraftKey) {
            setExaDraftKey(res.vault.exa_masked);
          }
          if (res.vault.telegram_bot_masked && !telegramDraftToken) {
            setTelegramDraftToken(res.vault.telegram_bot_masked);
          }
          if (res.vault.telegram_chat_masked && !telegramDraftChatId) {
            setTelegramDraftChatId(res.vault.telegram_chat_masked);
          }
          if (res.vault.smtp_password_masked && !smtpPasswordDraft) {
            setSmtpPasswordDraft(res.vault.smtp_password_masked);
          }
        }
        setSystemHealth(res.system_health);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchNetworkStatus = async () => {
    try {
      setCheckingNetwork(true);
      const res = await getNetworkStatus();
      setNetworkStatus(res);
    } catch (err) {
      console.warn('Network probe error:', err);
      setNetworkStatus({ connected: false, message: 'Could not contact network status prober.' });
    } finally {
      setCheckingNetwork(false);
    }
  };

  const fetchLicenseData = async () => {
    try {
      const info = await getLicenseStatus();
      setLicenseInfo(info);
      if (info.license_key_masked) {
        setLicenseDraftKey(info.license_key_masked);
      }
      if (info.client_name) {
        setLicenseClientName(info.client_name);
      }
    } catch (err) {
      console.warn('Failed to fetch license status:', err);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    fetchLicenseData();
    fetchNetworkStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value,
    }));
  };

  const handleTestExaConnection = async () => {
    setTestingExa(true);
    setExaTestResult(null);
    try {
      const res = await testExa(exaDraftKey);
      setExaTestResult({ success: res.success, message: res.message });
      fetchSettingsData();
    } catch (err) {
      setExaTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed. Check your API key.',
      });
    } finally {
      setTestingExa(false);
    }
  };

  const handleTestTelegramConnection = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await testTelegram(telegramDraftToken, telegramDraftChatId);
      setTelegramTestResult({ success: res.success, message: res.message });
      fetchSettingsData();
    } catch (err) {
      setTelegramTestResult({
        success: false,
        message: err.response?.data?.message || 'Telegram test failed.',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleApplyEmailPreset = (preset) => {
    if (preset === 'gmail') {
      setSettings((prev) => ({ ...prev, smtp_server: 'smtp.gmail.com', smtp_port: '587' }));
    } else if (preset === 'outlook') {
      setSettings((prev) => ({ ...prev, smtp_server: 'smtp.office365.com', smtp_port: '587' }));
    } else if (preset === 'yahoo') {
      setSettings((prev) => ({ ...prev, smtp_server: 'smtp.mail.yahoo.com', smtp_port: '587' }));
    }
  };

  const handleTestEmailConnection = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await testEmail({
        smtp_server: settings.smtp_server,
        smtp_port: parseInt(settings.smtp_port) || 587,
        from_email: settings.smtp_from_email,
        smtp_password: smtpPasswordDraft,
        to_email: settings.smtp_to_email,
      });
      setEmailTestResult({ success: res.success, message: res.message });
      fetchSettingsData();
    } catch (err) {
      setEmailTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'SMTP connection test failed. Check settings and network.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSendEmailReportNow = async () => {
    setSendingReport(true);
    setSendReportResult(null);
    try {
      const res = await sendEmailReport({
        to_email: settings.smtp_to_email,
        subject: `📊 On-Demand Social Leads Report - ${new Date().toLocaleDateString()}`
      });
      setSendReportResult({ success: res.success, message: res.message });
    } catch (err) {
      setSendReportResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to send report email. Ensure credentials and internet are active.',
      });
    } finally {
      setSendingReport(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseDraftKey.trim()) return;
    setIsActivatingLicense(true);
    setLicenseMessage('');
    try {
      const res = await activateLicense(licenseDraftKey.trim(), licenseClientName.trim());
      if (res.success) {
        setLicenseMessage('✓ License activated successfully!');
        fetchLicenseData();
      } else {
        setLicenseMessage(res.error || 'Activation failed.');
      }
    } catch (err) {
      setLicenseMessage(err.response?.data?.error || 'License activation failed.');
    } finally {
      setIsActivatingLicense(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateResult(null);
    try {
      const res = await checkForUpdates();
      setUpdateResult(res);
    } catch (err) {
      console.warn('Update check failed:', err);
      setUpdateResult({
        has_update: false,
        current_version: '1.0.0',
        release_notes: 'Could not connect to update manifest server.',
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await exportLeads('csv');
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = { ...settings };

      // Append secret changes if user updated them
      if (exaDraftKey && !exaDraftKey.startsWith('••••') && !exaDraftKey.startsWith('****')) {
        payload.exa_api_key = exaDraftKey;
      }
      if (telegramDraftToken && !telegramDraftToken.startsWith('••••') && !telegramDraftToken.startsWith('****')) {
        payload.telegram_bot_token = telegramDraftToken;
      }
      if (telegramDraftChatId && !telegramDraftChatId.startsWith('••••') && !telegramDraftChatId.startsWith('****')) {
        payload.telegram_chat_id = telegramDraftChatId;
      }
      if (smtpPasswordDraft && !smtpPasswordDraft.startsWith('••••') && !smtpPasswordDraft.startsWith('****')) {
        payload.smtp_password = smtpPasswordDraft;
      }

      await updateSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onBrandingUpdated) onBrandingUpdated(settings);
      fetchSettingsData();
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Mobile & Cloud Backend Connectivity Card */}
        <div className="glass-card p-5 md:p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Device & Engine Mode</h3>
                <p className="text-xs text-slate-400">Direct mobile search engine or optional desktop synchronization</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {settings.api_server_url ? '🔗 Cloud / PC Sync Active' : '⚡ 100% Native Mobile Engine (Active)'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Optional Desktop PC Server URL
              </label>
              <input
                type="text"
                name="api_server_url"
                placeholder="Leave blank for 100% mobile mode (or enter e.g. http://192.168.1.50:5050)"
                value={settings.api_server_url || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              💡 <b>100% Native Mobile Engine:</b> Live searches, lead parsing, local storage, and Telegram alerts execute directly from your phone over Wi-Fi / Cellular. No computer or backend server is required! If you also run the desktop software on your PC, you can enter its IP above to sync leads between your phone and PC.
            </p>
          </div>
        </div>

        {/* Section 1: Company Branding */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Company Branding</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Logo / Badge Icon</label>
              <input
                type="text"
                name="company_logo"
                value={settings.company_logo}
                onChange={handleChange}
                maxLength={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Tagline</label>
              <input
                type="text"
                name="company_tagline"
                value={settings.company_tagline}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Exa Search API (Encrypted Vault) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Exa Search API (Direct HTTPS)</h3>
            </div>
            {vaultStatus.exa_configured ? (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured in Vault
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Key Missing
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-400">Exa API Key</label>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Stored encrypted with Windows DPAPI
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="exa_live_..."
                  value={exaDraftKey}
                  onChange={(e) => setExaDraftKey(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestExaConnection}
                  disabled={testingExa || !exaDraftKey}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition cursor-pointer"
                >
                  {testingExa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Test Connection
                </button>
              </div>
            </div>

            {exaTestResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                exaTestResult.success 
                  ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' 
                  : 'bg-red-950/50 border border-red-800/80 text-red-300'
              }`}>
                {exaTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{exaTestResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Auto-Search Interval (Minutes)</label>
                <input
                  type="number"
                  name="search_interval_minutes"
                  min="5"
                  max="1440"
                  value={settings.search_interval_minutes}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Default 60 min. Single-instance scheduler.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Settings (Encrypted Vault) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Telegram Notifications</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="telegram_enabled"
                checked={settings.telegram_enabled === 'true'}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
              />
              <span className="text-xs font-semibold text-slate-200">Enable Telegram Alerts</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telegram Bot Token</label>
              <input
                type="password"
                placeholder="123456789:ABCdef..."
                value={telegramDraftToken}
                onChange={(e) => setTelegramDraftToken(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                placeholder="-100123456789 or User ID"
                value={telegramDraftChatId}
                onChange={(e) => setTelegramDraftChatId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestTelegramConnection}
              disabled={testingTelegram || !telegramDraftToken}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition cursor-pointer"
            >
              {testingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              Test Telegram Bot
            </button>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Credentials masked in GET endpoints
            </span>
          </div>

          {telegramTestResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              telegramTestResult.success 
                ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' 
                : 'bg-red-950/50 border border-red-800/80 text-red-300'
            }`}>
              {telegramTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{telegramTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Section 4: Automated Email & Excel Reporting */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">Automated Email & Excel Reporting</h3>
                <p className="text-xs text-slate-400">Automatically emails discovered leads as formatted Excel (.xlsx) attachments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {vaultStatus.smtp_configured ? (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Password Protected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Password Needed
                </span>
              )}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  name="email_enabled"
                  checked={settings.email_enabled === 'true'}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
                <span className="text-xs font-semibold text-white">Enable Auto-Email</span>
              </label>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <span className="text-xs font-medium text-slate-400">Quick Host Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyEmailPreset('gmail')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Gmail (587)
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailPreset('outlook')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Outlook / 365 (587)
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailPreset('yahoo')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Yahoo Mail (587)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                From Email <span className="text-indigo-400 font-normal">(Sender Account)</span>
              </label>
              <input
                type="email"
                name="smtp_from_email"
                placeholder="e.g. notifications@myagency.com or yourname@gmail.com"
                value={settings.smtp_from_email || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                To Email <span className="text-indigo-400 font-normal">(Destination Recipient)</span>
              </label>
              <input
                type="email"
                name="smtp_to_email"
                placeholder="e.g. client@company.com or sales@myagency.com"
                value={settings.smtp_to_email || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-400">SMTP App Password</label>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> DPAPI Encrypted
                </span>
              </div>
              <input
                type="password"
                placeholder="16-character app password"
                value={smtpPasswordDraft}
                onChange={(e) => setSmtpPasswordDraft(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Server Host</label>
              <input
                type="text"
                name="smtp_server"
                placeholder="smtp.gmail.com"
                value={settings.smtp_server || 'smtp.gmail.com'}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Port</label>
              <input
                type="number"
                name="smtp_port"
                placeholder="587"
                value={settings.smtp_port || '587'}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-[11px] text-indigo-300 space-y-1">
            <p className="font-semibold text-indigo-200">💡 Gmail App Password Instructions:</p>
            <p>
              If using a Gmail or Google Workspace address, generate a dedicated 16-character App Password:
              <br />
              Go to <strong className="text-white">Google Account (myaccount.google.com)</strong> → type <strong className="text-white">"App passwords"</strong> in the top search bar (or visit <code className="text-indigo-200 bg-slate-900/80 px-1 py-0.5 rounded">myaccount.google.com/apppasswords</code>). Create an app named "Lead Finder" and enter the 16-character password here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestEmailConnection}
              disabled={testingEmail || !settings.smtp_from_email || !settings.smtp_to_email}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition cursor-pointer"
            >
              {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Test Connection & Send Verification</span>
            </button>

            <button
              type="button"
              onClick={handleSendEmailReportNow}
              disabled={sendingReport || !settings.smtp_from_email || !settings.smtp_to_email}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {sendingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span>Send Excel Report Now (.xlsx)</span>
            </button>
          </div>

          {emailTestResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              emailTestResult.success 
                ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' 
                : 'bg-red-950/50 border border-red-800/80 text-red-300'
            }`}>
              {emailTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{emailTestResult.success ? 'Verification Succeeded' : 'Verification Error'}</p>
                <p className="opacity-90 mt-0.5">{emailTestResult.message}</p>
              </div>
            </div>
          )}

          {sendReportResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              sendReportResult.success 
                ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' 
                : 'bg-red-950/50 border border-red-800/80 text-red-300'
            }`}>
              {sendReportResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{sendReportResult.success ? 'Excel Report Sent Successfully' : 'Dispatch Failed'}</p>
                <p className="opacity-90 mt-0.5">{sendReportResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Licensing & Software Delivery */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Licensing & Software Delivery</h3>
            </div>
            {licenseInfo && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                licenseInfo.active
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/80'
                  : 'text-amber-400 bg-amber-950/60 border border-amber-800/80'
              }`}>
                {licenseInfo.active ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {licenseInfo.status.toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">License Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="SLF-PRO-2026-VALD-0001"
                  value={licenseDraftKey}
                  onChange={(e) => setLicenseDraftKey(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleActivateLicense}
                  disabled={isActivatingLicense || !licenseDraftKey.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition cursor-pointer"
                >
                  {isActivatingLicense ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Verify
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Licensed Organization</label>
              <input
                type="text"
                placeholder="Client Name"
                value={licenseClientName}
                onChange={(e) => setLicenseClientName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {licenseMessage && (
            <p className="text-xs text-indigo-400 font-medium">{licenseMessage}</p>
          )}

          {licenseInfo && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Offline Grace Period:</span>
              <span className="text-white font-semibold">
                {licenseInfo.grace_days_remaining} days remaining {licenseInfo.offline_mode && '(Offline Mode)'}
              </span>
            </div>
          )}

          {/* Check for Updates */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCheckForUpdates}
              disabled={checkingUpdate}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
              Check for Updates
            </button>
            <span className="text-xs text-slate-500">Current Version: v1.0.0</span>
          </div>

          {updateResult && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">
                  {updateResult.has_update ? '🚀 Update Available!' : '✓ Application is Up to Date'}
                </span>
                <span className="text-slate-400 font-mono">v{updateResult.latest_version}</span>
              </div>
              <p className="text-slate-400">{updateResult.release_notes}</p>
            </div>
          )}
        </div>

        {/* Section 5: Legal & Data Privacy (GDPR / DPDP & LinkedIn ToS) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Legal, Compliance & Data Rights</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/50 text-xs text-amber-300 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-amber-200">Regulatory Compliance Notice:</p>
            <p>
              Social Lead Finder queries public web indices and extracts business requirements. Storing personal names and roles requires compliance with the LinkedIn Terms of Service, EU GDPR, and India DPDP Act.
            </p>
            <p>
              Under privacy laws, individuals maintain the right to data portability and the right to erasure. Use the data export and lead deletion controls below to fulfill subject requests.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-40"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export All Leads (CSV)
            </button>
          </div>
        </div>

        {/* Section 6: System Health Diagnostics */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">System Diagnostics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {systemHealth && Object.entries(systemHealth).map(([key, val]) => {
              const isPositive = [
                'healthy', 'connected', 'running', 'configured', 'active',
                'mobile_native', 'ready', 'mcp_mode', 'operational'
              ].includes(String(val).toLowerCase());

              const formatLabel = (v) => {
                if (v === 'mobile_native') return 'Native Mobile Active';
                if (v === 'not_configured') return 'MCP Free Mode (Ready)';
                if (v === 'disabled') return 'Optional (Off)';
                return v;
              };

              return (
                <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">{key}</span>
                  <span className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
                    isPositive ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isPositive ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                    {formatLabel(val)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Network Connectivity Status Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {networkStatus?.connected ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div>
                <span className="text-xs font-semibold text-white">
                  Internet Connectivity: {networkStatus?.connected ? 'Online' : 'Offline / Check Connection'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {networkStatus?.message || (networkStatus?.connected ? 'Outbound connection operational.' : 'No outbound internet detected.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchNetworkStatus}
              disabled={checkingNetwork}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${checkingNetwork ? 'animate-spin' : ''}`} />
              Re-test Internet
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings and Vault updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;
