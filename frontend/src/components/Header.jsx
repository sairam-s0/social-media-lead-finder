import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Activity, Search, Smartphone } from 'lucide-react';
import { getSearchQueries } from '../services/api';
import MobileConnectModal from './MobileConnectModal';

const Header = ({ title, onRunSearch, isSearching, healthStatus }) => {
  const [selectedQueryId, setSelectedQueryId] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [configuredQueries, setConfiguredQueries] = useState([]);
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    getSearchQueries().then((res) => {
      if (res.success) {
        setConfiguredQueries(res.search_queries || []);
      }
    }).catch(() => {});
  }, []);

  const handleTriggerRun = () => {
    const cleanTyped = typedQuery.trim();
    if (cleanTyped) {
      onRunSearch({ customQuery: cleanTyped });
    } else if (selectedQueryId) {
      onRunSearch({ queryId: parseInt(selectedQueryId, 10) });
    } else {
      onRunSearch({});
    }
  };

  return (
    <>
      <header className="h-16 glass-panel border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 gap-3 relative z-30">
        {/* Left: Title & Mobile Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowMobileModal(true)}
            className="md:hidden w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0 cursor-pointer active:scale-95 transition"
            title="Connect Mobile / View Network"
          >
            ⚡
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-white tracking-tight truncate">{title}</h1>
            <button
              onClick={() => setShowMobileModal(true)}
              className="flex items-center gap-1.5 md:hidden cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                Desktop & Mobile Sync Active
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Run Search Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => onRunSearch({})}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{isSearching ? 'Searching...' : 'Scan Leads'}</span>
          </button>
        </div>

        {/* Desktop Target Search Execution Bar */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl justify-end">
          <select
            value={selectedQueryId}
            onChange={(e) => {
              setSelectedQueryId(e.target.value);
              if (e.target.value) setTypedQuery('');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none max-w-[180px] truncate cursor-pointer"
          >
            <option value="">-- All Active Queries --</option>
            {configuredQueries.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Type custom query to run..."
              value={typedQuery}
              onChange={(e) => {
                setTypedQuery(e.target.value);
                if (e.target.value) setSelectedQueryId('');
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={handleTriggerRun}
            disabled={isSearching}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Discovery</span>
              </>
            )}
          </button>

          {/* Connect Mobile Phone Button */}
          <button
            onClick={() => setShowMobileModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/25 via-violet-600/20 to-indigo-600/25 border border-indigo-500/40 hover:border-indigo-400 text-xs text-indigo-300 font-semibold shadow-md shadow-indigo-600/10 hover:text-white transition-all duration-200 shrink-0 cursor-pointer active:scale-95"
            title="Connect Mobile Phone (Scan QR Code)"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>📱 Connect Phone</span>
          </button>
        </div>
      </header>

      {/* Mobile Connect & QR Code Modal */}
      <MobileConnectModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />
    </>
  );
};

export default Header;
