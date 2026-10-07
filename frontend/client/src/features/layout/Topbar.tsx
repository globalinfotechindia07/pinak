import React, { useState } from "react";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";
import { UserRole } from "../../types";
import { useAppStore } from "../../hooks/useAppStore";

interface TopbarProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  role: UserRole;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onLogout?: () => void;
  onSearchSelect?: (type: string, id: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  role,
  isDark,
  onToggleTheme,
  onOpenNotifications,
  unreadCount,
  onLogout
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const store = useAppStore();

  const displayName =
    store.currentUser?.name ||
    (role === "admin"
      ? "Platform Admin"
      : role === "store"
      ? "Store Branch Desk"
      : (store.merchants[0]?.businessName || "Merchant Partner"));

  const displayEmail =
    store.currentUser?.email ||
    (role === "admin"
      ? "admin@pinak.app"
      : "partner@pinak.app");

  const roleLabel =
    store.currentUser?.staffRoleName ||
    (role === "admin"
      ? (store.currentUser?.staffRoleId === "SUPERADMIN" ? "Super Admin" : "Platform Staff")
      : role === "store"
      ? "Store Manager"
      : "Merchant Partner");

  const initials = React.useMemo(() => {
    const raw = displayName?.trim();
    if (!raw) return role === "admin" ? "SA" : role === "store" ? "SM" : "MP";
    const parts = raw.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  }, [displayName, role]);

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
            {role === "admin"
              ? "Platform Portal"
              : role === "store"
              ? "Store Branch Portal"
              : "Merchant Brand HQ"}
          </span>
          <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
          <span className="font-bold text-slate-900 dark:text-white">
            {currentTab}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
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

        {/* User Account Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 md:px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                role === "admin"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                  : role === "store"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-pink-500 to-rose-600"
              }`}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {roleLabel}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-white dark:bg-[#161a2b] shadow-xl border border-slate-200 dark:border-slate-700/80 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-pink-600" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate pl-5">
                    {displayEmail}
                  </p>
                  <div className="mt-2 pl-5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Sign Out / Logout</span>
                  </button>
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
