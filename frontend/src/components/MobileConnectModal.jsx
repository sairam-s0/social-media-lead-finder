import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  X, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  QrCode,
  Sliders,
  Server
} from 'lucide-react';
import { getNetworkStatus } from '../services/api';

const MobileConnectModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'advanced'
  const [networkInfo, setNetworkInfo] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced server URL config states
  const [serverUrlDraft, setServerUrlDraft] = useState('');
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const fetchHostNetwork = async () => {
    try {
      setIsLoading(true);
      const res = await getNetworkStatus();
      setNetworkInfo(res);
      
      const hostUrl = res?.mobile_url || (res?.lan_ip ? `http://${res.lan_ip}:${res.port || 5050}` : `http://${window.location.hostname}:5050`);
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(hostUrl)}&margin=10`;
      setQrCodeDataUrl(qrUrl);
    } catch (err) {
      console.warn('Failed to load host network info for QR:', err);
      const fallbackUrl = `http://${window.location.hostname || '127.0.0.1'}:5050`;
      setQrCodeDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(fallbackUrl)}&margin=10`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('api_server_url') || '';
      setServerUrlDraft(saved);
      fetchHostNetwork();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHostUrl = networkInfo?.mobile_url || 
    (networkInfo?.lan_ip ? `http://${networkInfo.lan_ip}:${networkInfo.port || 5050}` : `http://${window.location.hostname || '127.0.0.1'}:5050`);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentHostUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleTestBackendPing = async () => {
    const targetUrl = serverUrlDraft.trim().replace(/\/$/, '');
    if (!targetUrl) {
      setPingResult({ success: true, message: '🟢 Standalone Local Mode active.' });
      return;
    }

    setIsTestingPing(true);
    setPingResult(null);
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${targetUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        setPingResult({
          success: true,
          message: `✅ Connected! Host is reachable (${latency}ms). DB: ${data.database || 'ok'}`
        });
      } else {
        setPingResult({
          success: false,
          message: `⚠️ Server returned HTTP ${res.status}.`
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setPingResult({
        success: false,
        message: `❌ Cannot reach "${targetUrl}". Ensure PC app is running and devices are on the same Wi-Fi.`
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleSaveAdvancedServer = () => {
    const trimmed = serverUrlDraft.trim();
    if (trimmed) {
      localStorage.setItem('api_server_url', trimmed);
    } else {
      localStorage.removeItem('api_server_url');
    }
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Mobile Drag Pill */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-5 md:p-6 pb-0 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
                <span>Connect Mobile Phone</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">Scan QR code or open link on iOS / Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 md:px-6">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'qr'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code & Mobile Web</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'advanced'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Network Settings</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Instant QR Code & Wi-Fi Link */}
        {activeTab === 'qr' && (
          <div className="px-5 md:px-6 space-y-5 pb-6">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-indigo-500/20 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              {isLoading ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                  <span className="text-xs">Discovering Wi-Fi address...</span>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-2xl ring-4 ring-indigo-500/20">
                  <img
                    src={qrCodeDataUrl}
                    alt="Mobile Connect QR Code"
                    className="w-48 h-48 md:w-52 md:h-52 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-red-400 text-xs">
                  Could not generate QR code
                </div>
              )}

              <span className="text-[11px] font-medium text-slate-400 mt-3 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Point your phone camera to open instantly</span>
              </span>
            </div>

            {/* Direct URL Display & 1-Click Copy */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Direct Mobile Browser URL
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={currentHostUrl}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs md:text-sm font-mono text-indigo-300 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* 3 Simple Instructions */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>How Mobile Sync Works</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Ensure your <strong>phone</strong> is connected to the same Wi-Fi / router as this PC.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Scan the QR code with your iPhone or Android camera, or open the URL in Chrome / Safari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>All leads, status updates, and discoveries sync <strong>in real time</strong> with your desktop app!</span>
                </li>
              </ul>
            </div>

            {/* Quick Actions: Open in Browser & Download APK */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={currentHostUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test in Browser</span>
              </a>

              <a
                href="/api/download-apk"
                download="LeadFinder-v2.apk"
                className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
                title="Download Standalone Android APK"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Advanced Backend IP / Sync Settings */}
        {activeTab === 'advanced' && (
          <div className="px-5 md:px-6 space-y-4 pb-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setServerUrlDraft('');
                    setPingResult(null);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    !serverUrlDraft
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">📱 Standalone</span>
                  <span className="text-[9px] text-slate-500">Auto-Detect</span>
                </button>

                {networkInfo?.lan_ip && (
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlDraft(`http://${networkInfo.lan_ip}:${networkInfo.port || 5050}`);
                      setPingResult(null);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      serverUrlDraft.includes(networkInfo.lan_ip)
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">💻 PC LAN</span>
                    <span className="text-[9px] text-slate-500 truncate">{networkInfo.lan_ip}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setServerUrlDraft('http://127.0.0.1:5050');
                    setPingResult(null);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    serverUrlDraft.includes('127.0.0.1')
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">🖥️ Localhost</span>
                  <span className="text-[9px] text-slate-500">127.0.0.1:5050</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Remote Backend URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. http://192.168.1.50:5050"
                  value={serverUrlDraft}
                  onChange={(e) => {
                    setServerUrlDraft(e.target.value);
                    setPingResult(null);
                  }}
                  className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm font-mono text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestBackendPing}
                  disabled={isTestingPing}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isTestingPing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  <span>Test Ping</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty for automatic host discovery. Set explicitly if accessing from an external mobile emulator or custom subnet.
              </p>
            </div>

            {pingResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                pingResult.success
                  ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/50 border border-red-800/80 text-red-300'
              }`}>
                <span className="leading-relaxed">{pingResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setServerUrlDraft('');
                  localStorage.removeItem('api_server_url');
                  onClose();
                  window.location.reload();
                }}
                className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Reset to Auto
              </button>
              <button
                type="button"
                onClick={handleSaveAdvancedServer}
                className="flex-1 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileConnectModal;
