import React, { useState } from "react";
import { Send, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const MessagingCampaigns: React.FC = () => {
  const [segment, setSegment] = useState("Regulars (842 diners)");
  const [campaignTitle, setCampaignTitle] = useState("Weekend Feast Reward");
  const [messageText, setMessageText] = useState(
    "Your next dinner is on us! Enjoy ₹200 off your bill at The Curry Leaf this weekend. Scan & pay via UPI."
  );

  const handleSend = () => {
    toast.success("Push notification broadcast queued in demo queue for " + segment + "!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
          Customer Messaging & Broadcasts
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Send targeted app notifications and WhatsApp/SMS deals to your verified diner segments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
            Draft Promotion
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Audience Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                <option>Regulars (842 diners)</option>
                <option>Lunch Crowd (318 diners)</option>
                <option>At Risk &gt;14d (88 diners)</option>
                <option>All Past Customers (1,248 diners)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Campaign Title</label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Message Content</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed"
                rows={4}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {messageText.length} characters · 1 SMS segment equivalent
              </span>
            </div>

            <button
              onClick={handleSend}
              className="btn-gradient flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-xs font-bold shadow-md"
            >
              <Send size={15} />
              <span>Broadcast Campaign to {segment}</span>
            </button>
          </div>
        </div>

        {/* Live Phone Preview */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400">
            <Smartphone size={16} />
            <span>Mobile Push Preview</span>
          </div>

          <div className="w-64 rounded-3xl p-3 bg-slate-950 border-4 border-slate-700 shadow-2xl relative">
            <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-4" />

            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1.5 shadow-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-pink-400 font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                PINAK DEALS · THE CURRY LEAF
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                {campaignTitle}
              </p>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                {messageText}
              </p>
              <span className="text-[9px] text-slate-400 block pt-1">
                Tap to claim & pay via UPI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
