import React, { useState, useEffect } from 'react';
import { Zap, Play, Clock, RefreshCw, Power } from 'lucide-react';
import { getSettings, updateSettings, getSearchQueries, updateSearchQuery } from '../services/api';

const Automation = ({ onRunSearch, isSearching }) => {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInterval, setIsSavingInterval] = useState(false);

  const fetchAutomationData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, queriesRes] = await Promise.all([
        getSettings(),
        getSearchQueries()
      ]);
      if (settingsRes.success) {
        setAutomationStatus(settingsRes.automation_status);
        if (settingsRes.settings?.search_interval_minutes) {
          setIntervalMinutes(settingsRes.settings.search_interval_minutes);
        }
      }
      if (queriesRes.success) setQueries(queriesRes.search_queries || []);
    } catch (err) {
      console.error('Failed to fetch automation settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const handleUpdateInterval = async (newMinutes) => {
    try {
      setIsSavingInterval(true);
      setIntervalMinutes(String(newMinutes));
      await updateSettings({ search_interval_minutes: String(newMinutes) });
      fetchAutomationData();
    } catch (err) {
      console.error('Failed to update interval:', err);
    } finally {
      setIsSavingInterval(false);
    }
  };

  const handleToggleQuery = async (queryObj) => {
    try {
      await updateSearchQuery(queryObj.id, { enabled: !queryObj.enabled });
      fetchAutomationData();
    } catch (err) {
      console.error('Failed to toggle query:', err);
    }
  };

  const scheduleFrequencies = [
    { label: '15m', value: '15' },
    { label: '30m', value: '30' },
    { label: '1h', value: '60' },
    { label: '2h', value: '120' },
    { label: '6h', value: '360' },
    { label: '12h', value: '720' },
    { label: '24h', value: '1440' },
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[#8a8f9e] flex items-center justify-center" role="status">
        <div className="flex items-center gap-2 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#5e6ad2]" />
          <span>Loading automation state...</span>
        </div>
      </div>
    );
  }

  const isSchedulerRunning = automationStatus?.running || false;

  return (
    <div className="space-y-4">
      {/* Background Engine Row */}
      <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#ededef]">Continuous Background Engine</h2>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
              isSchedulerRunning ? 'bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20' : 'bg-[#fbbf24]/10 text-[#fbbf24]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSchedulerRunning ? 'bg-[#34d399]' : 'bg-[#fbbf24]'}`} />
              {isSchedulerRunning ? 'Running' : 'Standby'}
            </span>
          </div>
          <p className="text-xs text-[#8a8f9e] mt-0.5">
            APScheduler executes all enabled queries at your chosen cadence.
          </p>
        </div>

        {/* Frequency Selector Buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#555a68] mr-1.5 hidden sm:inline">Interval:</span>
          {scheduleFrequencies.map((f) => {
            const isSelected = intervalMinutes === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleUpdateInterval(f.value)}
                disabled={isSavingInterval}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  isSelected
                    ? 'bg-[#161922] text-[#ededef] border border-[#5e6ad2] font-semibold'
                    : 'bg-[#090a0f] text-[#8a8f9e] border border-[#1f2430] hover:text-[#ededef]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Immediate Pipeline Trigger */}
      <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-[#ededef]">Manual Run All Queries</h3>
          <p className="text-[11px] text-[#8a8f9e]">Execute the complete pipeline immediately across all active queries.</p>
        </div>

        <button
          type="button"
          onClick={() => onRunSearch({})}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] rounded text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Play className={`w-3 h-3 fill-current ${isSearching ? 'animate-pulse' : ''}`} />
          <span>{isSearching ? 'Executing Scan...' : 'Trigger Pipeline'}</span>
        </button>
      </div>

      {/* Target Queries Automation Inclusion List */}
      <div className="bg-[#0f1117] border border-[#1f2430] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0b0d13] border-b border-[#1f2430] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#ededef]">Queries Included in Scheduled Discovery</span>
          <span className="text-[10px] font-mono text-[#8a8f9e]">{queries.length} total</span>
        </div>

        <div className="divide-y divide-[#181c26]">
          {queries.map((q) => (
            <div
              key={q.id}
              className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-[#141720] transition-colors"
            >
              <div className="min-w-0 pr-3">
                <span className="font-medium text-[#ededef] text-xs block truncate">{q.name}</span>
                <span className="font-mono text-[11px] text-[#8a8f9e] block truncate mt-0.5">{q.query}</span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleQuery(q)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 transition-colors ${
                  q.enabled
                    ? 'bg-[#161922] text-[#34d399] border-[#1f2430]'
                    : 'bg-[#090a0f] text-[#555a68] border-[#1f2430]'
                }`}
              >
                {q.enabled ? 'Scheduled' : 'Excluded'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Automation;
