import React, { useState } from "react";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Check,
  LogOut
} from "lucide-react";
import { UserRole } from "../../types";

interface TopbarProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  role: UserRole;
  onSwitchRole: (role: UserRole) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onResetDemo: () => void;
  onLogout?: () => void;
  onSearchSelect?: (type: string, id: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  role,
  onSwitchRole,
  isDark,
  onToggleTheme,
  onOpenNotifications,
  unreadCount,
  onResetDemo,
  onLogout
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[68px] px-4 md:px-8 bg-white/80 dark:bg-[#111422]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-400 dark:text-slate-500">
            {role === "admin" ? "Platform Portal" : "Merchant Portal"}
          </span>
          <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
          <span className="font-bold text-slate-900 dark:text-white">
            {currentTab}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Mock Network
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Reset Demo State Button */}
        <button
          onClick={onResetDemo}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-colors"
          title="Restore fresh demo seed dataset"
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1.5 md:px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                role === "admin"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                  : "bg-gradient-to-br from-amber-500 to-rose-600"
              }`}
            >
              {role === "admin" ? "AD" : "TC"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {role === "admin" ? "Riya Shah" : "The Curry Leaf"}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {role === "admin" ? "Super Admin" : "Store Partner"}
              </span>
            </div>
          </button>

          {showRoleMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 p-1.5 rounded-2xl bg-white dark:bg-[#161a2b] shadow-xl border border-slate-200 dark:border-slate-700/80 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Simulate User Session
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Switch roles to test the dual portal
                  </p>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    onClick={() => {
                      onSwitchRole("admin");
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                      role === "admin"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} />
                      <span>Admin Workspace</span>
                    </div>
                    {role === "admin" && <Check size={14} />}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole("merchant");
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                      role === "merchant"
                        ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      <span>Merchant Console</span>
                    </div>
                    {role === "merchant" && <Check size={14} />}
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Sign Out / Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dedicated Fast Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
