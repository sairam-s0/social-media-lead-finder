import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Search, Settings, ShieldCheck } from 'lucide-react';

const Sidebar = ({ branding }) => {
  const companyName = branding?.company_name || 'LeadPulse AI';
  const logo = branding?.company_logo || '⚡';
  const tagline = branding?.company_tagline || 'Lead Discovery Engine';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Automation', path: '/automation', icon: Zap },
    { name: 'Search Queries', path: '/search-queries', icon: Search },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 glass-panel border-r border-slate-800 flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/10 shrink-0">
            {logo}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-white truncate tracking-tight">{companyName}</h1>
            <p className="text-xs text-slate-400 truncate">{tagline}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-300 font-medium block">Deterministic Search</span>
            <span className="text-[10px] text-slate-500">Exa Neural AI Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
