import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Search, Smartphone, ChevronDown, Check } from 'lucide-react';
import { getSearchQueries } from '../services/api';

const Header = ({ title, onRunSearch, isSearching, healthStatus, onOpenMobileModal }) => {
  const [selectedQueryId, setSelectedQueryId] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [configuredQueries, setConfiguredQueries] = useState([]);
  const [isQueryDropdownOpen, setIsQueryDropdownOpen] = useState(false);

  useEffect(() => {
    getSearchQueries().then((res) => {
      if (res.success) {
        setConfiguredQueries(res.search_queries || []);
      }
    }).catch(() => {});
  }, []);

  const selectedQueryObj = configuredQueries.find((q) => String(q.id) === String(selectedQueryId));

  const handleTriggerRun = (e) => {
    if (e) e.preventDefault();
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
    <header className="h-14 bg-[#090a0f] border-b border-[#1f2430] px-5 md:px-8 flex items-center justify-between shrink-0 gap-4 z-30 select-none">
      {/* Title & Quick Status Indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileModal}
          className="md:hidden p-1.5 rounded-md bg-[#161922] border border-[#282f40] text-[#8a8f9e] hover:text-[#ededef]"
          aria-label="Connect Mobile Device"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[#ededef] tracking-tight">{title}</h1>
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" title="Engine Connected" />
        </div>
      </div>

      {/* Mobile Top Scan Trigger */}
      <div className="flex md:hidden items-center">
        <button
          type="button"
          onClick={() => onRunSearch({})}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ededef] hover:bg-white text-[#090a0f] text-xs font-semibold disabled:opacity-50 min-h-[36px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
          <span>{isSearching ? 'Scanning' : 'Scan'}</span>
        </button>
      </div>

      {/* Desktop Search Palette Strip */}
      <form onSubmit={handleTriggerRun} className="hidden md:flex items-center gap-2 max-w-xl flex-1 justify-end">
        {/* Custom Headless Query Selector Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQueryDropdownOpen(!isQueryDropdownOpen)}
            className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0f1117] hover:bg-[#161922] border border-[#1f2430] rounded-md text-xs text-[#8a8f9e] hover:text-[#ededef] transition-colors max-w-[200px]"
          >
            <span className="truncate">
              {selectedQueryObj ? selectedQueryObj.name : 'All Active Queries'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </button>

          {isQueryDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsQueryDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#0f1117] border border-[#282f40] rounded-md shadow-xl py-1 z-50 text-xs max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQueryId('');
                    setIsQueryDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#161922] text-[#ededef]"
                >
                  <span className="truncate">All Active Queries</span>
                  {!selectedQueryId && <Check className="w-3.5 h-3.5 text-[#5e6ad2]" />}
                </button>
                {configuredQueries.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQueryId(String(q.id));
                      setTypedQuery('');
                      setIsQueryDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#161922] text-[#8a8f9e] hover:text-[#ededef]"
                  >
                    <span className="truncate">{q.name}</span>
                    {String(selectedQueryId) === String(q.id) && (
                      <Check className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Query Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#555a68] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Type quick search phrase..."
            value={typedQuery}
            onChange={(e) => {
              setTypedQuery(e.target.value);
              if (e.target.value) setSelectedQueryId('');
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0f1117] border border-[#1f2430] rounded-md text-xs text-[#ededef] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none transition-colors"
          />
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ededef] hover:bg-white text-[#090a0f] text-xs font-semibold transition-all disabled:opacity-50 shrink-0 shadow-sm"
        >
          <Play className={`w-3 h-3 fill-current ${isSearching ? 'animate-pulse' : ''}`} />
          <span>{isSearching ? 'Scanning...' : 'Execute Scan'}</span>
        </button>
      </form>
    </header>
  );
};

export default Header;
