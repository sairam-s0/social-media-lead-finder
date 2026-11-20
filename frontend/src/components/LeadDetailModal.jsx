import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Trash2,
  Save,
  Check,
  Building,
  User,
  MapPin,
  Calendar,
  Globe
} from 'lucide-react';
import { deleteLead } from '../services/api';
import { normalizePostUrl, openExternalUrl } from '../utils/urlHelper';

const LeadDetailModal = ({ lead, onClose, onUpdateStatus, onSaveNotes, onDeleteLead }) => {
  const [notesText, setNotesText] = useState(lead?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!lead) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onSaveNotes(lead.id, notesText);
    setIsSavingNotes(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteLead(lead.id);
      if (onDeleteLead) onDeleteLead(lead.id);
      onClose();
    } catch (err) {
      alert('Failed to delete lead: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="lead-modal-title"
      className="fixed inset-0 z-50 bg-[#090a0f]/80 flex items-stretch justify-end animate-in fade-in duration-100"
    >
      <div className="w-full max-w-lg bg-[#0f1117] border-l border-[#1f2430] flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="h-14 px-5 border-b border-[#1f2430] flex items-center justify-between sticky top-0 bg-[#0f1117] z-10">
          <div className="min-w-0 pr-2">
            <h2 id="lead-modal-title" className="text-sm font-semibold text-[#ededef] truncate">
              {lead.company_name}
            </h2>
            <span className="text-[10px] font-mono text-[#8a8f9e]">
              {lead.source} • {lead.service}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8a8f9e] hover:text-[#ededef] rounded transition-colors"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 flex-1 text-xs">
          {/* Status Quick Row */}
          <div className="flex items-center justify-between p-2.5 bg-[#090a0f] border border-[#1f2430] rounded-md">
            <span className="text-[11px] font-medium text-[#8a8f9e]">Pipeline Stage:</span>
            <div className="flex items-center gap-1">
              {['new', 'contacted', 'qualified', 'converted'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateStatus(lead.id, st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                    lead.status === st
                      ? 'bg-[#161922] text-[#ededef] border border-[#5e6ad2] font-semibold'
                      : 'text-[#8a8f9e] hover:text-[#ededef]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Post Snippet */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[#8a8f9e] uppercase tracking-wider">Opportunity Details</span>
            <div className="p-3 bg-[#090a0f] border border-[#1f2430] rounded-md space-y-2">
              <h3 className="font-medium text-[#ededef] leading-snug">{lead.title}</h3>
              {lead.content && (
                <p className="text-[#8a8f9e] text-[11px] leading-relaxed whitespace-pre-wrap">
                  {lead.content}
                </p>
              )}
              {lead.url && (
                <div className="pt-1 border-t border-[#181c26]">
                  <button
                    type="button"
                    onClick={() => openExternalUrl(normalizePostUrl(lead.url, lead.source))}
                    className="inline-flex items-center gap-1 text-[11px] text-[#ededef] hover:underline font-medium"
                  >
                    <span>View original {lead.source} post</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-[#090a0f] border border-[#1f2430] rounded">
              <span className="text-[#555a68] block">Author</span>
              <span className="text-[#ededef] font-medium truncate block mt-0.5">
                {lead.author_name || 'Anonymous'}
              </span>
            </div>

            <div className="p-2.5 bg-[#090a0f] border border-[#1f2430] rounded">
              <span className="text-[#555a68] block">Location</span>
              <span className="text-[#ededef] font-medium truncate block mt-0.5">
                {lead.location || 'Unspecified'}
              </span>
            </div>

            <div className="p-2.5 bg-[#090a0f] border border-[#1f2430] rounded">
              <span className="text-[#555a68] block">Matched Service</span>
              <span className="text-[#ededef] font-medium truncate block mt-0.5">
                {lead.service}
              </span>
            </div>

            <div className="p-2.5 bg-[#090a0f] border border-[#1f2430] rounded">
              <span className="text-[#555a68] block">Discovered</span>
              <span className="text-[#ededef] font-medium truncate block mt-0.5 font-mono">
                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>

          {/* Notes Area */}
          <div className="space-y-1.5">
            <label htmlFor="lead-notes" className="block text-[11px] font-medium text-[#8a8f9e] uppercase tracking-wider">
              Internal Notes
            </label>
            <textarea
              id="lead-notes"
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Record outreach notes or client contact..."
              className="w-full p-2.5 bg-[#090a0f] border border-[#1f2430] rounded-md text-xs text-[#ededef] placeholder-[#555a68] focus:border-[#5e6ad2] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-[#1f2430] text-[#ededef] border border-[#282f40] rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-[#1f2430] bg-[#0f1117] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
              confirmDelete ? 'bg-[#ef4444] text-white' : 'text-[#f87171] hover:bg-[#161922]'
            }`}
          >
            {confirmDelete ? 'Confirm Permanent Delete' : 'Delete Lead'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#ededef] hover:bg-white text-[#090a0f] text-xs font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
