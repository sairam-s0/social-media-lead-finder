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
    if (!name.trim() || !query.trim()) return;
    onSave({ name: name.trim(), query: query.trim(), source, enabled });
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-query-title"
      className="fixed inset-0 z-50 bg-[#090a0f]/80 flex items-center justify-center p-4 animate-in fade-in duration-100"
    >
      <div className="w-full max-w-lg bg-[#0f1117] rounded-lg border border-[#282f40] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f2430] pb-3">
          <h3 id="modal-query-title" className="text-sm font-semibold text-[#ededef]">
            {initialData ? 'Edit Target Query' : 'New Target Query'}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-[#8a8f9e] hover:text-[#ededef] rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="query-name" className="block text-[#8a8f9e] mb-1 font-medium">Query Name</label>
            <input
              id="query-name"
              type="text"
              required
              placeholder="e.g. SEO Agency - Looking For"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="query-command" className="block text-[#8a8f9e] mb-1 font-medium">Search Query Command</label>
            <textarea
              id="query-command"
              required
              rows={3}
              placeholder='e.g. site:linkedin.com/posts "looking for a digital marketing agency"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2.5 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef] font-mono text-[11px] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none"
            />
            <p className="text-[11px] text-[#555a68] mt-1">
              Supports Google & Exa search operators like <code>site:</code> and quotes for exact matching.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="query-source" className="block text-[#8a8f9e] mb-1 font-medium">Platform</label>
              <select
                id="query-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter / X</option>
                <option value="Reddit">Reddit</option>
                <option value="Web">Public Web</option>
              </select>
            </div>

            <div>
              <label htmlFor="query-status" className="block text-[#8a8f9e] mb-1 font-medium">Status</label>
              <select
                id="query-status"
                value={enabled ? 'true' : 'false'}
                onChange={(e) => setEnabled(e.target.value === 'true')}
                className="w-full p-2 bg-[#090a0f] border border-[#1f2430] rounded-md text-[#ededef] focus:border-[#5e6ad2] focus:outline-none"
              >
                <option value="true">Active & Scheduled</option>
                <option value="false">Paused</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f2430]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#161922] hover:bg-[#1f2430] text-[#8a8f9e] hover:text-[#ededef] rounded-md text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] rounded-md text-xs font-semibold transition-colors"
            >
              {initialData ? 'Save Changes' : 'Create Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchQueryModal;
