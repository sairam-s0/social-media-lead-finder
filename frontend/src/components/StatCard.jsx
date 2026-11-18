import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitle }) => {
  const colorStyles = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }[color] || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  return (
    <div className="glass-card p-3.5 md:p-5 rounded-2xl transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs font-semibold text-slate-400 tracking-wider uppercase truncate">{title}</p>
          <h3 className="text-xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
        </div>
        <div className={`p-2 md:p-3 rounded-xl border shrink-0 ${colorStyles}`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
