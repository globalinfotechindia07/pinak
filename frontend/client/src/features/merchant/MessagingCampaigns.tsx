import React, { useState } from "react";
import {
  Send,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  TrendingUp,
  Percent,
  Plus,
  Clock,
  Eye,
  X,
  Store,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Copy,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

interface BroadcastCampaign {
  id: string;
  title: string;
  segment: string;
  channel: "push" | "whatsapp" | "sms" | "all";
  branch: string;
  sentAt: string;
  recipients: number;
  deliveredRate: string;
  openRate: string;
  redemptions: number;
  revenue: number;
  status: "DELIVERED" | "SCHEDULED" | "DRAFT";
  messageText: string;
}

export const MessagingCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>(() => {
    try {
      const saved = localStorage.getItem("pinak_broadcast_campaigns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Drawer States
  const [isComposeDrawerOpen, setIsComposeDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null);

  // Compose Form States
  const [newTitle, setNewTitle] = useState("");
  const [newSegment, setNewSegment] = useState("All Active Diners");
  const [newBranch, setNewBranch] = useState("All Outlets");
  const [newChannel, setNewChannel] = useState<BroadcastCampaign["channel"]>("all");
  const [newMessageText, setNewMessageText] = useState("");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
  const totalRecipients = campaigns.reduce((acc, c) => acc + c.recipients, 0);
  const totalRedemptions = campaigns.reduce((acc, c) => acc + c.redemptions, 0);

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a campaign title.");
      return;
    }

    const recipientsMap: Record<string, number> = {
      "Regular Diners (842)": 842,
      "Lunch Crowd (318)": 318,
      "VIP Tier Customers (140)": 140,
      "Inactive >14 Days (188)": 188,
      "All Verified Diners (1,248)": 1248
    };

    const count = recipientsMap[newSegment] || 500;

    const newBroadcast: BroadcastCampaign = {
      id: `bc-${Date.now()}`,
      title: newTitle.trim(),
      segment: newSegment,
      channel: newChannel,
      branch: newBranch,
      sentAt: scheduleType === "now" ? new Date().toISOString().replace("T", " ").substring(0, 16) : scheduledDateTime.replace("T", " "),
      recipients: count,
      deliveredRate: scheduleType === "now" ? "99.4%" : "Pending",
      openRate: scheduleType === "now" ? "42.0%" : "—",
      redemptions: 0,
      revenue: 0,
      status: scheduleType === "now" ? "DELIVERED" : "SCHEDULED",
      messageText: newMessageText
    };

    setCampaigns([newBroadcast, ...campaigns]);
    setIsComposeDrawerOpen(false);
    setNewTitle("");
    toast.success(
      scheduleType === "now"
        ? `Broadcast dispatched successfully to ${count} recipients in ${newSegment}!`
        : `Campaign scheduled for ${scheduledDateTime.replace("T", " ")}.`
    );
  };

  const handleDuplicate = (c: BroadcastCampaign) => {
    setNewTitle(`${c.title} (Copy)`);
    setNewSegment(c.segment);
    setNewBranch(c.branch);
    setNewChannel(c.channel);
    setNewMessageText(c.messageText);
    setIsComposeDrawerOpen(true);
  };

  const columns: Column<BroadcastCampaign>[] = [
    {
      header: "Campaign Name & Segment",
      accessor: "title",
      sortable: true,
      render: (c: BroadcastCampaign) => (
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mt-0.5">
            <MessageSquare size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block hover:text-pink-600 cursor-pointer"
                  onClick={() => { setSelectedCampaign(c); setIsDetailDrawerOpen(true); }}>
              {c.title}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {c.segment} · {c.branch}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Channel",
      accessor: "channel",
      render: (c: BroadcastCampaign) => {
        const channelStyles: Record<string, { label: string; cls: string }> = {
          all: { label: "Multi-Channel", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
          whatsapp: { label: "WhatsApp", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
          push: { label: "App Push", cls: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300" },
          sms: { label: "SMS", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" }
        };
        const st = channelStyles[c.channel] || channelStyles.push;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
            {st.label}
          </span>
        );
      }
    },
    {
      header: "Sent / Scheduled",
      accessor: "sentAt",
      sortable: true,
      render: (c: BroadcastCampaign) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {c.sentAt}
        </span>
      )
    },
    {
      header: "Audience",
      accessor: "recipients",
      sortable: true,
      render: (c: BroadcastCampaign) => (
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {c.recipients.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {c.deliveredRate} delivered
          </span>
        </div>
      )
    },
    {
      header: "Open / Click",
      accessor: "openRate",
      render: (c: BroadcastCampaign) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {c.openRate}
        </span>
      )
    },
    {
      header: "Redemptions & Sales",
      accessor: "revenue",
      sortable: true,
      render: (c: BroadcastCampaign) => (
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {c.redemptions} claimed
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            ₹{c.revenue.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (c: BroadcastCampaign) => (
        <Badge
          className={cn(
            "badge-status text-[11px] border shadow-none",
            c.status === "DELIVERED"
              ? "badge-approved"
              : c.status === "SCHEDULED"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          {c.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      render: (c: BroadcastCampaign) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedCampaign(c);
              setIsDetailDrawerOpen(true);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleDuplicate(c)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors"
            title="Clone Campaign"
          >
            <Copy size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Compose Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Customer Messaging & Broadcasts
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
              Direct Reach
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Send targeted app notifications, WhatsApp updates, and SMS alerts to verified diner groups.
          </p>
        </div>

        <button
          onClick={() => setIsComposeDrawerOpen(true)}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Send size={15} />
          <span>Compose New Broadcast</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Broadcasts</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <MessageSquare size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {campaigns.length} Campaigns
          </p>
          <span className="text-xs text-emerald-600 font-bold">100% compliant opt-in audience</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Diners Reached</span>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {totalRecipients.toLocaleString()}
          </p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">98.4% average delivery</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Open Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            48.6%
          </p>
          <span className="text-xs text-slate-400 font-medium">3.8× higher than generic email</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Attributed Revenue</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            ₹{(totalRevenue / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-xs text-emerald-600 font-bold">{totalRedemptions} direct redemptions</span>
        </div>
      </div>

      {/* Broadcast Campaigns Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
          Broadcast History & Engagement Metrics
        </h3>
        <AdvancedTable
          data={campaigns}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search broadcasts by title, segment, or branch..."
          searchFilter={(c: BroadcastCampaign, q: string) =>
            c.title.toLowerCase().includes(q) ||
            c.segment.toLowerCase().includes(q) ||
            c.branch.toLowerCase().includes(q) ||
            c.status.toLowerCase().includes(q)
          }
          defaultPageSize={5}
        />
      </div>

      {/* COMPOSE BROADCAST RIGHT SLIDE-OVER DRAWER */}
      {isComposeDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsComposeDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md">
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Compose Customer Broadcast
                    </h3>
                    <p className="text-xs text-slate-500">
                      Draft messages, attach offers, and preview on mobile
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsComposeDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleCreateBroadcast} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Campaign Title */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Feast Surprise"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>

                {/* Audience Segment & Branch */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Audience Segment
                    </label>
                    <select
                      value={newSegment}
                      onChange={(e) => setNewSegment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option>Regular Diners (842)</option>
                      <option>Lunch Crowd (318)</option>
                      <option>VIP Tier Customers (140)</option>
                      <option>Inactive &gt;14 Days (188)</option>
                      <option>All Verified Diners (1,248)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Target Store Branch
                    </label>
                    <select
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option>All 3 Branches</option>
                      <option>Dharampeth Flagship</option>
                      <option>Civil Lines Garden</option>
                      <option>FC Road, Pune</option>
                    </select>
                  </div>
                </div>

                {/* Channel selection */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Delivery Channel
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "all", label: "Omnichannel" },
                      { id: "push", label: "App Push" },
                      { id: "whatsapp", label: "WhatsApp" },
                      { id: "sms", label: "SMS" }
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setNewChannel(ch.id as any)}
                        className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                          newChannel === ch.id
                            ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-300"
                            : "border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Message Content
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {newMessageText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                  />
                </div>

                {/* Dispatch Schedule */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Broadcast Timing
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="schedule"
                        checked={scheduleType === "now"}
                        onChange={() => setScheduleType("now")}
                        className="text-pink-600"
                      />
                      <span>Send Immediately</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="schedule"
                        checked={scheduleType === "later"}
                        onChange={() => setScheduleType("later")}
                        className="text-pink-600"
                      />
                      <span>Schedule for Later</span>
                    </label>
                  </div>

                  {scheduleType === "later" && (
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  )}
                </div>

                {/* Live Mobile Push Preview Card */}
                <div className="p-4 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                    <Smartphone size={13} />
                    <span>Real-time Mobile Notification Preview</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        PINAK DEALS · MERCHANT PARTNER
                      </span>
                      <span>Now</span>
                    </div>
                    <p className="text-xs font-bold text-white">{newTitle || "Campaign Title Preview"}</p>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                      {newMessageText}
                    </p>
                    <span className="text-[9px] text-slate-400 block pt-0.5">
                      Tap to view offer & pay at counter via UPI
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>
                    {scheduleType === "now" ? "Broadcast Campaign Now" : "Schedule Campaign"}
                  </span>
                </button>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAILS RIGHT SLIDE-OVER DRAWER */}
      {isDetailDrawerOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDetailDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-600 text-white shadow-md">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Campaign Performance Audit
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detailed engagement funnel and counter redemptions
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                    {selectedCampaign.title}
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    Target: {selectedCampaign.segment} · {selectedCampaign.branch}
                  </p>
                </div>

                {/* Funnel Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Dispatched</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {selectedCampaign.recipients.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      {selectedCampaign.deliveredRate} delivered
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Open / View Rate</span>
                    <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                      {selectedCampaign.openRate}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">High user engagement</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">In-Store Redemptions</span>
                    <span className="text-lg font-extrabold text-emerald-600">
                      {selectedCampaign.redemptions}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Scanned at counter UPI</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attributed Sales</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      ₹{selectedCampaign.revenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Direct gross volume</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Broadcasted Copy
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                    "{selectedCampaign.messageText}"
                  </div>
                </div>

                {/* Resend / Clone Action */}
                <div className="pt-3">
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleDuplicate(selectedCampaign);
                    }}
                    className="btn-gradient w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <Copy size={14} />
                    <span>Clone & Send to New Audience</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
