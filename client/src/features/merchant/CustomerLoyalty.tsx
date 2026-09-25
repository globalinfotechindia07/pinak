import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  Sparkles,
  HeartHandshake,
  Award,
  Crown,
  Gift,
  Plus,
  CheckCircle2,
  ChevronRight,
  Flame,
  X,
  CreditCard,
  QrCode
} from "lucide-react";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  pointsBalance: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  lastVisit: string;
  favoriteDeal: string;
}

const INITIAL_LOYALTY_CUSTOMERS: LoyaltyCustomer[] = [
  {
    id: "lc-1",
    name: "Vikram Malhotra",
    phone: "+91 98220 54120",
    visits: 14,
    totalSpent: 18450,
    pointsBalance: 920,
    tier: "PLATINUM",
    lastVisit: "Today · 1:15 PM",
    favoriteDeal: "Weekend Dining 20% Off"
  },
  {
    id: "lc-2",
    name: "Ananya Deshmukh",
    phone: "+91 94221 88301",
    visits: 9,
    totalSpent: 9800,
    pointsBalance: 490,
    tier: "GOLD",
    lastVisit: "Yesterday · 8:40 PM",
    favoriteDeal: "Flat ₹150 Off Lunch"
  },
  {
    id: "lc-3",
    name: "Rahul Sharma",
    phone: "+91 99701 44219",
    visits: 5,
    totalSpent: 4200,
    pointsBalance: 210,
    tier: "SILVER",
    lastVisit: "3 days ago",
    favoriteDeal: "15% Off All Orders"
  },
  {
    id: "lc-4",
    name: "Sneha Patel",
    phone: "+91 97654 33210",
    visits: 2,
    totalSpent: 1650,
    pointsBalance: 80,
    tier: "BRONZE",
    lastVisit: "6 days ago",
    favoriteDeal: "Welcome Starter ₹100 Off"
  },
  {
    id: "lc-5",
    name: "Karan Johar",
    phone: "+91 91580 99421",
    visits: 18,
    totalSpent: 26800,
    pointsBalance: 1340,
    tier: "PLATINUM",
    lastVisit: "2 days ago",
    favoriteDeal: "Chef Special 20% Off"
  },
  {
    id: "lc-6",
    name: "Pooja Hegde",
    phone: "+91 98233 11874",
    visits: 7,
    totalSpent: 7300,
    pointsBalance: 365,
    tier: "GOLD",
    lastVisit: "4 days ago",
    favoriteDeal: "Family Dinner Flat ₹250 Off"
  }
];

