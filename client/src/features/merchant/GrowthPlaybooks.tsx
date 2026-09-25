import React, { useState } from "react";
import { Zap, ShieldCheck, Clock, CheckCircle2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export const GrowthPlaybooks: React.FC = () => {
  const [playbooks, setPlaybooks] = useState([
    {
      id: "pb-1",
      title: "Win-back Quiet Diners",
      desc: "Send a ₹150 lunch discount to customers who haven't visited in 14 days.",
      schedule: "Every Monday · 11:30 AM",
      active: true
    },
    {
      id: "pb-2",
      title: "Celebrate High-Value Orders",
      desc: "Trigger a complimentary dessert coupon after any bill exceeding ₹1,800.",
      schedule: "After eligible order",
      active: true
    },
    {
      id: "pb-3",
      title: "Fill Slow Lunch Hours",
      desc: "Boost discovery ranking by 2× on PINAK App between 12:00 PM – 2:00 PM.",
      schedule: "Weekdays · 11:45 AM",
      active: false
    }
  ]);

  const togglePlaybook = (id: string) => {
    setPlaybooks(
      playbooks.map((p) => {
        if (p.id === id) {
          const next = !p.active;
          toast.success(`${p.title} ${next ? "activated" : "paused"} in demo automation engine.`);
          return { ...p, active: next };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
          Growth Automation & Playbooks
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Set rules that automatically engage diners at the right time without manual marketing effort.
        </p>
      </div>

      <div className="space-y-4">
        {playbooks.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mt-0.5">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-lg">
                  {p.desc}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  <Clock size={12} />
                  <span>{p.schedule}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => togglePlaybook(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto ${
                p.active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {p.active ? "Active Playbook" : "Enable Playbook"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
