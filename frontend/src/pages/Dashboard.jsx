import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, Zap, TrendingUp, PieChart as PieIcon, Layers, Play } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import StatCard from '../components/StatCard';
import LeadTable from '../components/LeadTable';
import { getStats, getLeads, updateLead } from '../services/api';

const Dashboard = ({ onSelectLead, onRunSearch, isSearching }) => {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, leadsRes] = await Promise.all([
        getStats(),
        getLeads({ limit: 5 })
      ]);

      if (statsRes.success) setStats(statsRes);
      if (leadsRes.success) setRecentLeads(leadsRes.leads);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for custom update events when search runs
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
      <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          color="indigo"
          subtitle="Real leads in database"
        />
        <StatCard
          title="New Leads"
          value={stats?.new_leads || 0}
          icon={Zap}
          color="emerald"
          subtitle="Pending review"
        />
        <StatCard
          title="Today's Leads"
          value={stats?.today || 0}
          icon={Calendar}
          color="amber"
          subtitle="Discovered in last 24h"
        />
        <StatCard
          title="Qualified Leads"
          value={stats?.qualified_leads || 0}
          icon={UserCheck}
          color="purple"
          subtitle="High-intent opportunities"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Leads Over Time Chart */}
        <div className="glass-card p-4 md:p-6 rounded-2xl border border-slate-800 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm md:text-base font-bold text-white">Leads Over Time</h3>
            </div>
            <span className="text-[11px] md:text-xs text-slate-400">Last 7 Days</span>
          </div>
          <div className="h-52 md:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.over_time || []}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Service Category Bar Chart */}
        <div className="glass-card p-4 md:p-6 rounded-2xl border border-slate-800 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm md:text-base font-bold text-white">Leads by Category</h3>
            </div>
            <span className="text-[11px] md:text-xs text-slate-400">Real Category Breakdown</span>
          </div>
          <div className="h-52 md:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.by_service || []}>
                <XAxis dataKey="service" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Leads Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Recent Potential Leads</h3>
          {onRunSearch && (
            <button
              onClick={() => onRunSearch({})}
              disabled={isSearching}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isSearching ? 'Searching...' : 'Run Auto-Search Now'}</span>
            </button>
          )}
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
