import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Power, Play, RefreshCw } from 'lucide-react';
import SearchQueryModal from '../components/SearchQueryModal';
import { getSearchQueries, createSearchQuery, updateSearchQuery, deleteSearchQuery, triggerFullSearchPipeline } from '../services/api';

const SearchQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningQueryId, setRunningQueryId] = useState(null);

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      const res = await getSearchQueries();
      if (res.success) setQueries(res.search_queries);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Search Query Management</h2>
          <p className="text-xs text-slate-400 font-normal">
            Configure target search terms. Click <strong className="text-indigo-400">"Run This Query"</strong> to execute ONLY that specific query.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Search Query</span>
        </button>
      </div>

      {/* Query List */}
      {isLoading ? (
        <div className="p-12 text-center flex justify-center glass-card rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (Optimized for Android Screens) */}
          <div className="md:hidden space-y-3">
            {queries.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 shadow-lg"
              >
                {/* Header: Name, Platform, and Status Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate tracking-tight">{q.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {q.source}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Leads: <strong className="text-emerald-400">{q.leads_found_count || 0}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(q)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                      q.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {q.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                {/* Query String Display */}
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800/80 break-words leading-relaxed">
                  {q.query}
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  <button
                    onClick={() => handleRunSingleQuery(q.id)}
                    disabled={runningQueryId === q.id}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {runningQueryId === q.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{runningQueryId === q.id ? 'Running...' : 'Run Only This'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-90 transition-all"
                      title="Edit Query"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(q.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 active:scale-90 transition-all"
                      title="Delete Query"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto rounded-2xl glass-card border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Query Name</th>
                  <th className="py-4 px-5">Search Query String</th>
                  <th className="py-4 px-5">Source</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Results</th>
                  <th className="py-4 px-5">Leads Found</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {queries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-bold text-white text-sm">{q.name}</td>
                    <td className="py-4 px-5 font-mono text-xs text-indigo-300 max-w-xs truncate">{q.query}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {q.source}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <button
                        onClick={() => handleToggleStatus(q)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          q.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {q.enabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-300">{q.results_count || 0}</td>
                    <td className="py-4 px-5 text-xs font-bold text-emerald-400">{q.leads_found_count || 0}</td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleRunSingleQuery(q.id)}
                        disabled={runningQueryId === q.id}
                        title="Run ONLY this query"
                        className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors cursor-pointer text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {runningQueryId === q.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        <span>Run Only This</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuery(q.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Integration */}
      <SearchQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveQuery}
        initialData={selectedQuery}
      />
    </div>
  );
};

export default SearchQueries;
