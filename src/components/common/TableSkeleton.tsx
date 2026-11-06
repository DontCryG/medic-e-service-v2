import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export default function TableSkeleton({ rows = 5, columns = 5, className = '' }: TableSkeletonProps) {
  return (
    <div className={`w-full overflow-hidden animate-pulse ${className}`}>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-3.5 bg-slate-50/70 rounded-xl border border-slate-100"
          >
            {Array.from({ length: columns }).map((_, colIndex) => {
              // Vary widths slightly to look natural
              const widthClasses = [
                'w-1/4',
                'w-1/6',
                'w-1/5',
                'w-1/3',
                'w-12',
                'w-20'
              ];
              const widthClass = widthClasses[(rowIndex + colIndex) % widthClasses.length];

              return (
                <div
                  key={colIndex}
                  className={`h-4 bg-slate-200/80 rounded-md ${widthClass} ${
                    colIndex === 0 ? 'min-w-[120px]' : ''
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
