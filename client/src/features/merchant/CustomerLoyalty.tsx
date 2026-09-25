import React from "react";
import { Users, TrendingUp, Sparkles, HeartHandshake } from "lucide-react";

export const CustomerLoyalty: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
          Customer Retention & Loyalty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Turn one-time diners into high-frequency regulars with automated repeat perks and milestone rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Frequent Regulars</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">842</p>
          <span className="text-xs text-emerald-600 font-bold">+18% this month</span>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Lunch Crowd (12–3 PM)</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">318</p>
          <span className="text-xs text-emerald-600 font-bold">+26% weekday boost</span>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">At Risk Inactive (&gt;21d)</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">88</p>
          <span className="text-xs text-amber-600 font-bold">Needs win-back campaign</span>
        </div>
      </div>
    </div>
  );
};
