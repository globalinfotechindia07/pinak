import React, { useState } from "react";
import { Sparkles, Plus, TicketPercent, WalletCards, TrendingUp, CheckCircle2, X, Award, Users } from "lucide-react";
import { RewardRule, Customer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface RewardsEconomyProps {
  rewardRules: RewardRule[];
  customers: Customer[];
  onAddRule: (rule: Partial<RewardRule>) => void;
}

export const RewardsEconomy: React.FC<RewardsEconomyProps> = ({ rewardRules, customers, onAddRule }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [earnRate, setEarnRate] = useState(5);
  const [category, setCategory] = useState("All categories");
  const [description, setDescription] = useState("");

  const totalPointsIssued = "2.84M";
  const totalPointsRedeemed = "1.92M";
  const activeBalances = "₹5.18L";

  const customerColumns: Column<Customer>[] = [
    {
      header: "Customer",
      sortable: true,
      accessor: "name",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
            {c.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{c.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{c.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: "City & Area",
      sortable: true,
      accessor: "city",
      render: (c) => <span className="text-xs text-slate-600 dark:text-slate-400">{c.city}</span>
    },
    {
      header: "Store Visits",
      sortable: true,
      accessor: "visits",
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {c.visits} visits
        </span>
      )
    },
    {
      header: "Reward Points Balance",
      sortable: true,
      accessor: "rewardsBalance",
      render: (c) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-pink-600 dark:text-pink-400">{c.rewardsBalance.toLocaleString()} pts</span>
          <span className="text-slate-400 text-[11px] ml-1.5">(₹{(c.rewardsBalance * 0.25).toFixed(0)} val)</span>
        </div>
      )
    },
    {
      header: "Segment Tier",
      sortable: true,
      accessor: "segment",
      render: (c) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          {c.segment}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-pink-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-200">
            <Sparkles size={14} />
            Rewards & Loyalty Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Manrope']">
            ₹8.42L Returned in Customer Value
          </h2>
          <p className="text-sm text-slate-100/90 max-w-xl">
            Customers earn PINAK points on UPI payments and redeem them across local stores, boosting 30-day repeat visits by 42%.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="relative z-10 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg"
        >
          <Plus size={15} className="inline mr-1" />
          <span>New Reward Rule</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Points Issued</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{totalPointsIssued}</p>
          <span className="text-xs text-emerald-600 font-bold">+18.6% vs last month</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Points Redeemed</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{totalPointsRedeemed}</p>
          <span className="text-xs text-emerald-600 font-bold">+24.8% burn rate</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balances</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{activeBalances}</p>
          <span className="text-xs text-slate-400 font-medium">customer wallets</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Redemption Rate</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">67.6%</p>
          <span className="text-xs text-emerald-600 font-bold">+8.1% repeat lift</span>
        </div>
      </div>

      {/* Rules List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
          Active Reward Programs & Multipliers
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rewardRules.map((rule) => (
            <div key={rule.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 mt-0.5">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="font-bold text-pink-600 dark:text-pink-400">
                      {rule.earnPointsPerHundred} pts per ₹100 spent
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium">{rule.categoryFilter}</span>
                  </div>
                </div>
              </div>

              <span className="badge-status badge-approved self-start sm:self-auto">
                <CheckCircle2 size={12} />
                {rule.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Wallet Balances Table */}
      <AdvancedTable
        title="Customer Loyalty Wallets"
        subtitle="Individual customer point balances, lifetime visits, and audience tiers"
        columns={customerColumns}
        data={customers}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer name, city, or segment..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.segment.toLowerCase().includes(q) ||
          c.phone.includes(q)
        }
      />

      {/* Add Rule Right Slide-Over Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsAddOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">New Loyalty Program</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rule Name</label>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Weekend Dining Booster"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Points Per ₹100</label>
                    <input
                      type="number"
                      value={earnRate}
                      onChange={(e) => setEarnRate(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Category Scope</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    >
                      <option>All categories</option>
                      <option>Food & Dining</option>
                      <option>Beauty & Wellness</option>
                      <option>Gym & Fitness</option>
                      <option>Retail & Shopping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Customer explanation for the app banner..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button
                  onClick={() => {
                    onAddRule({ name: ruleName, earnPointsPerHundred: earnRate, categoryFilter: category, description });
                    setIsAddOpen(false);
                    toast.success(`Loyalty rule "${ruleName}" created successfully!`);
                  }}
                  disabled={!ruleName}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  Create Program
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
