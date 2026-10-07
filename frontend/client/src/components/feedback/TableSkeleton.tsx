import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = "",
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse ${className}`}>
      {/* Table Header Skeleton */}
      <div className="flex items-center gap-4 px-6 py-4 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md"
            style={{ width: `${Math.max(60, 100 / columns)}%` }}
          />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded-md"
                style={{
                  width: cIdx === 0 ? "35%" : cIdx === columns - 1 ? "15%" : "20%",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
