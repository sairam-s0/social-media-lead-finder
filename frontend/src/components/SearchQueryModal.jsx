import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const SearchQueryModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setQuery(initialData.query || '');
      setSource(initialData.source || 'LinkedIn');
      setEnabled(initialData.enabled !== false);
    } else {
      setName('');
      setQuery('');
      setSource('LinkedIn');
      setEnabled(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, query, source, enabled });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              {initialData ? 'Edit Search Query' : 'Add New Search Query'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Query Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Digital Marketing Agency - Need"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exa Search Query String</label>
            <textarea
              rows={3}
              required
              placeholder='site:linkedin.com/posts "looking for a digital marketing agency"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:border-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Exa operators like site:linkedin.com/posts and exact phrase matching in quotes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Platform</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter / X</option>
                <option value="Reddit">Reddit</option>
                <option value="Public Web">Public Web</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                />
                <span className="text-xs text-slate-300 font-medium">Enable Automatic Search</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Save Query
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchQueryModal;
