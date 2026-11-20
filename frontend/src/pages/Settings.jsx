import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Send, 
  Download, 
  RefreshCw, 
  Smartphone,
  Save,
  CheckCircle2,
  AlertTriangle,
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
    company_name: 'LeadPulse',
    company_tagline: 'Social Lead Discovery Engine',
    company_logo: '⚡',
    primary_color: '#5e6ad2',
    search_interval_minutes: '60',
    telegram_enabled: 'false',
    email_enabled: 'false',
    smtp_from_email: '',
    smtp_to_email: '',
    smtp_server: 'smtp.gmail.com',
    smtp_port: '587',
    api_server_url: '',
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

  // User input secret drafts
  const [exaDraftKey, setExaDraftKey] = useState('');
  const [telegramDraftToken, setTelegramDraftToken] = useState('');
  const [telegramDraftChatId, setTelegramDraftChatId] = useState('');
  const [smtpPasswordDraft, setSmtpPasswordDraft] = useState('');

  // Email Action States
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendReportResult, setSendReportResult] = useState(null);

  // Connection Test States
  const [testingExa, setTestingExa] = useState(false);
  const [exaTestResult, setExaTestResult] = useState(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);

  // Form Save States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchSettingsData = async () => {
    try {
      const res = await getSettings();
      if (res.success) {
        if (res.settings) {
          setSettings((prev) => ({
            ...prev,
            ...res.settings,
          }));
        }
        if (res.vault) {
          setVaultStatus(res.vault);
          if (res.vault.exa_masked) setExaDraftKey(res.vault.exa_masked);
          if (res.vault.telegram_bot_masked) setTelegramDraftToken(res.vault.telegram_bot_masked);
          if (res.vault.telegram_chat_masked) setTelegramDraftChatId(res.vault.telegram_chat_masked);
          if (res.vault.smtp_password_masked) setSmtpPasswordDraft(res.vault.smtp_password_masked);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchSettingsData();
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

  const handleTestEmailConnection = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await testEmail({
        smtp_server: settings.smtp_server,
        smtp_port: parseInt(settings.smtp_port, 10) || 587,
        from_email: settings.smtp_from_email,
        smtp_password: smtpPasswordDraft,
        to_email: settings.smtp_to_email,
      });
      setEmailTestResult({ success: res.success, message: res.message });
      fetchSettingsData();
    } catch (err) {
      setEmailTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'SMTP connection test failed.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = { ...settings };

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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header Title & Save Button Bar */}
        <div className="flex items-center justify-between border-b border-[#1f2430] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#ededef]">System & Integration Settings</h2>
            <p className="text-xs text-[#8a8f9e]">
              Manage credentials, notification webhooks, SMTP email dispatch, and workspace identity.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] rounded-md text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Section 1: Workspace Identity */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2.5">
            <span className="text-xs font-semibold text-[#ededef]">Workspace Branding</span>
            <span className="text-[10px] font-mono text-[#555a68]">Client Facing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Icon / Logo Mark</label>
              <input
                type="text"
                name="company_logo"
                value={settings.company_logo}
                onChange={handleChange}
                maxLength={4}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Company Tagline</label>
              <input
                type="text"
                name="company_tagline"
                value={settings.company_tagline}
                onChange={handleChange}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Exa API Integration (Encrypted DPAPI Vault) */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#ededef]">Exa Neural Search Integration</span>
              <span className="text-[10px] font-mono text-[#555a68] flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Windows DPAPI Encrypted
              </span>
            </div>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
              vaultStatus.exa_configured 
                ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20' 
                : 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20'
            }`}>
              {vaultStatus.exa_configured ? 'Configured in Vault' : 'Key Optional (MCP Active)'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-[#8a8f9e]">Exa API Key</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Exa key (optional when using Exa MCP directly)..."
                value={exaDraftKey}
                onChange={(e) => setExaDraftKey(e.target.value)}
                className="flex-1 p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestExaConnection}
                disabled={testingExa}
                className="px-3 py-2 bg-[#161922] hover:bg-[#1f2430] border border-[#282f40] text-[#ededef] rounded-md text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                {testingExa ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            {exaTestResult && (
              <p className={`text-xs ${exaTestResult.success ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                {exaTestResult.message}
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Telegram Notification Alerts */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2.5">
            <span className="text-xs font-semibold text-[#ededef]">Telegram Realtime Alerts</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="telegram_enabled"
                checked={settings.telegram_enabled === 'true'}
                onChange={handleChange}
                className="rounded border-[#1f2430] bg-[#090a0f] text-[#5e6ad2]"
              />
              <span className="text-[11px] font-mono text-[#8a8f9e]">Enable Telegram</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Telegram Bot Token</label>
              <input
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                value={telegramDraftToken}
                onChange={(e) => setTelegramDraftToken(e.target.value)}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Telegram Chat ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="-1001234567890"
                  value={telegramDraftChatId}
                  onChange={(e) => setTelegramDraftChatId(e.target.value)}
                  className="flex-1 p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono focus:border-[#5e6ad2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestTelegramConnection}
                  disabled={testingTelegram}
                  className="px-3 py-2 bg-[#161922] hover:bg-[#1f2430] border border-[#282f40] text-[#ededef] rounded-md text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
                >
                  {testingTelegram ? 'Testing...' : 'Test'}
                </button>
              </div>
            </div>
          </div>
          {telegramTestResult && (
            <p className={`text-xs ${telegramTestResult.success ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
              {telegramTestResult.message}
            </p>
          )}
        </div>

        {/* Section 4: Email SMTP Digest Dispatch */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2.5">
            <span className="text-xs font-semibold text-[#ededef]">Email SMTP Dispatch</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="email_enabled"
                checked={settings.email_enabled === 'true'}
                onChange={handleChange}
                className="rounded border-[#1f2430] bg-[#090a0f] text-[#5e6ad2]"
              />
              <span className="text-[11px] font-mono text-[#8a8f9e]">Enable Email</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Sender Email</label>
              <input
                type="email"
                name="smtp_from_email"
                placeholder="notifications@yourdomain.com"
                value={settings.smtp_from_email}
                onChange={handleChange}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">Recipient Email</label>
              <input
                type="email"
                name="smtp_to_email"
                placeholder="founder@yourdomain.com"
                value={settings.smtp_to_email}
                onChange={handleChange}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">SMTP Host & Port</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="smtp_server"
                  value={settings.smtp_server}
                  onChange={handleChange}
                  className="flex-1 p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono focus:border-[#5e6ad2] focus:outline-none"
                />
                <input
                  type="text"
                  name="smtp_port"
                  value={settings.smtp_port}
                  onChange={handleChange}
                  className="w-16 p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono focus:border-[#5e6ad2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f9e] mb-1">App Password</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={smtpPasswordDraft}
                  onChange={(e) => setSmtpPasswordDraft(e.target.value)}
                  className="flex-1 p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] font-mono focus:border-[#5e6ad2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestEmailConnection}
                  disabled={testingEmail}
                  className="px-3 py-2 bg-[#161922] hover:bg-[#1f2430] border border-[#282f40] text-[#ededef] rounded-md text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
                >
                  {testingEmail ? 'Testing...' : 'Test SMTP'}
                </button>
              </div>
            </div>
          </div>
          {emailTestResult && (
            <p className={`text-xs ${emailTestResult.success ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
              {emailTestResult.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;
