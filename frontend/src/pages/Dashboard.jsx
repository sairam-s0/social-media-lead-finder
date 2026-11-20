import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Play, 
  ArrowUpRight,
  Globe,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { getStats, getLeads, updateLead } from '../services/api';
import LeadTable from '../components/LeadTable';

const Dashboard = ({ onSelectLead, onRunSearch, isSearching }) => {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, leadsRes] = await Promise.all([
        getStats(),
        getLeads({ limit: 8 })
      ]);

      if (statsRes.success) setStats(statsRes);
      if (leadsRes.success) setRecentLeads(leadsRes.leads || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('lead_data_updated', handleUpdate);
    return () => window.removeEventListener('lead_data_updated', handleUpdate);
  }, []);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-[#8a8f9e] flex items-center justify-center" role="status">
        <div className="flex items-center gap-2 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#5e6ad2]" />
          <span>Refreshing analytics...</span>
        </div>
      </div>
    );
  }

  const total = stats?.total_leads || 0;
  const newLeads = stats?.new_leads || 0;
  const qualified = stats?.qualified_leads || 0;
  const contacted = stats?.contacted_leads || 0;

  // Calculate percentages for progress bars
  const totalSafe = total > 0 ? total : 1;
  const newPct = Math.round((newLeads / totalSafe) * 100);
  const qualifiedPct = Math.round((qualified / totalSafe) * 100);
  const contactedPct = Math.round((contacted / totalSafe) * 100);

  return (
    <div className="space-y-6">
      {/* Precision KPI Metrics Strip (Attio / Linear metric modules) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Discovered */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8a8f9e]">
            <span className="font-medium">Total Inquiries</span>
            <span className="text-[10px] font-mono text-[#555a68]">Cumulative</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#ededef] tabular-nums">{total}</span>
            <div className="w-full bg-[#161922] h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#ededef] h-full" style={{ width: '100%' }} />
            </div>
            <span className="text-[11px] text-[#555a68] mt-1.5 block">Stored in local database</span>
          </div>
        </div>

        {/* New Leads */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8a8f9e]">
            <span className="font-medium">Unreviewed Leads</span>
            <span className="text-[10px] font-mono text-[#38bdf8] font-semibold">{newPct}% pool</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#38bdf8] tabular-nums">{newLeads}</span>
            <div className="w-full bg-[#161922] h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#38bdf8] h-full transition-all" style={{ width: `${newPct}%` }} />
            </div>
            <span className="text-[11px] text-[#555a68] mt-1.5 block">Pending outreach or status</span>
          </div>
        </div>

        {/* Contacted */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8a8f9e]">
            <span className="font-medium">In Outreach</span>
            <span className="text-[10px] font-mono text-[#fbbf24] font-semibold">{contactedPct}% pool</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#fbbf24] tabular-nums">{contacted}</span>
            <div className="w-full bg-[#161922] h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#fbbf24] h-full transition-all" style={{ width: `${contactedPct}%` }} />
            </div>
            <span className="text-[11px] text-[#555a68] mt-1.5 block">Message dispatched</span>
          </div>
        </div>

        {/* Qualified */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8a8f9e]">
            <span className="font-medium">Verified Opportunities</span>
            <span className="text-[10px] font-mono text-[#34d399] font-semibold">{qualifiedPct}% pool</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#34d399] tabular-nums">{qualified}</span>
            <div className="w-full bg-[#161922] h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#34d399] h-full transition-all" style={{ width: `${qualifiedPct}%` }} />
            </div>
            <span className="text-[11px] text-[#555a68] mt-1.5 block">High intent matches</span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid (Linear-Style High Density Progress Rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Platform Sources */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2">
            <span className="text-xs font-semibold text-[#ededef]">Source Distribution</span>
            <span className="text-[10px] font-mono text-[#555a68]">Verified Posts</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {stats?.by_source && stats.by_source.length > 0 ? (
              stats.by_source.map((item) => {
                const count = item.count;
                const pct = Math.round((count / totalSafe) * 100);
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8a8f9e]">{item.source}</span>
                      <span className="font-mono text-[#ededef] font-medium tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#161922] h-1 rounded-full overflow-hidden">
                      <div className="bg-[#5e6ad2] h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#555a68]">No platform breakdown available.</p>
            )}
          </div>
        </div>

        {/* Service Demand Breakdown */}
        <div className="p-4 bg-[#0f1117] border border-[#1f2430] rounded-lg space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#1f2430] pb-2">
            <span className="text-xs font-semibold text-[#ededef]">Service Demand Breakdown</span>
            <span className="text-[10px] font-mono text-[#555a68]">Keywords & Categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
            {stats?.by_service && stats.by_service.length > 0 ? (
              stats.by_service.slice(0, 8).map((item) => {
                const count = item.count;
                const pct = Math.round((count / totalSafe) * 100);
                return (
                  <div key={item.service} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8a8f9e] truncate pr-2">{item.service}</span>
                      <span className="font-mono text-[#ededef] font-medium shrink-0 tabular-nums">{count}</span>
                    </div>
                    <div className="w-full bg-[#161922] h-1 rounded-full overflow-hidden">
                      <div className="bg-[#38bdf8] h-full" style={{ width: `${Math.min(pct * 2, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#555a68]">No service categorizations recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Discovered Leads Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#1f2430] pb-2">
          <div>
            <h3 className="text-xs font-semibold text-[#ededef] uppercase tracking-wider">Recent Opportunities</h3>
            <p className="text-[11px] text-[#8a8f9e]">High-intent posts seeking marketing, development, or agency services</p>
          </div>

          <button
            type="button"
            onClick={() => onRunSearch({})}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-[#1f2430] text-[#ededef] border border-[#282f40] rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Play className={`w-3 h-3 fill-current ${isSearching ? 'animate-pulse text-[#5e6ad2]' : ''}`} />
            <span>{isSearching ? 'Executing Scan...' : 'Trigger Scan Now'}</span>
          </button>
        </div>

        <LeadTable
          leads={recentLeads}
          onSelectLead={onSelectLead}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;
