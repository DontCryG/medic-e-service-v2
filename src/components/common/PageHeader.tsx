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

const iconThemeMap = {
  purple: 'from-violet-600 to-purple-600',
  orange: 'from-orange-500 to-amber-400',
  emerald: 'from-emerald-500 to-teal-500',
  rose: 'from-rose-500 to-pink-500',
  sky: 'from-sky-500 to-blue-500',
};

const badgeMap: Record<PageHeaderBadge['variant'], string> = {
  live: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  admin: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  info: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  warning: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconThemeMap[iconTheme]} flex items-center justify-center text-white shadow-lg shrink-0`}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 m-0 leading-tight">
              {title}
            </h1>
            {badge && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeMap[badge.variant]}`}
              >
                {badge.variant === 'live' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 m-0 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