export const CustomerLoyalty: React.FC = () => {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>(INITIAL_LOYALTY_CUSTOMERS);
  const [isAddTierOpen, setIsAddTierOpen] = useState(false);
  const [stampCount, setStampCount] = useState(3); // 3 of 5 stamps earned demo

  const [tierName, setTierName] = useState("");
  const [cashbackPct, setCashbackPct] = useState(5);
  const [minSpend, setMinSpend] = useState(5000);
  const [perk, setPerk] = useState("Complimentary Dessert on orders above ₹1,200");

  const [loyaltyTiers, setLoyaltyTiers] = useState([
    {
      tier: "Bronze",
      badgeClass: "from-amber-700 to-amber-900",
      cashback: "1%",
      minSpend: "₹0",
      perk: "1 PINAK Point per ₹100 spent",
      membersCount: 420
    },
    {
      tier: "Silver",
      badgeClass: "from-slate-400 to-slate-600",
      cashback: "2%",
      minSpend: "₹3,000",
      perk: "Priority seating + 2x points on Tuesdays",
      membersCount: 284
    },
    {
      tier: "Gold",
      badgeClass: "from-amber-400 to-amber-600",
      cashback: "5%",
      minSpend: "₹8,000",
      perk: "Complimentary Chef Starter + Birthday voucher",
      membersCount: 118
    },
    {
      tier: "Platinum VIP",
      badgeClass: "from-violet-600 to-purple-800",
      cashback: "10%",
      minSpend: "₹15,000",
      perk: "Private tasting table + Direct GM concierge",
      membersCount: 42
    }
  ]);

  const columns: Column<LoyaltyCustomer>[] = [
    {
      header: "Customer & Contact",
      sortable: true,
      accessor: "name",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
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
      header: "Loyalty Tier",
      sortable: true,
      accessor: "tier",
      render: (c) => (
        <span
          className={`badge-status font-bold text-xs ${
            c.tier === "PLATINUM"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200"
              : c.tier === "GOLD"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
              : c.tier === "SILVER"
              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
              : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200"
          }`}
        >
          {c.tier === "PLATINUM" && <Crown size={12} className="text-purple-600" />}
          {c.tier === "GOLD" && <Award size={12} className="text-amber-500" />}
          {c.tier}
        </span>
      )
    },
    {
      header: "Total Visits",
      sortable: true,
      accessor: "visits",
      render: (c) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          {c.visits} visits
        </span>
      )
    },
    {
      header: "Lifetime Spend",
      sortable: true,
      accessor: "totalSpent",
      render: (c) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          ₹{c.totalSpent.toLocaleString()}
        </span>
      )
    },
    {
      header: "Point Balance",
      sortable: true,
      accessor: "pointsBalance",
      render: (c) => (
        <span className="font-mono text-xs font-extrabold text-pink-600 dark:text-pink-400">
          {c.pointsBalance} pts
        </span>
      )
    },
    {
      header: "Most Redeemed Deal",
      accessor: "favoriteDeal",
      render: (c) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs block">
          {c.favoriteDeal}
        </span>
      )
    },
    {
      header: "Last Visit",
      sortable: true,
      accessor: "lastVisit",
      render: (c) => <span className="text-xs text-slate-400">{c.lastVisit}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Customer Retention & VIP Loyalty
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
              End-to-End VIP Program
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Turn one-time diners into high-frequency regulars with automated tiered cashback perks, visit milestones, and birthday treats.
          </p>
        </div>

        <button
          onClick={() => setIsAddTierOpen(true)}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Custom Tier Perk</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frequent Regulars</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">842</p>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +18.4% repeat growth
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Diners Ticket</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">₹1,420</p>
          <span className="text-xs text-emerald-600 font-bold">+22% for VIP members</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Points Redemptions</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">3,490</p>
          <span className="text-xs text-purple-600 font-bold">₹87,250 bill credits burned</span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Churn Risk (&gt;21d)</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">88</p>
          <span className="text-xs text-amber-600 font-bold">Auto win-back active</span>
        </div>
      </div>

      {/* Tier Badges Cards */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Store VIP Loyalty Tiers
            </h3>
            <p className="text-xs text-slate-500">Diners automatically unlock elevated tier perks as cumulative spend increases.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyTiers.map((t) => (
            <div
              key={t.tier}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} className="text-pink-600" />
                  {t.tier}
                </span>
                <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/60 px-2 py-0.5 rounded-full">
                  {t.cashback} Back
                </span>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">Unlock Milestone:</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.minSpend} cumulative spend</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold block text-[10px] text-purple-600 dark:text-purple-400 uppercase">Perk</span>
                <p className="mt-0.5 text-[11px] leading-tight">{t.perk}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Current Members:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{t.membersCount} diners</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Stamp Card Milestone Simulator */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-pink-200">
              <Gift size={13} />
              Diner Milestone Stamp Card (App Sync)
            </span>
            <h3 className="text-lg font-bold font-['Manrope']">
              Visit 5 Times · Get ₹250 Instant Bill Waiver
            </h3>
            <p className="text-xs text-slate-300">
              Customers collect a digital stamp every time they scan and settle a bill above ₹800 with direct UPI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = (stampCount % 5) + 1;
                setStampCount(next);
                if (next === 5) {
                  toast.success("5th visit completed! ₹250 Reward voucher auto-issued to customer wallet.");
                } else {
                  toast.success(`Scan recorded! Stamp #${next} added to diner card.`);
                }
              }}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-md flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-pink-600" />
              <span>Simulate Counter Stamp (+1)</span>
            </button>
          </div>
        </div>

        {/* 5-Stamp Visual Progress */}
        <div className="grid grid-cols-5 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map((s) => {
            const isEarned = s <= stampCount;
            const isReward = s === 5;
            return (
              <div
                key={s}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  isEarned
                    ? "bg-white/20 border-2 border-pink-400 text-white shadow-lg backdrop-blur-md"
                    : "bg-white/5 border border-white/10 text-slate-400"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    isEarned
                      ? isReward
                        ? "bg-gradient-to-tr from-amber-400 to-pink-500 text-white shadow-md animate-pulse"
                        : "bg-pink-500 text-white"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {isEarned ? (isReward ? <Crown size={17} /> : <CheckCircle2 size={17} />) : s}
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {isReward ? "₹250 Reward!" : `Visit #${s}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Loyalty Directory Table */}
      <AdvancedTable
        title="Diner Loyalty & VIP Directory"
        subtitle={`${customers.length} verified customers with tier statuses and rewards balances`}
        columns={columns}
        data={customers}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search diner by name, phone, tier, or favorite deal..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.tier.toLowerCase().includes(q) ||
          c.favoriteDeal.toLowerCase().includes(q)
        }
      />

      {/* Add Custom Tier Perk Right Slide-Over Drawer */}
      {isAddTierOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddTierOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create VIP Loyalty Tier
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddTierOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tier Name</label>
                  <input
                    type="text"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g. Diamond Executive"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Cashback Rate (%)</label>
                    <input
                      type="number"
                      value={cashbackPct}
                      onChange={(e) => setCashbackPct(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Spend Threshold (₹)</label>
                    <input
                      type="number"
                      value={minSpend}
                      onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Complimentary VIP Perk</label>
                  <textarea
                    value={perk}
                    onChange={(e) => setPerk(e.target.value)}
                    placeholder="e.g. Free beverage upgrade + priority weekend booking"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-1">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                    Automatic Tier Promotion
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Whenever a diner exceeds ₹{minSpend} across your store branches, PINAK automatically sends a celebration push notification and issues tier perks.
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddTierOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!tierName.trim()) {
                      toast.error("Please enter tier name");
                      return;
                    }
                    setLoyaltyTiers([
                      ...loyaltyTiers,
                      {
                        tier: tierName,
                        badgeClass: "from-pink-600 to-rose-700",
                        cashback: `${cashbackPct}%`,
                        minSpend: `₹${minSpend.toLocaleString()}`,
                        perk,
                        membersCount: 0
                      }
                    ]);
                    setIsAddTierOpen(false);
                    toast.success(`VIP tier "${tierName}" published to loyalty engine!`);
                  }}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
                >
                  Publish Tier
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
