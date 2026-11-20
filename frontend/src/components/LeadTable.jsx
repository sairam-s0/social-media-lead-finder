import React, { useState } from 'react';
import { ExternalLink, ArrowUpRight, Building, Check, ChevronDown } from 'lucide-react';
import { normalizePostUrl, openExternalUrl } from '../utils/urlHelper';

const LeadTable = ({ leads, onSelectLead, onStatusChange }) => {
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const statusConfig = {
    new: { label: 'New', dot: 'bg-[#38bdf8]', text: 'text-[#38bdf8]' },
    contacted: { label: 'Contacted', dot: 'bg-[#fbbf24]', text: 'text-[#fbbf24]' },
    qualified: { label: 'Qualified', dot: 'bg-[#34d399]', text: 'text-[#34d399]' },
    converted: { label: 'Converted', dot: 'bg-[#a78bfa]', text: 'text-[#a78bfa]' },
    rejected: { label: 'Rejected', dot: 'bg-[#555a68]', text: 'text-[#555a68]' },
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="p-8 text-center text-[#8a8f9e] bg-[#0f1117] rounded-lg border border-[#1f2430]">
        <Building className="w-8 h-8 mx-auto text-[#555a68] mb-2" />
        <p className="text-xs font-semibold text-[#ededef]">No leads available in this view</p>
        <p className="text-[11px] text-[#8a8f9e] mt-0.5">
          Trigger a scan from the header to discover high-intent prospective client leads.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1117] border border-[#1f2430] rounded-lg overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* MOBILE LIST VIEW (Preserved exactly as approved)              */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden divide-y divide-[#181c26]">
        {leads.map((lead) => {
          const cfg = statusConfig[lead.status] || statusConfig.new;
          return (
            <div
              key={lead.id}
              className="p-3 space-y-2 hover:bg-[#141720] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="font-semibold text-xs text-[#ededef] truncate">{lead.company_name}</span>
                  <span className="text-[10px] text-[#555a68] font-mono shrink-0">{lead.source}</span>
                </div>

                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value)}
                  className="text-[11px] font-mono uppercase bg-[#161922] text-[#8a8f9e] border border-[#282f40] px-2 py-0.5 rounded outline-none"
                >
                  <option value="new">NEW</option>
                  <option value="contacted">CONTACTED</option>
                  <option value="qualified">QUALIFIED</option>
                  <option value="converted">CONVERTED</option>
                  <option value="rejected">REJECTED</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => onSelectLead(lead)}
                className="text-left w-full space-y-1 block"
              >
                <p className="text-xs text-[#ededef] font-medium line-clamp-2 leading-relaxed">
                  {lead.title}
                </p>
                {lead.content && (
                  <p className="text-[11px] text-[#8a8f9e] line-clamp-2 leading-normal">
                    {lead.content}
                  </p>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-[#8a8f9e] truncate max-w-[200px]">
                  {lead.service} {lead.location && lead.location !== 'Location not available' ? `• ${lead.location}` : ''}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="text-xs text-[#ededef] hover:underline font-medium"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => openExternalUrl(normalizePostUrl(lead.url, lead.source))}
                    className="text-xs text-[#8a8f9e] hover:text-[#ededef]"
                    aria-label="Open post"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP TABLE VIEW (Attio / Linear High Data Density Grid)    */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0b0d13] border-b border-[#1f2430] text-[#8a8f9e] text-[11px] font-medium uppercase tracking-wider select-none">
            <tr>
              <th className="py-2.5 px-4 font-medium">Company & Opportunity</th>
              <th className="py-2.5 px-3 font-medium">Service Demand</th>
              <th className="py-2.5 px-3 font-medium">Platform</th>
              <th className="py-2.5 px-3 font-medium">Stage</th>
              <th className="py-2.5 px-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181c26]">
            {leads.map((lead) => {
              const cfg = statusConfig[lead.status] || statusConfig.new;
              const isDropdownOpen = activeDropdownId === lead.id;

              return (
                <tr key={lead.id} className="hover:bg-[#141720] transition-colors group">
                  {/* Company & Post Preview */}
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectLead(lead)}
                      className="text-left block group/item max-w-lg"
                    >
                      <span className="font-semibold text-xs text-[#ededef] group-hover/item:text-white transition-colors flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span>{lead.company_name}</span>
                        {lead.location && lead.location !== 'Location not available' && (
                          <span className="text-[10px] font-normal text-[#555a68] truncate">
                            • {lead.location}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[#8a8f9e] block line-clamp-1 mt-0.5">
                        {lead.title}
                      </span>
                    </button>
                  </td>

                  {/* Service Chip */}
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] bg-[#161922] text-[#8a8f9e] px-2 py-0.5 rounded border border-[#1f2430]">
                      {lead.service}
                    </span>
                  </td>

                  {/* Platform */}
                  <td className="py-2.5 px-3 text-[#8a8f9e] font-mono text-[11px]">
                    {lead.source}
                  </td>

                  {/* Custom Headless Status Dropdown Popover */}
                  <td className="py-2.5 px-3 relative">
                    <button
                      type="button"
                      onClick={() => setActiveDropdownId(isDropdownOpen ? null : lead.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#161922] hover:bg-[#1f2430] border border-[#282f40] rounded text-[11px] font-mono uppercase transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className={cfg.text}>{cfg.label}</span>
                      <ChevronDown className="w-3 h-3 text-[#555a68]" />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setActiveDropdownId(null)} 
                        />
                        <div className="absolute left-0 top-full mt-1 w-32 bg-[#0f1117] border border-[#282f40] rounded-md shadow-xl py-1 z-50 text-[11px] font-mono">
                          {Object.entries(statusConfig).map(([key, item]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                onStatusChange(lead.id, key);
                                setActiveDropdownId(null);
                              }}
                              className="w-full px-2.5 py-1 text-left flex items-center justify-between hover:bg-[#161922] text-[#8a8f9e] hover:text-[#ededef]"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                                <span>{item.label}</span>
                              </div>
                              {lead.status === key && <Check className="w-3 h-3 text-[#5e6ad2]" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectLead(lead)}
                        className="px-2.5 py-1 bg-[#161922] hover:bg-[#1f2430] text-[#ededef] border border-[#282f40] rounded text-[11px] font-medium transition-colors"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openExternalUrl(normalizePostUrl(lead.url, lead.source))}
                        className="p-1 text-[#8a8f9e] hover:text-[#ededef] hover:bg-[#161922] rounded transition-colors"
                        title="Open source post"
                        aria-label="Open source post"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;
