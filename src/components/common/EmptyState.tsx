import React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-center text-purple-500 mb-4 shadow-sm shadow-purple-500/5">
        <Icon size={30} strokeWidth={1.75} />
      </div>
      <h4 className="text-base font-bold text-slate-700 m-0 mb-1">{title}</h4>
      {description && <p className="text-sm text-slate-400 max-w-sm m-0 mb-4">{description}</p>}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 border-none cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
