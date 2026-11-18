import React from 'react';
import { ExternalLink, Eye, MapPin, Building, User, Calendar, Tag, ArrowUpRight } from 'lucide-react';
import { normalizePostUrl, normalizeCompanyUrl, openExternalUrl } from '../utils/urlHelper';

const LeadTable = ({ leads, onSelectLead, onStatusChange }) => {
  const statusBadges = {
    new: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    qualified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    converted: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    rejected: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
  };

  const getSourceBadgeColor = (source = '') => {
    const s = source.toLowerCase();
    if (s.includes('linkedin')) return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    if (s.includes('twitter') || s.includes('x')) return 'bg-slate-700/40 text-slate-200 border-slate-600/40';
    if (s.includes('reddit')) return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
    return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center text-slate-500 glass-card rounded-2xl border border-slate-800">
        <Building className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <p className="text-base font-semibold text-slate-300">No matching leads found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try adjusting your filter keywords or tap Discover to scan for new prospective clients.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE FEED VIEW (Optimized for Android Screens & Touch)      */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 rounded-2xl glass-card border border-slate-800/90 active:scale-[0.99] transition-all bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 shadow-lg space-y-3"
          >
            {/* Card Header: Source & Status Selector */}
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.8 rounded-full text-[11px] font-semibold border ${getSourceBadgeColor(lead.source)}`}>
                {lead.source}
              </span>

              <select
                value={lead.status}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange(lead.id, e.target.value);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer outline-none ${statusBadges[lead.status] || statusBadges.new}`}
              >
                <option value="new" className="bg-slate-900 text-indigo-400">NEW</option>
                <option value="contacted" className="bg-slate-900 text-amber-400">CONTACTED</option>
                <option value="qualified" className="bg-slate-900 text-emerald-400">QUALIFIED</option>
                <option value="converted" className="bg-slate-900 text-purple-400">CONVERTED</option>
                <option value="rejected" className="bg-slate-900 text-slate-400">REJECTED</option>
              </select>
            </div>

            {/* Company & Title */}
            <div onClick={() => onSelectLead(lead)} className="cursor-pointer space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-white text-base tracking-tight truncate">
                  {lead.company_name}
                </h4>
              </div>

              <p className="text-xs text-slate-200 font-medium line-clamp-2 pt-0.5">
                {lead.title}
              </p>

              {lead.content && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {lead.content}
                </p>
              )}
            </div>

            {/* Service & Meta Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Tag className="w-2.5 h-2.5" />
                {lead.service}
              </span>

              {lead.location && lead.location !== 'Location not available' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/50">
                  <MapPin className="w-2.5 h-2.5" />
                  {lead.location}
                </span>
              )}

              {lead.author_name && lead.author_name !== 'Not provided' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/50">
                  <User className="w-2.5 h-2.5" />
                  {lead.author_name}
                </span>
              )}
            </div>

            {/* Bottom Card Actions */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
              <span className="text-[11px] text-slate-500">
                {lead.published_at || 'Recently'}
              </span>

              <div className="flex items-center gap-2">
                {lead.url && (
                  <a
                    href={normalizePostUrl(lead.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    onClick={(e) => openExternalUrl(lead.url, e)}
                  >
                    <span>Post</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => onSelectLead(lead)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP TABLE VIEW (Shown on md+ screens)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block overflow-x-auto rounded-2xl glass-card border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
            <tr>
              <th className="py-4 px-5">Company</th>
              <th className="py-4 px-5">Contact</th>
              <th className="py-4 px-5">Service</th>
              <th className="py-4 px-5">Location</th>
              <th className="py-4 px-5">Source</th>
              <th className="py-4 px-5">Posted</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white group-hover:text-indigo-400 transition-colors block text-base leading-tight">
                        {lead.company_name}
                      </span>
                      {normalizeCompanyUrl(lead.company_url) && (
                        <a
                          href={normalizeCompanyUrl(lead.company_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                          onClick={(e) => openExternalUrl(lead.company_url, e)}
                        >
                          {normalizeCompanyUrl(lead.company_url).replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-200 block text-xs">{lead.author_name}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{lead.author_role}</span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {lead.service}
                  </span>
                </td>

                <td className="py-4 px-5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{lead.location}</span>
                  </div>
                </td>

                <td className="py-4 px-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getSourceBadgeColor(lead.source)}`}>
                    {lead.source}
                  </span>
                </td>

                <td className="py-4 px-5 text-xs text-slate-400">
                  {lead.published_at || 'Recently'}
                </td>

                <td className="py-4 px-5">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all ${statusBadges[lead.status] || statusBadges.new}`}
                  >
                    <option value="new" className="bg-slate-900 text-indigo-400">NEW</option>
                    <option value="contacted" className="bg-slate-900 text-amber-400">CONTACTED</option>
                    <option value="qualified" className="bg-slate-900 text-emerald-400">QUALIFIED</option>
                    <option value="converted" className="bg-slate-900 text-purple-400">CONVERTED</option>
                    <option value="rejected" className="bg-slate-900 text-slate-400">REJECTED</option>
                  </select>
                </td>

                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {lead.url && (
                      <a
                        href={normalizePostUrl(lead.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Open Original Post"
                        onClick={(e) => openExternalUrl(lead.url, e)}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LeadTable;
