import React from "react";
import { X, Check, Bell, Building2, TicketPercent, WalletCards, Sparkles } from "lucide-react";
import { NotificationItem } from "../../types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time events from mock webhook & ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllRead}
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 px-2 py-1 rounded-md hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
                title="Mark all as read"
              >
                Mark read
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                <Bell size={32} className="stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No pending notifications</p>
              </div>
            ) : (
              notifications.map((item) => {
                const icon =
                  item.type === "merchant" ? (
                    <Building2 size={16} />
                  ) : item.type === "offer" ? (
                    <TicketPercent size={16} />
                  ) : (
                    <WalletCards size={16} />
                  );

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.read
                        ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60"
                        : "bg-white dark:bg-slate-800/80 border-pink-200/80 dark:border-pink-900/60 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          item.type === "merchant"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                            : item.type === "offer"
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}
                      >
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
