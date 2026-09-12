import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionClick?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  actionClick 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--dash-border)] rounded-2xl bg-[var(--dash-surface)]">
      <div className="w-16 h-16 rounded-full bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] mb-4">
        <Icon className="w-8 h-8 opacity-75" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--dash-text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mb-6">{description}</p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref} className="dash-btn-primary">
          {actionLabel}
        </Link>
      )}
      
      {actionLabel && actionClick && (
        <button onClick={actionClick} className="dash-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
