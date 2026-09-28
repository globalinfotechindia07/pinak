import React from "react";

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3" />
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-7 bg-slate-200/80 dark:bg-slate-700/80 rounded-md w-1/2" />
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-md w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
