import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Search, Layers, Settings, Zap } from 'lucide-react';
import { getStoredLeads } from '../services/api';

const MobileNavigation = ({ onRunSearch, isSearching }) => {
  const [leadsCount, setLeadsCount] = useState(0);

  const updateCount = () => {
    try {
      const leads = getStoredLeads();
      setLeadsCount(leads.filter(l => l.status === 'new').length);
    } catch (e) {}
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('lead_data_updated', updateCount);
    return () => window.removeEventListener('lead_data_updated', updateCount);
  }, []);

  const handleNavClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users, badge: leadsCount },
    { name: 'Queries', path: '/search-queries', icon: Layers },
    { name: 'Settings', path: '/settings', icon: Settings, dot: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] shadow-2xl shadow-indigo-950/50">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                    isActive ? 'bg-indigo-600/20 shadow-lg shadow-indigo-500/20' : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-950 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Central Floating "Discover / Run Search" Action Button */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={() => {
              handleNavClick();
              if (onRunSearch) onRunSearch({});
            }}
            disabled={isSearching}
            className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-600/40 border-2 border-indigo-400/30 flex items-center justify-center active:scale-95 transition-all duration-200 ${
              isSearching ? 'animate-pulse ring-4 ring-indigo-500/30' : 'hover:scale-105'
            }`}
            title="Trigger Instant Lead Discovery"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="w-6 h-6 fill-white drop-shadow" />
            )}
          </button>
          <span className="text-[9px] font-bold text-indigo-300 mt-1 uppercase tracking-wider">
            {isSearching ? 'Searching' : 'Discover'}
          </span>
        </div>

        {/* Last 2 items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                    isActive ? 'bg-indigo-600/20 shadow-lg shadow-indigo-500/20' : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                    {item.dot && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-1 ring-slate-950" />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
