import type { ReactNode } from 'react';

interface PageHeaderBadge {
  label: string;
  variant: 'live' | 'admin' | 'info' | 'warning';
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  iconTheme?: 'purple' | 'orange' | 'emerald' | 'rose' | 'sky';
  badge?: PageHeaderBadge;
  actions?: ReactNode;
}

const iconColorMap = {
  purple: 'text-purple-700 bg-purple-50/80 border-purple-200/70',
  orange: 'text-amber-700 bg-amber-50/80 border-amber-200/70',
  emerald: 'text-emerald-700 bg-emerald-50/80 border-emerald-200/70',
  rose: 'text-rose-700 bg-rose-50/80 border-rose-200/70',
  sky: 'text-sky-700 bg-sky-50/80 border-sky-200/70',
};

const badgeMap: Record<PageHeaderBadge['variant'], string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  admin: 'bg-amber-50 text-amber-700 border-amber-200/80',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  warning: 'bg-orange-50 text-orange-700 border-orange-200/80',
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  iconTheme = 'purple',
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${iconColorMap[iconTheme]}`}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 m-0 leading-tight">
              {title}
            </h1>
            {badge && (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeMap[badge.variant]}`}
              >
                {badge.variant === 'live' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal leading-normal">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
