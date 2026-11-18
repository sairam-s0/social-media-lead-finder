import React, { useState } from 'react';
import { 
  Key, 
  Building2, 
  Search, 
  Send, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react';
import { activateLicense, updateSettings, testExa, testTelegram } from '../services/api';

export default function FirstRunWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [licenseKey, setLicenseKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('My Agency');
  const [companyTagline, setCompanyTagline] = useState('Automated Social Lead Discovery Engine');
  const [companyLogo, setCompanyLogo] = useState('⚡');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [exaKey, setExaKey] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);

  // Status & Testing State
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [testingLicense, setTestingLicense] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState('');

  const [testingExa, setTestingExa] = useState(false);
  const [exaVerified, setExaVerified] = useState(false);
  const [exaMsg, setExaMsg] = useState('');

  const [testingTg, setTestingTg] = useState(false);
  const [tgVerified, setTgVerified] = useState(false);
  const [tgMsg, setTgMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setLicenseMsg('Please enter a license key.');
      return;
    }
    setTestingLicense(true);
    setLicenseMsg('');
    try {
      const res = await activateLicense(licenseKey.trim(), clientName.trim() || companyName);
      if (res.success) {
        setLicenseVerified(true);
        setLicenseMsg('✓ License activated successfully! (Offline grace period active)');
      } else {
        setLicenseMsg(res.error || 'Activation failed. Please check key.');
      }
    } catch (err) {
      setLicenseMsg(err.response?.data?.error || 'License activation failed.');
    } finally {
      setTestingLicense(false);
    }
  };

  const handleTestExa = async () => {
    if (!exaKey.trim()) {
      setExaMsg('Please enter an Exa API key.');
      return;
    }
    setTestingExa(true);
    setExaMsg('');
    try {
      const res = await testExa(exaKey.trim());
      if (res.success) {
        setExaVerified(true);
        setExaMsg('✓ Exa API connected & verified!');
      } else {
        setExaMsg(res.message || 'Exa test failed.');
      }
    } catch (err) {
      setExaMsg(err.response?.data?.message || 'Connection test failed.');
    } finally {
      setTestingExa(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      setTgMsg('Both Bot Token and Chat ID are required.');
      return;
    }
    setTestingTg(true);
    setTgMsg('');
    try {
      const res = await testTelegram(telegramToken.trim(), telegramChatId.trim());
      if (res.success) {
        setTgVerified(true);
        setTgMsg('✓ Telegram bot verified & test message sent!');
      } else {
        setTgMsg(res.message || 'Telegram test failed.');
      }
    } catch (err) {
      setTgMsg(err.response?.data?.message || 'Telegram test error.');
    } finally {
      setTestingTg(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!tosAccepted) {
      setErrorMsg('You must review and accept the legal and privacy compliance terms to proceed.');
      return;
    }
    setSaving(true);
    setErrorMsg('');

    try {
      // 1. Activate license if provided
      if (licenseKey.trim() && !licenseVerified) {
        await activateLicense(licenseKey.trim(), clientName || companyName);
      }

      // 2. Save settings and vault keys
      const payload = {
        company_name: companyName,
        company_tagline: companyTagline,
        company_logo: companyLogo,
        primary_color: primaryColor,
        telegram_enabled: telegramEnabled ? 'true' : 'false',
        first_run_completed: 'true',
      };

      if (exaKey.trim()) {
        payload.exa_api_key = exaKey.trim();
      }
      if (telegramToken.trim()) {
        payload.telegram_bot_token = telegramToken.trim();
      }
      if (telegramChatId.trim()) {
        payload.telegram_chat_id = telegramChatId.trim();
      }

      await updateSettings(payload);
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save setup configuration.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-100 overflow-hidden my-8">
        
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> First-Run Setup Wizard
            </span>
            <span className="text-xs text-indigo-100 font-medium">Step {step} of {totalSteps}</span>
          </div>
          <h2 className="text-xl font-bold">Welcome to Social Lead Finder</h2>
          <p className="text-xs text-indigo-100 mt-1">Configure your license, branding, search credentials, and compliance in minutes.</p>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-emerald-400' : 'w-4 bg-white/30'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: License Activation */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">1. Software License Activation</h3>
                  <p className="text-xs text-gray-500">Enter your issued client license key with offline grace support.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Client License Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="SLF-PRO-2026-VALD-0001"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleActivateLicense}
                    disabled={testingLicense}
                    className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testingLicense ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Verify
                  </button>
                </div>
                {licenseMsg && (
                  <p className={`text-xs mt-1.5 ${licenseVerified ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                    {licenseMsg}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Licensed Organization / Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Agency Ltd."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Offline Grace Period:</p>
                <p>Once activated, the application continues running offline for up to 14 days without requiring server re-verification.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Client Branding */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">2. Company Profile & Appearance</h3>
                  <p className="text-xs text-gray-500">Personalize your agency name, logo, and theme color.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Logo Icon / Monogram</label>
                  <input
                    type="text"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Theme Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Connect Exa Search API */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">3. Connect Exa Search Engine</h3>
                  <p className="text-xs text-gray-500">Pure Python HTTPS search connection. Enter your Exa API key.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Exa API Key <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={exaKey}
                    onChange={(e) => setExaKey(e.target.value)}
                    placeholder="exa_live_..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestExa}
                    disabled={testingExa || !exaKey.trim()}
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testingExa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Test Connection
                  </button>
                </div>
                {exaMsg && (
                  <p className={`text-xs mt-1.5 ${exaVerified ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                    {exaMsg}
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Where to get your key:</p>
                <p>Register or log in at <strong className="font-mono">dashboard.exa.ai</strong> to create an API key. Your key is stored locally in Windows Credential Manager / encrypted vault and is never exposed or logged.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Telegram Notifications */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">4. Lead Alerts (Telegram)</h3>
                  <p className="text-xs text-gray-500">Optional: Receive instant notifications whenever high-intent leads are found.</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">Enable Telegram Notifications</span>
                  <span className="text-[11px] text-gray-500">Sends alerts for newly parsed leads</span>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {telegramEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Telegram Bot Token</label>
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Telegram Chat ID</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-100123456789 or @channel"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTg || !telegramToken.trim() || !telegramChatId.trim()}
                    className="px-3 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testingTg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Test Telegram Bot
                  </button>

                  {tgMsg && (
                    <p className={`text-xs mt-1.5 ${tgVerified ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                      {tgMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Legal & Privacy Acceptance */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">5. Legal, Privacy & Compliance Agreement</h3>
                  <p className="text-xs text-gray-500">Please review regulatory compliance and data handling guidelines.</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 leading-relaxed">
                <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Compliance Notice (GDPR / DPDP / LinkedIn ToS):
                </p>
                <p>
                  Social Lead Finder processes publicly indexed web search results. By operating this software, you agree to:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-950/90">
                  <li>Respect LinkedIn Terms of Service and data scraping limitations.</li>
                  <li>Comply with applicable privacy statutes (including EU GDPR and India DPDP Act) when storing or contacting prospects.</li>
                  <li>Honor data subject rights including the right to data export and right to erasure (available via the "Delete Lead" and "Export Leads" buttons).</li>
                  <li>Keep software license keys private without unauthorized resale or duplication.</li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-700">
                  I have read, understood, and accept the compliance disclaimer and Terms of Service.
                </span>
              </label>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={saving || !tosAccepted}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Complete Setup & Launch
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
