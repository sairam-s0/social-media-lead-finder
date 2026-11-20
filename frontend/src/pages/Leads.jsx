import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Download, 
  FileSpreadsheet
} from 'lucide-react';
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
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const quickKeywordChips = [
    'Digital Marketing',
    'SEO',
    'Web Development',
    'Google Ads',
    'Lead Generation',
    'Agency'
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
        setLeads(res.leads || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, total_pages: 1 });
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

  const handleExport = async (format = 'csv') => {
    if (format === 'excel') setIsExportingExcel(true);
    else setIsExportingCSV(true);

    try {
      await exportLeads(format);
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingCSV(false);
      setIsExportingExcel(false);
    }
  };

  const activeFiltersCount = [keyword, status, source, location].filter(Boolean).length;

  return (
    <div className="space-y-3.5">
      {/* Top Filter & Command Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#555a68] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company, title, or post text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0f1117] border border-[#1f2430] rounded-md text-xs text-[#ededef] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              activeFiltersCount > 0
                ? 'bg-[#161922] text-[#ededef] border-[#5e6ad2]'
                : 'bg-[#0f1117] text-[#8a8f9e] border-[#1f2430] hover:text-[#ededef]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>
        </form>

        {/* Data Exports */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={isExportingCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f1117] hover:bg-[#161922] border border-[#1f2430] rounded-md text-[11px] text-[#8a8f9e] hover:text-[#ededef] transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            <span>{isExportingCSV ? 'CSV...' : 'CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={isExportingExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f1117] hover:bg-[#161922] border border-[#1f2430] rounded-md text-[11px] text-[#8a8f9e] hover:text-[#ededef] transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#34d399]" />
            <span>{isExportingExcel ? 'Excel...' : 'Excel'}</span>
          </button>
        </div>
      </div>

      {/* Quick Service Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
        <span className="text-[11px] text-[#555a68] font-mono mr-1">Filter:</span>
        {quickKeywordChips.map((chip) => {
          const isSelected = keyword === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => {
                const newK = isSelected ? '' : chip;
                setKeyword(newK);
                fetchLeadsData(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 ${
                isSelected
                  ? 'bg-[#161922] text-[#ededef] border border-[#5e6ad2]'
                  : 'bg-[#0f1117] text-[#8a8f9e] border border-[#1f2430] hover:text-[#ededef]'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Leads Table Component */}
      {isLoading ? (
        <div className="p-12 text-center text-[#8a8f9e] flex items-center justify-center bg-[#0f1117] border border-[#1f2430] rounded-lg" role="status">
          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-[#5e6ad2]" />
            <span>Loading leads...</span>
          </div>
        </div>
      ) : (
        <LeadTable
          leads={leads}
          onSelectLead={onSelectLead}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-2 py-2 text-xs text-[#8a8f9e]">
          <span>
            Page <strong className="text-[#ededef]">{pagination.page}</strong> of <strong className="text-[#ededef]">{pagination.total_pages}</strong> ({pagination.total} total leads)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchLeadsData(pagination.page - 1)}
              className="p-1.5 rounded bg-[#0f1117] border border-[#1f2430] text-[#8a8f9e] hover:text-[#ededef] disabled:opacity-40"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => fetchLeadsData(pagination.page + 1)}
              className="p-1.5 rounded bg-[#0f1117] border border-[#1f2430] text-[#8a8f9e] hover:text-[#ededef] disabled:opacity-40"
              aria-label="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal Sheet */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 bg-[#090a0f]/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0f1117] border border-[#282f40] rounded-lg p-4 space-y-3.5 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2430] pb-2.5">
              <span className="font-semibold text-[#ededef]">Filter Leads</span>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="text-[#8a8f9e] hover:text-[#ededef]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[#8a8f9e] mb-1 font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef]"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8a8f9e] mb-1 font-medium">Source Platform</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef]"
                >
                  <option value="">All Platforms</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter">Twitter / X</option>
                  <option value="Reddit">Reddit</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8a8f9e] mb-1 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1f2430]">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 py-1.5 bg-[#161922] text-[#8a8f9e] hover:text-[#ededef] rounded-md font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFiltersModal(false);
                  fetchLeadsData(1);
                }}
                className="flex-1 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] rounded-md font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
