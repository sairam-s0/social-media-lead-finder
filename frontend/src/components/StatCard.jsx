import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  const styleClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 truncate">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${styleClass}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
