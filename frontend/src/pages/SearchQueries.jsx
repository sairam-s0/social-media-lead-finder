import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Play, RefreshCw, Terminal, Check, Globe } from 'lucide-react';
import SearchQueryModal from '../components/SearchQueryModal';
import { getSearchQueries, createSearchQuery, updateSearchQuery, deleteSearchQuery, triggerFullSearchPipeline } from '../services/api';

const SearchQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningQueryId, setRunningQueryId] = useState(null);
  const [filterText, setFilterText] = useState('');

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      const res = await getSearchQueries();
      if (res.success) setQueries(res.search_queries || []);
    } catch (err) {
      console.error('Failed to fetch search queries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedQuery(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q) => {
    setSelectedQuery(q);
    setIsModalOpen(true);
  };

  const handleSaveQuery = async (formData) => {
    try {
      if (selectedQuery) {
        await updateSearchQuery(selectedQuery.id, formData);
      } else {
        await createSearchQuery(formData);
      }
      setIsModalOpen(false);
      fetchQueries();
    } catch (err) {
      console.error('Failed to save search query:', err);
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      await updateSearchQuery(q.id, { enabled: !q.enabled });
      fetchQueries();
    } catch (err) {
      console.error('Failed to toggle search query:', err);
    }
  };

  const handleRunSingleQuery = async (queryId) => {
    try {
      setRunningQueryId(queryId);
      await triggerFullSearchPipeline({ queryId });
      fetchQueries();
    } catch (err) {
      console.error('Failed to run single search query:', err);
    } finally {
      setRunningQueryId(null);
    }
  };

  const handleDeleteQuery = async (id) => {
    if (window.confirm('Delete this search query?')) {
      try {
        await deleteSearchQuery(id);
        fetchQueries();
      } catch (err) {
        console.error('Failed to delete search query:', err);
      }
    }
  };

  const filteredQueries = queries.filter((q) => {
    if (!filterText) return true;
    const term = filterText.toLowerCase();
    return (
      (q.name && q.name.toLowerCase().includes(term)) ||
      (q.query && q.query.toLowerCase().includes(term)) ||
      (q.source && q.source.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2430] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#ededef]">Search Query Directory</h2>
            <span className="text-xs font-mono text-[#8a8f9e] bg-[#161922] px-2 py-0.5 rounded border border-[#1f2430]">
              {queries.length} configured
            </span>
          </div>
          <p className="text-xs text-[#8a8f9e] mt-0.5">
            Target phrases and search operators scanned across public social posts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#555a68] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter queries..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#0f1117] border border-[#1f2430] rounded-md text-xs text-[#ededef] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none w-48"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] text-xs font-semibold rounded-md transition-colors min-h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Query</span>
          </button>
        </div>
      </div>

      {/* Structured Query List (Linear/Attio Style High-Density Table) */}
      {isLoading ? (
        <div className="p-12 text-center text-[#8a8f9e] flex items-center justify-center" role="status">
          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-[#5e6ad2]" />
            <span>Loading query directory...</span>
          </div>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="p-8 text-center text-[#8a8f9e] bg-[#0f1117] rounded-lg border border-[#1f2430]">
          <p className="text-sm font-medium text-[#ededef]">No search queries found</p>
          <p className="text-xs text-[#8a8f9e] mt-1">
            {filterText ? 'No queries matched your search term.' : 'Add your first query to begin discovering leads.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0f1117] border border-[#1f2430] rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-[#1f2430] bg-[#0b0d13] text-[11px] font-medium text-[#8a8f9e] uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-3">Target Name</div>
            <div className="col-span-5 sm:col-span-6">Query String (Command)</div>
            <div className="hidden sm:block sm:col-span-1">Source</div>
            <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-[#181c26]">
            {filteredQueries.map((q) => {
              const isRunning = runningQueryId === q.id;
              return (
                <div
                  key={q.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-[#141720] transition-colors text-xs"
                >
                  {/* Name & Active Indicator */}
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(q)}
                      className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${
                        q.enabled ? 'bg-[#34d399]' : 'bg-[#555a68]'
                      }`}
                      title={q.enabled ? 'Active (Click to pause)' : 'Paused (Click to activate)'}
                      aria-label={q.enabled ? 'Pause query' : 'Activate query'}
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-[#ededef] block truncate">{q.name}</span>
                      <span className="text-[10px] text-[#555a68] sm:hidden block truncate">{q.source}</span>
                    </div>
                  </div>

                  {/* Query Command String (Explicit text preview) */}
                  <div className="col-span-5 sm:col-span-6 font-mono text-[11px] text-[#8a8f9e] bg-[#090a0f] px-2.5 py-1 rounded border border-[#181c26] truncate">
                    {q.query || (
                      <span className="text-[#555a68] italic">No query command text set</span>
                    )}
                  </div>

                  {/* Source Platform */}
                  <div className="hidden sm:block sm:col-span-1 text-xs text-[#8a8f9e] truncate">
                    {q.source || 'All'}
                  </div>

                  {/* Contextual Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRunSingleQuery(q.id)}
                      disabled={isRunning}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#161922] hover:bg-[#1f2430] text-[#ededef] border border-[#282f40] rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                      title="Execute this specific query now"
                    >
                      <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-pulse text-[#5e6ad2]' : ''}`} />
                      <span className="hidden md:inline">{isRunning ? 'Running' : 'Run'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 text-[#8a8f9e] hover:text-[#ededef] hover:bg-[#161922] rounded transition-colors"
                      title="Edit query"
                      aria-label="Edit query"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuery(q.id)}
                      className="p-1.5 text-[#8a8f9e] hover:text-[#f87171] hover:bg-[#161922] rounded transition-colors"
                      title="Delete query"
                      aria-label="Delete query"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <SearchQueryModal
          isOpen={isModalOpen}
          initialData={selectedQuery}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveQuery}
        />
      )}
    </div>
  );
};

export default SearchQueries;
