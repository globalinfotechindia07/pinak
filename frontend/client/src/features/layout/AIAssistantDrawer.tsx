import React, { useState } from "react";
import { X, Sparkles, Send, Bot, ArrowUpRight, BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { appStore } from "../../services/dataStore";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeResponse, setActiveResponse] = useState<any>(null);

  if (!isOpen) return null;

  const handleQuery = (customPrompt?: string) => {
    const q = (customPrompt || query).toLowerCase().trim();
    if (!q) return;

    const merchants = appStore.getMerchants();
    const stores = appStore.getStores();
    const offers = appStore.getOffers();
    const txs = appStore.getTransactions();

    let result = {
      title: "Discovery & Network Insights",
      summary:
        merchants.length > 0
          ? `Platform currently manages ${merchants.length} partner merchants across ${stores.length} outlets with ${offers.length} active campaigns.`
          : "Network is currently awaiting new merchant registrations. Onboard your first merchant to see discovery analytics.",
      metrics: [
        { label: "Active Merchants", value: `${merchants.length}`, desc: "Verified partners" },
        { label: "Total Stores", value: `${stores.length}`, desc: "Physical outlets" },
        { label: "Live Offers", value: `${offers.length}`, desc: "Active promotions" }
      ],
      recommendation:
        "Ensure all registered outlets have accurate geo-coordinates to optimize customer proximity discovery in the mobile application."
    };

    if (q.includes("offer") || q.includes("discount") || q.includes("campaign")) {
      const topOffer = offers[0];
      result = {
        title: "Offer & Campaign Performance Analysis",
        summary:
          offers.length > 0
            ? `Active campaign portfolio includes ${offers.length} offers. Top offer: "${topOffer?.title || 'Active Deal'}" with ${topOffer?.redemptions || 0} recorded redemptions.`
            : "No active promotional campaigns configured. Create campaigns in Offer Governance to drive customer redemptions.",
        metrics: [
          { label: "Campaign Count", value: `${offers.length}`, desc: "Active offers" },
          { label: "Redemptions", value: `${offers.reduce((a, o) => a + (o.redemptions || 0), 0)}`, desc: "Total claims" },
          { label: "Coverage", value: `${stores.length} outlets`, desc: "Store availability" }
        ],
        recommendation:
          "Keep discount caps under 25% for peak dinner slots to protect merchant profit margins while driving transaction volume."
      };
    } else if (q.includes("merchant") || q.includes("store") || q.includes("branch")) {
      result = {
        title: "Merchant Network & Store Density Analysis",
        summary:
          `Merchant network consists of ${merchants.length} commercial entities and ${stores.length} deployed branch stores. Multi-store architecture provides unified brand discovery.`,
        metrics: [
          { label: "Merchant Brands", value: `${merchants.length}`, desc: "Commercial entities" },
          { label: "Store Outlets", value: `${stores.length}`, desc: "Physical locations" },
          { label: "KYC Verified", value: `${merchants.filter(m => m.kycStatus === "APPROVED").length}`, desc: "Compliance approved" }
        ],
        recommendation:
          "Ensure new merchant branches have verified Google Maps geocodes to prevent customer navigation drop-offs in the React Native app."
      };
    } else if (q.includes("upi") || q.includes("transaction") || q.includes("settlement")) {
      result = {
        title: "UPI Intent & Settlement Health",
        summary:
          "100% of transactions move directly from customer bank to merchant VPA via UPI intent URL. Zero platform pooling ensures client remains outside RBI PA/PPI licensing scope.",
        metrics: [
          { label: "UPI Success", value: "98.4%", desc: "Instant PSP settlement" },
          { label: "Avg Latency", value: "1.4s", desc: "Webhook confirmation" },
          { label: "Settlement", value: "T+0", desc: "Direct bank-to-bank" }
        ],
        recommendation:
          "The fallback polling mechanism (GET /payments/{id}/status) recovers 1.6% of delayed webhook responses within 30 seconds."
      };
    }

    setActiveResponse(result);
    setQuery("");
  };

  const samplePrompts = [
    "Which offer has the highest redemption rate?",
    "Explain the UPI direct settlement architecture",
    "How does the Merchant ≠ Store model benefit discovery?",
    "Recommend my next merchant promotion in Pune"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white shadow-md">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  PINAK AI Copilot
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                    Live Intelligent
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Instant insights from discovery, offers, and ledger data
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Assistant Welcome */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={18} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Welcome to the PINAK Intelligence Center.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ask me about merchant approvals, UPI settlements, nearby store discovery, or how offers perform across cities.
                </p>
              </div>
            </div>

            {/* Quick Prompts */}
            {!activeResponse && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Suggested Questions
                </p>
                <div className="space-y-2">
                  {samplePrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleQuery(p)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-pink-300 dark:hover:border-pink-800/80 bg-white dark:bg-slate-900/40 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-amber-500 shrink-0" />
                        {p}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-slate-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Response */}
            {activeResponse && (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-950/30 dark:to-slate-900/60 border border-purple-200/80 dark:border-purple-900/60 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeResponse.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveResponse(null)}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeResponse.summary}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {activeResponse.metrics.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 text-center"
                    >
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        {m.label}
                      </p>
                      <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {m.value}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {m.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Lightbulb size={13} />
                    Recommended Action
                  </p>
                  <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed">
                    {activeResponse.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuery();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about revenue, offers, stores, UPI..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="btn-gradient p-2.5 rounded-xl text-white shrink-0"
                title="Send query"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};
