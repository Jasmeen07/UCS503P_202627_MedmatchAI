import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accentColor?: string;
  trend?: string;
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accentColor = "var(--dash-sage)",
  trend 
}: StatCardProps) {
  return (
    <div 
      className="dash-stat-card p-6 flex flex-col gap-4"
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="flex justify-between items-start">
        <div 
          className="w-9 h-9 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-0.5 bg-[var(--dash-surface-warm)] rounded text-[var(--dash-text-secondary)]">
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <h3 className="text-3xl font-semibold text-[var(--dash-text)] mb-1">{value}</h3>
        <p className="text-sm font-medium text-[var(--dash-text-tertiary)]">{label}</p>
      </div>
    </div>
  );
}
