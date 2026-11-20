import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Search, Zap, Settings } from 'lucide-react';
import { getStoredLeads } from '../services/api';

const MobileNavigation = ({ onRunSearch, isSearching }) => {
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const updateCount = () => {
    try {
      const leads = getStoredLeads();
      setNewLeadsCount(leads.filter(l => l.status === 'new').length);
    } catch (e) {}
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('lead_data_updated', updateCount);
    return () => window.removeEventListener('lead_data_updated', updateCount);
  }, []);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users, badge: newLeadsCount },
    { name: 'Queries', path: '/search-queries', icon: Search },
    { name: 'Automation', path: '/automation', icon: Zap },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0f] border-t border-[#1f2430] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-md transition-colors ${
                  isActive
                    ? 'text-[#ededef] font-semibold'
                    : 'text-[#8a8f9e] hover:text-[#ededef]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 bg-[#38bdf8] text-[#090a0f] text-[9px] font-bold px-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
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
