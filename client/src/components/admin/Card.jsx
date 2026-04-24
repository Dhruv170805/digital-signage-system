import React from 'react';

const Card = ({ children, className = "", title, icon, subtitle }) => {
  const Icon = icon;
  return (
    <div className={`glass-card p-8 animate-fade-in ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-accent shadow-inner">
                <Icon size={24} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-text uppercase tracking-tighter leading-none">{title}</h3>
              {subtitle && <p className="text-[10px] font-bold text-text-dim uppercase tracking-[2px] mt-1.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
