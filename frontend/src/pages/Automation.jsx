import React, { useState, useEffect } from 'react';
import { Zap, Play, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, Edit, Trash2, Power, Save } from 'lucide-react';
import { getSettings, updateSettings, getSearchQueries, updateSearchQuery, deleteSearchQuery } from '../services/api';

const Automation = ({ onRunSearch, isSearching, searchRunMetrics }) => {
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
      if (queriesRes.success) setQueries(queriesRes.search_queries);
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

  const handleDeleteQuery = async (id) => {
    if (window.confirm('Are you sure you want to delete this search query?')) {
      try {
        await deleteSearchQuery(id);
        fetchAutomationData();
      } catch (err) {
        console.error('Failed to delete query:', err);
      }
    }
  };

  const scheduleOptions = [
    { label: 'Every 15 Mins', value: '15' },
    { label: 'Every 30 Mins', value: '30' },
    { label: 'Every 1 Hour', value: '60' },
    { label: 'Every 2 Hours', value: '120' },
    { label: 'Every 6 Hours', value: '360' },
    { label: 'Every 12 Hours', value: '720' },
    { label: 'Every 24 Hours', value: '1440' },
  ];

  if (isLoading) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Automation Status Metrics Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">APScheduler Background Engine</h2>
              <p className="text-xs text-slate-400">Runs automatically in Python background on your configured schedule</p>
            </div>
          </div>

          <button
            onClick={() => onRunSearch({})}
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Run Search Now</span>
          </button>
        </div>

        {/* Schedule Frequency Controller */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Configure Search Timing Interval</span>
            </div>
            <span className="text-xs text-slate-400">Current Interval: <strong className="text-indigo-400">{intervalMinutes} mins</strong></span>
          </div>

          <div className="flex flex-wrap gap-2">
            {scheduleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleUpdateInterval(opt.value)}
                disabled={isSavingInterval}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  String(intervalMinutes) === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Automation Status</span>
            <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Active & Scheduled
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Next Scheduled Run</span>
            <span className="text-sm font-semibold text-slate-200 block mt-1">
              {automationStatus?.next_run_at ? new Date(automationStatus.next_run_at).toLocaleTimeString() : 'Pending schedule trigger'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Active Search Queries</span>
            <span className="text-lg font-extrabold text-white mt-1 block">
              {queries.filter(q => q.enabled).length} Enabled / {queries.length} Total
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Last Manual Run Metrics</span>
            <span className="text-xs font-semibold text-indigo-400 block mt-1">
              {searchRunMetrics ? `${searchRunMetrics.new_leads_found} new leads (${searchRunMetrics.duration_seconds}s)` : 'No recent manual run'}
            </span>
          </div>
        </div>
      </div>

      {/* Configured Queries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Configured Automated Queries</h3>
          <span className="text-xs text-slate-400">{queries.length} total queries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queries.map((q) => (
            <div key={q.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{q.name}</h4>
                  <span className="text-[11px] text-slate-400">Source: {q.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleQuery(q)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      q.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {q.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                  <button
                    onClick={() => handleDeleteQuery(q.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800/80 truncate">
                {q.query}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Leads Found: <strong className="text-white">{q.leads_found_count || 0}</strong></span>
                <span>Last Executed: {q.last_run_at ? new Date(q.last_run_at).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Automation;
