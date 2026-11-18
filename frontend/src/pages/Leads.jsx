import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, X, Tag, Download, Loader2 } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import { getLeads, updateLead, exportLeads } from '../services/api';

const Leads = ({ onSelectLead }) => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Quick preset keyword chips for convenience
  const quickKeywordChips = [
    'Digital Marketing',
    'SEO',
    'Social Media',
    'Web Development',
    'Google Ads',
    'Lead Generation',
    'Job',
    'Hiring',
    'Agency',
    'Freelancer'
  ];

  const fetchLeadsData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const res = await getLeads({
        page: pageNumber,
        limit: pagination.limit,
        search,
        keyword,
        status,
        source,
        location
      });
      if (res.success) {
        setLeads(res.leads);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData(1);

    const handleDataUpdate = () => {
      fetchLeadsData(1);
    };
    window.addEventListener('lead_data_updated', handleDataUpdate);
    return () => window.removeEventListener('lead_data_updated', handleDataUpdate);
  }, [status, source]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeadsData(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setKeyword('');
    setStatus('');
    setSource('');
    setLocation('');
    fetchLeadsData(1);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      fetchLeadsData(pagination.page);
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportLeads('csv');
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportLeads('xlsx');
    } catch (err) {
      alert('Excel export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters Bar */}
      <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          {/* Main Search Row */}
          <div className="flex items-center gap-2">
            {/* Search Query Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search leads, companies, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none placeholder:text-slate-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchLeadsData(1);
                  }}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`md:hidden px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showMobileFilters || status || source || keyword
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{(status || source || keyword) ? 'Active' : 'Filters'}</span>
            </button>

            {/* Desktop Apply Button */}
            <button
              type="submit"
              className="hidden md:flex px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          {/* Quick Keyword Suggestion Chips (Swipeable on Mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pr-1">Keywords:</span>
            {quickKeywordChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  if (keyword.toLowerCase() === chip.toLowerCase()) {
                    setKeyword('');
                  } else {
                    setKeyword(chip);
                  }
                  fetchLeadsData(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 border active:scale-95 ${
                  keyword.toLowerCase() === chip.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {keyword.toLowerCase() === chip.toLowerCase() ? `✓ ${chip}` : `+ ${chip}`}
              </button>
            ))}
          </div>

          {/* Secondary Filters & Exports (Collapsible on Mobile, always visible on Desktop) */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150`}>
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none cursor-pointer flex-1 md:flex-none"
            >
              <option value="">All Statuses</option>
              <option value="new">NEW</option>
              <option value="contacted">CONTACTED</option>
              <option value="qualified">QUALIFIED</option>
              <option value="converted">CONVERTED</option>
              <option value="rejected">REJECTED</option>
            </select>

            {/* Source Filter */}
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none cursor-pointer flex-1 md:flex-none"
            >
              <option value="">All Sources</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="Reddit">Reddit</option>
              <option value="Public Web">Public Web</option>
            </select>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              title="Export leads to CSV"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>CSV</span>
            </button>

            {/* Export Excel (.xlsx) Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-sm"
              title="Export leads to Excel"
            >
              {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Excel</span>
            </button>

            {(search || keyword || status || source || location) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Leads Data Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex justify-center glass-card rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <LeadTable
            leads={leads}
            onSelectLead={onSelectLead}
            onStatusChange={handleStatusChange}
          />

          {/* Pagination Bar */}
          <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{leads.length}</span> of <span className="font-semibold text-white">{pagination.total}</span> leads
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeadsData(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-bold text-slate-300 px-2">
                Page {pagination.page} / {pagination.total_pages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchLeadsData(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
