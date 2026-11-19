import { AlertTriangle, Sparkles, Lightbulb, CheckCircle2, Clock } from 'lucide-react';
import type { ShortageInsight } from '../types';

interface ShortageInsightsProps {
  insights: ShortageInsight[];
}

export function ShortageInsights({ insights }: ShortageInsightsProps) {
  const getIcon = (type: ShortageInsight['type'], severity: ShortageInsight['severity']) => {
    switch (type) {
      case 'critical_shortage':
        return severity === 'success' 
          ? <CheckCircle2 size={18} className="text-emerald-600" />
          : <AlertTriangle size={18} className="text-rose-600" />;
      case 'peak_hours':
        return <Sparkles size={18} className="text-purple-600" />;
      case 'recommendation':
      default:
        return <Lightbulb size={18} className="text-amber-600" />;
    }
  };

  const getContainerStyles = (severity: ShortageInsight['severity']) => {
    switch (severity) {
      case 'danger':
        return 'bg-rose-50/60 border-rose-200/80 text-rose-900';
      case 'warning':
        return 'bg-amber-50/60 border-amber-200/80 text-amber-900';
      case 'success':
        return 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900';
      case 'info':
      default:
        return 'bg-purple-50/60 border-purple-200/80 text-purple-900';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3 print:break-inside-avoid">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-4 border transition-all ${getContainerStyles(insight.severity)} flex flex-col justify-between print:shadow-none print:break-inside-avoid`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/80 rounded-lg shadow-2xs shrink-0">
                {getIcon(insight.type, insight.severity)}
              </div>
              <h4 className="text-xs font-bold tracking-tight m-0">{insight.title}</h4>
            </div>
            <p className="text-xs leading-relaxed opacity-90 m-0 font-normal">
              {insight.description}
            </p>
          </div>

          {insight.timeRange && (
            <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center gap-1.5 text-[11px] font-bold">
              <Clock size={13} className="shrink-0 opacity-70" />
              <span>ช่วงเวลาวิกฤต: {insight.timeRange}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
