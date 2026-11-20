import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Search, 
  Settings, 
  Smartphone,
  ChevronRight,
  Database
} from 'lucide-react';
import { getStoredLeads } from '../services/api';

const Sidebar = ({ branding, onOpenMobileModal }) => {
  const companyName = branding?.company_name || 'LeadPulse';
  const logo = branding?.company_logo || '⚡';
  const tagline = branding?.company_tagline || 'Social Lead Discovery Engine';
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const updateCounts = () => {
    try {
      const leads = getStoredLeads();
      setNewLeadsCount(leads.filter(l => l.status === 'new').length);
    } catch (e) {}
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('lead_data_updated', updateCounts);
    return () => window.removeEventListener('lead_data_updated', updateCounts);
  }, []);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard, shortcut: '⌘1' },
    { name: 'Leads', path: '/leads', icon: Users, badge: newLeadsCount, shortcut: '⌘2' },
    { name: 'Search Queries', path: '/search-queries', icon: Search, shortcut: '⌘3' },
    { name: 'Automation', path: '/automation', icon: Zap, shortcut: '⌘4' },
    { name: 'Settings', path: '/settings', icon: Settings, shortcut: '⌘5' },
  ];

  return (
    <aside className="hidden md:flex w-60 bg-[#090a0f] border-r border-[#1f2430] flex-col justify-between shrink-0 select-none">
      <div>
        {/* Workspace Brand Switcher */}
        <div className="h-14 px-4 border-b border-[#1f2430] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-md bg-[#161922] border border-[#282f40] flex items-center justify-center text-xs font-bold text-[#ededef] shadow-inner">
              {logo}
            </span>
            <div className="min-w-0">
              <span className="font-semibold text-xs tracking-tight text-[#ededef] block truncate leading-tight">
                {companyName}
              </span>
              <span className="text-[10px] text-[#555a68] block truncate">
                Workspace Engine
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161922] text-[#8a8f9e] border border-[#1f2430]">
            v2.1
          </span>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[#555a68]">
          Discovery Navigation
        </div>

        {/* Navigation Items */}
        <nav aria-label="Main Navigation" className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#161922] text-[#ededef] font-semibold border border-[#282f40] shadow-sm'
                      : 'text-[#8a8f9e] hover:text-[#ededef] hover:bg-[#0f1117]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#ededef]' : 'text-[#8a8f9e] group-hover:text-[#ededef]'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge > 0 && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-[#161922] text-[#38bdf8] border border-[#1f2430]">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#555a68] opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.shortcut}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Mobile Pairing & System Health Status */}
      <div className="p-3 border-t border-[#1f2430] space-y-2">
        <button
          type="button"
          onClick={onOpenMobileModal}
          className="w-full flex items-center justify-between p-2 rounded-md bg-[#0f1117] hover:bg-[#161922] border border-[#1f2430] text-[#8a8f9e] hover:text-[#ededef] text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-[#5e6ad2]" />
            <span className="text-[11px] font-medium">Sync Mobile App</span>
          </div>
          <span className="text-[10px] font-mono text-[#555a68] bg-[#161922] px-1.5 py-0.5 rounded">
            QR
          </span>
        </button>

        <div className="px-2 py-1 flex items-center justify-between text-[10px] text-[#555a68] font-mono">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#555a68]" />
            <span>SQLite & Exa</span>
          </div>
          <span className="text-[#34d399] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
            Live
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
