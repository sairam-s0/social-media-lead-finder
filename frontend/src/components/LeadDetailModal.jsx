import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Building, 
  User, 
  MapPin, 
  Tag, 
  Calendar, 
  MessageSquare, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { deleteLead } from '../services/api';
import { normalizePostUrl, openExternalUrl } from '../utils/urlHelper';

const LeadDetailModal = ({ lead, onClose, onUpdateStatus, onSaveNotes, onDeleteLead }) => {
  const [notesText, setNotesText] = useState(lead?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    setIsDeleting(true);
    try {
      await deleteLead(lead.id);
      if (onDeleteLead) onDeleteLead(lead.id);
      onClose();
    } catch (err) {
      alert('Failed to delete lead: ' + (err.response?.data?.error || err.message));
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end md:items-stretch justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-none max-h-[90vh] md:max-h-full h-[90vh] md:h-full flex flex-col justify-between shadow-2xl overflow-y-auto">
        {/* Mobile Pull Indicator */}
        <div className="md:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{lead.company_name}</h2>
              <p className="text-xs text-slate-400">{lead.service} Lead • {lead.source}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Quick Actions Header */}
          <div className="p-4 rounded-xl glass-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {lead.status}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onUpdateStatus(lead.id, 'contacted')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer"
              >
                Mark Contacted
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'qualified')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
              >
                Mark Qualified
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'converted')}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors cursor-pointer"
              >
                Mark Converted
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'rejected')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Contact Person
              </span>
              <p className="font-semibold text-white text-sm">{lead.author_name}</p>
              <p className="text-xs text-slate-400">{lead.author_role}</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Location
              </span>
              <p className="font-semibold text-white text-sm">{lead.location}</p>
              <p className="text-xs text-slate-400">Target Region</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Published Date
              </span>
              <p className="font-semibold text-white text-sm">{lead.published_at || 'Recently'}</p>
              <p className="text-xs text-slate-500">Discovered: {lead.discovered_at ? new Date(lead.discovered_at).toLocaleDateString() : 'N/A'}</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" /> Matched Intent Keywords
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(lead.matched_keywords || '').split(',').map((kw, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                    {typeof kw === 'string' ? kw.trim() : kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Full Post Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Full Post Content</span>
              <a
                href={normalizePostUrl(lead.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-normal cursor-pointer"
                onClick={(e) => openExternalUrl(lead.url, e)}
              >
                Open Original Post <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <div className="p-4 rounded-xl glass-card text-sm text-slate-300 whitespace-pre-wrap leading-relaxed border-l-2 border-l-indigo-500">
              {lead.content || lead.title}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Lead Notes
            </h3>
            <textarea
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add internal notes about outreach attempt, deal size, or requirements..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* GDPR / DPDP Lead Erasure Option */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-red-300 block">GDPR / DPDP Right to Erasure</span>
              <span className="text-[11px] text-slate-400">Permanently delete this prospect's data from your local database</span>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                confirmDelete 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                  : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Confirm Permanent Delete?' : 'Delete Lead'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
          <a
            href={normalizePostUrl(lead.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            onClick={(e) => openExternalUrl(lead.url, e)}
          >
            <span>Open Original Post</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
