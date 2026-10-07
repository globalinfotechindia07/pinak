import React, { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Smartphone,
  MessageSquare,
  Sparkles,
  Users,
  TrendingUp,
  Percent,
  Gift,
  X,
  Send,
  Eye,
  Sliders,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface Playbook {
  id: string;
  title: string;
  category: "winback" | "highvalue" | "slowhours" | "birthday" | "milestone";
  desc: string;
  triggerRule: string;
  schedule: string;
  rewardType: string;
  rewardValue: string;
  channels: ("whatsapp" | "push" | "sms")[];
  active: boolean;
  triggersSent: number;
  redemptions: number;
  revenueGenerated: number;
}

export const GrowthPlaybooks: React.FC = () => {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(() => {
    try {
      const saved = localStorage.getItem("pinak_growth_playbooks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<"all" | "active" | "paused">("all");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isSimulateDrawerOpen, setIsSimulateDrawerOpen] = useState(false);
  const [selectedPlaybookForSim, setSelectedPlaybookForSim] = useState<Playbook | null>(null);

  // Form states for creating a new playbook
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Playbook["category"]>("winback");
  const [newTriggerDays, setNewTriggerDays] = useState("14");
  const [newMinSpend, setNewMinSpend] = useState("1500");
  const [newRewardType, setNewRewardType] = useState("discount");
  const [newRewardValue, setNewRewardValue] = useState("₹150 Off");
  const [newChannels, setNewChannels] = useState<("whatsapp" | "push" | "sms")[]>(["whatsapp", "push"]);
  const [newCustomMessage, setNewCustomMessage] = useState(
    "Hi {customer_name}! We miss you at our store. Enjoy {reward} on your next visit this week! Show code: {code}"
  );

  // Simulation persona states
  const [simPersona, setSimPersona] = useState("rahul");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    triggered: boolean;
    customerName: string;
    phone: string;
    message: string;
    timestamp: string;
  } | null>(null);

  const personas = [
    {
      id: "rahul",
      name: "Rahul Sharma",
      phone: "+91 98221 00291",
      lastVisitDays: 16,
      spend: 2450,
      visits: 4,
      status: "Inactive 16 days"
    },
    {
      id: "priya",
      name: "Priya Deshmukh",
      phone: "+91 94230 88219",
      lastVisitDays: 2,
      spend: 1980,
      visits: 5,
      status: "Visited 2 days ago (High ticket ₹1,980)"
    },
    {
      id: "amit",
      name: "Amit Patel",
      phone: "+91 99234 11290",
      lastVisitDays: 5,
      spend: 650,
      visits: 12,
      status: "Regular weekday diner"
    }
  ];

  const togglePlaybook = (id: string) => {
    setPlaybooks(
      playbooks.map((p) => {
        if (p.id === id) {
          const next = !p.active;
          toast.success(
            next ? `Activated "${p.title}" automation engine!` : `Paused "${p.title}" playbook.`
          );
          return { ...p, active: next };
        }
        return p;
      })
    );
  };

  const deletePlaybook = (id: string) => {
    setPlaybooks(playbooks.filter((p) => p.id !== id));
    toast.success("Playbook deleted from automation registry.");
  };

  const handleChannelToggle = (channel: "whatsapp" | "push" | "sms") => {
    if (newChannels.includes(channel)) {
      if (newChannels.length > 1) {
        setNewChannels(newChannels.filter((c) => c !== channel));
      } else {
        toast.error("At least one communication channel is required.");
      }
    } else {
      setNewChannels([...newChannels, channel]);
    }
  };

  const handleCreatePlaybook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a title for the playbook.");
      return;
    }

    let triggerRule = "";
    let schedule = "Automated daemon engine";

    if (newCategory === "winback") {
      triggerRule = `Inactive for > ${newTriggerDays} days`;
      schedule = "Evaluated daily at 11:30 AM";
    } else if (newCategory === "highvalue") {
      triggerRule = `UPI bill amount > ₹${newMinSpend}`;
      schedule = "Instant trigger upon bill settlement";
    } else if (newCategory === "slowhours") {
      triggerRule = "Mon-Fri lunch 12:00 PM – 2:30 PM";
      schedule = "Weekday dynamic discovery boost";
    } else if (newCategory === "milestone") {
      triggerRule = "Customer reaches 5th counter payment";
      schedule = "Instant trigger upon 5th visit";
    } else {
      triggerRule = "Customer birthday or anniversary week";
      schedule = "7 days prior to anniversary";
    }

    const created: Playbook = {
      id: `pb-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      desc: `Automated campaign dispatched to qualifying diners via ${newChannels.join(", ")}.`,
      triggerRule,
      schedule,
      rewardType: newRewardValue,
      rewardValue: newRewardValue,
      channels: newChannels,
      active: true,
      triggersSent: 0,
      redemptions: 0,
      revenueGenerated: 0
    };

    setPlaybooks([created, ...playbooks]);
    setIsCreateDrawerOpen(false);
    setNewTitle("");
    toast.success(`Created playbook "${created.title}" successfully!`);
  };

  const handleRunSimulation = () => {
    const persona = personas.find((p) => p.id === simPersona) || personas[0];
    const targetPb = selectedPlaybookForSim || playbooks[0];

    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const generatedMsg = newCustomMessage
        .replace("{customer_name}", persona.name)
        .replace("{reward}", targetPb.rewardValue)
        .replace("{code}", "WIN" + Math.floor(1000 + Math.random() * 9000));

      setSimResult({
        triggered: true,
        customerName: persona.name,
        phone: persona.phone,
        message: generatedMsg,
        timestamp: new Date().toLocaleTimeString()
      });
      toast.success(`Simulation matched criteria! Trigger dispatched to ${persona.name}`);
    }, 900);
  };

  const filteredPlaybooks = playbooks.filter((p) => {
    if (activeTab === "active") return p.active;
    if (activeTab === "paused") return !p.active;
    return true;
  });

  const totalRevenue = playbooks.reduce((acc, p) => acc + p.revenueGenerated, 0);
  const totalTriggers = playbooks.reduce((acc, p) => acc + p.triggersSent, 0);
  const totalRedeemed = playbooks.reduce((acc, p) => acc + p.redemptions, 0);
  const avgConversion = totalTriggers > 0 ? ((totalRedeemed / totalTriggers) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Growth Automations & Playbooks
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Auto-Pilot
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rules engine that engages high-value and quiet diners at the right moment without manual effort.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedPlaybookForSim(playbooks[0]);
              setIsSimulateDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Play size={14} className="text-amber-500" />
            <span>Simulate Trigger</span>
          </button>

          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={15} />
            <span>Create Custom Playbook</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Playbooks</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Zap size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {playbooks.filter((p) => p.active).length} / {playbooks.length}
          </p>
          <span className="text-xs text-emerald-600 font-bold">24/7 background worker active</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Revenue Influenced</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            ₹{(totalRevenue / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-xs text-emerald-600 font-bold">+28.4% incremental lift</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Redemption Conversion</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {avgConversion}%
          </p>
          <span className="text-xs text-slate-400 font-medium">
            {totalRedeemed.toLocaleString()} of {totalTriggers.toLocaleString()} claimed
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Channels Dispatched</span>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
              <MessageSquare size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            WhatsApp & Push
          </p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">98.2% deliverability</span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Playbooks ({playbooks.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Active ({playbooks.filter((p) => p.active).length})
          </button>
          <button
            onClick={() => setActiveTab("paused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "paused"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Paused ({playbooks.filter((p) => !p.active).length})
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Automations execute on background cron engine
        </span>
      </div>

      {/* Playbooks List */}
      <div className="space-y-4">
        {filteredPlaybooks.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-3xl bg-white dark:bg-[#121626] border transition-all shadow-xs ${
              p.active
                ? "border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900"
                : "border-slate-200/50 dark:border-slate-800/50 opacity-75"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`p-3.5 rounded-2xl shrink-0 mt-1 ${
                    p.active
                      ? "bg-gradient-to-br from-amber-500/10 via-pink-500/10 to-purple-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <Zap size={22} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                      {p.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {p.active ? "Running" : "Paused"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      {p.rewardType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {p.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock size={13} className="text-purple-500" />
                      <span>{p.schedule}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Channels:</span>
                      <div className="flex items-center gap-1">
                        {p.channels.map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Performance Stats & Actions */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-3 gap-3 text-center sm:text-left pr-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dispatched</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.triggersSent.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Claimed</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {p.redemptions.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Revenue</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      ₹{(p.revenueGenerated / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPlaybookForSim(p);
                      setIsSimulateDrawerOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Simulate diner trigger"
                  >
                    <Play size={15} />
                  </button>

                  <button
                    onClick={() => togglePlaybook(p.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      p.active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {p.active ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <Pause size={13} />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deletePlaybook(p.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Playbook"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PLAYBOOK RIGHT SLIDE-OVER DRAWER */}
      {isCreateDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCreateDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-md">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Custom Growth Playbook
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure automated triggers, dynamic offers, and dispatch channels
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleCreatePlaybook} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Strategy Template */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Growth Automation Strategy
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "winback", label: "Win-back Inactive Diners", icon: Clock },
                      { id: "highvalue", label: "High Spender VIP Delight", icon: Sparkles },
                      { id: "slowhours", label: "Fill Slow Lunch Hours", icon: Zap },
                      { id: "milestone", label: "Milestone 5th Visit", icon: Gift },
                      { id: "birthday", label: "Birthday / Anniversary", icon: Users }
                    ].map((strat) => {
                      const Icon = strat.icon;
                      return (
                        <button
                          key={strat.id}
                          type="button"
                          onClick={() => {
                            setNewCategory(strat.id as any);
                            if (strat.id === "winback") setNewTitle("Win-back Inactive Diners");
                            if (strat.id === "highvalue") setNewTitle("High Bill VIP Surprise");
                            if (strat.id === "slowhours") setNewTitle("Weekday Lunch Rush Boost");
                            if (strat.id === "milestone") setNewTitle("5th Visit Milestone Celebration");
                            if (strat.id === "birthday") setNewTitle("Birthday Dine-In Special");
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                            newCategory === strat.id
                              ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon size={16} className="shrink-0 mt-0.5" />
                          <span className="text-xs leading-snug">{strat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Playbook Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Win-back Weekend Diners"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>

                {/* Condition Logic */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Sliders size={14} className="text-purple-500" />
                    <span>Trigger Rules & Conditions</span>
                  </div>

                  {newCategory === "winback" && (
                    <div>
                      <label className="text-slate-500 block mb-1">
                        Days since last visit at any store branch:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="3"
                          max="90"
                          value={newTriggerDays}
                          onChange={(e) => setNewTriggerDays(e.target.value)}
                          className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                        />
                        <span className="text-slate-600 dark:text-slate-400">days of inactivity</span>
                      </div>
                    </div>
                  )}

                  {newCategory === "highvalue" && (
                    <div>
                      <label className="text-slate-500 block mb-1">
                        Minimum UPI transaction threshold:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">₹</span>
                        <input
                          type="number"
                          step="100"
                          value={newMinSpend}
                          onChange={(e) => setNewMinSpend(e.target.value)}
                          className="w-28 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                        />
                        <span className="text-slate-600 dark:text-slate-400">bill total</span>
                      </div>
                    </div>
                  )}

                  {newCategory === "slowhours" && (
                    <p className="text-slate-500">
                      Automatically activates discovery boost + 20% discount on PINAK consumer app weekdays between 12:00 PM – 2:30 PM.
                    </p>
                  )}

                  {newCategory === "milestone" && (
                    <p className="text-slate-500">
                      Automatically checks customer counter payment count and fires when visit count reaches 5.
                    </p>
                  )}
                </div>

                {/* Reward Offered */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Incentive / Reward Value
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹150 Flat Off"
                      value={newRewardValue}
                      onChange={(e) => setNewRewardValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reward Format
                    </label>
                    <select
                      value={newRewardType}
                      onChange={(e) => setNewRewardType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="discount">Direct Bill Discount (₹)</option>
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="item">Free Item / Dessert</option>
                      <option value="points">2× Loyalty Stamp Bonus</option>
                    </select>
                  </div>
                </div>

                {/* Communication Channels */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Dispatch Channels
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "whatsapp", label: "WhatsApp API", sub: "92% Open Rate" },
                      { id: "push", label: "App Push", sub: "Zero Cost" },
                      { id: "sms", label: "SMS Broadcast", sub: "100% Reach" }
                    ].map((chan) => (
                      <button
                        key={chan.id}
                        type="button"
                        onClick={() => handleChannelToggle(chan.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          newChannels.includes(chan.id as any)
                            ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold"
                            : "border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{chan.label}</span>
                          {newChannels.includes(chan.id as any) && (
                            <CheckCircle2 size={12} className="text-purple-600" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{chan.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Copy */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Message Template
                    </label>
                    <span className="text-[10px] text-slate-400">Tokens: &#123;customer_name&#125;, &#123;reward&#125;, &#123;code&#125;</span>
                  </div>
                  <textarea
                    rows={3}
                    value={newCustomMessage}
                    onChange={(e) => setNewCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono leading-relaxed"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    <Zap size={15} />
                    <span>Deploy & Activate Playbook</span>
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* SIMULATE TRIGGER RIGHT SLIDE-OVER DRAWER */}
      {isSimulateDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSimulateDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Play size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Simulate Playbook Trigger
                    </h3>
                    <p className="text-xs text-slate-500">
                      Test automated rules engine against customer profiles
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSimulateDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Pick Playbook */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Target Playbook
                  </label>
                  <select
                    value={selectedPlaybookForSim?.id || playbooks[0].id}
                    onChange={(e) => {
                      const found = playbooks.find((p) => p.id === e.target.value);
                      if (found) setSelectedPlaybookForSim(found);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {playbooks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.rewardType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Persona selector */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Pick Customer Persona to Test
                  </label>
                  <div className="space-y-2">
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        onClick={() => setSimPersona(persona.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          simPersona === persona.id
                            ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {persona.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {persona.phone} · {persona.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Spend</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            ₹{persona.spend.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  {isSimulating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Evaluate & Fire Trigger Now</span>
                    </>
                  )}
                </button>

                {/* Output Simulation Preview */}
                {simResult && (
                  <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 size={13} />
                        Dispatched at {simResult.timestamp}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        WhatsApp + Push
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                      <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                        Store Promotion Notification
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {simResult.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        Diner can redeem by scanning counter QR or clicking UPI link.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
