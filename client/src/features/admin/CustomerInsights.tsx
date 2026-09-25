import React from "react";
import { Users, Search, Download, Sparkles, Activity, TrendingUp } from "lucide-react";
import { Customer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface CustomerInsightsProps {
  customers: Customer[];
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({ customers }) => {
  const columns: Column<Customer>[] = [
    {
      header: "Customer",
      sortable: true,
      accessor: "name",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {c.initials || c.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{c.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{c.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: "City",
      sortable: true,
      accessor: "city",
      render: (c) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{c.city}</span>
    },
    {
      header: "Store Visits",
      sortable: true,
      accessor: "visits",
      render: (c) => (
        <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
          {c.visits} visits
        </span>
      )
    },
    {
      header: "Rewards Wallet",
      sortable: true,
      accessor: "rewardsBalance",
      render: (c) => (
        <span className="font-mono font-bold text-xs text-pink-600 dark:text-pink-400">
          ₹{c.rewardsBalance}
        </span>
      )
    },
    {
      header: "Audience Segment",
      sortable: true,
      accessor: "segment",
      render: (c) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          {c.segment}
        </span>
      )
    },
    {
      header: "Last Active",
      sortable: true,
      accessor: "lastActive",
      render: (c) => <span className="text-xs text-slate-400 font-mono">{c.lastActive}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Customer Intelligence & Segments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze customer lifetime rewards, repeat scan behavior, and automated audience segmentation.
          </p>
        </div>
      </div>

      {/* Segments Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: "Power Users", count: "2,840", pct: "22.7%", desc: "Generates 48% of gross volume", color: "purple" },
          { name: "Regular Diners", count: "5,320", pct: "42.6%", desc: "Visits 2+ stores a month", color: "pink" },
          { name: "New Registrations", count: "2,110", pct: "16.9%", desc: "Joined in last 30 days", color: "amber" },
          { name: "At Risk (>30d inactive)", count: "2,210", pct: "17.8%", desc: "Target with win-back booster", color: "blue" }
        ].map((s) => (
          <div
            key={s.name}
            className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">{s.name}</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{s.pct}</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {s.count}
            </p>
            <p className="text-xs text-slate-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Advanced Customer Directory Table */}
      <AdvancedTable
        title="Verified Customer Directory"
        subtitle={`${customers.length} registered app users with loyalty histories`}
        columns={columns}
        data={customers}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer name, city, segment, or phone..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.segment.toLowerCase().includes(q) ||
          c.phone.includes(q)
        }
      />
    </div>
  );
};
