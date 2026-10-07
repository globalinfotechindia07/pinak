import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Store,
  Building2,
  TicketPercent,
  WalletCards,
  Sparkles,
  Users,
  Tag,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ArrowUpRight,
  Zap,
  QrCode,
  Receipt,
  Send,
  X,
  LogOut,
  UserCheck
} from "lucide-react";
import { UserRole, AdminPermissions, ADMIN_PERMISSION_KEYS } from "../../types";
import { getPathForTab } from "../../lib/routes";
import { useAppStore } from "../../hooks/useAppStore";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAI: () => void;
  onLogout?: () => void;
  pendingOffersCount: number;
  pendingMerchantsCount: number;
  pendingStoresCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  role,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenAI,
  onLogout,
  pendingOffersCount,
  pendingMerchantsCount,
  pendingStoresCount
}) => {
  const store = useAppStore();

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    count?: number;
    requiredPermissions?: (keyof AdminPermissions)[];
  }

  const adminNav: NavItem[] = [
    { id: "Overview", label: "Overview", icon: LayoutDashboard },
    { id: "Discovery", label: "Discovery Control", icon: MapPin, requiredPermissions: ["canModerateOffers", "canConfigurePlatform"] },
    { id: "Merchants", label: "Merchants & KYC", icon: Building2, count: pendingMerchantsCount, requiredPermissions: ["canManageMerchants", "canVerifyKYC"] },
    { id: "Stores", label: "Stores & Branches", icon: Store, count: pendingStoresCount, requiredPermissions: ["canManageMerchants"] },
    { id: "Offers", label: "Offers & Approval", icon: TicketPercent, count: pendingOffersCount, requiredPermissions: ["canModerateOffers"] },
    { id: "Transactions", label: "UPI Transactions", icon: WalletCards, requiredPermissions: ["canViewFinancials"] },
    { id: "Rewards", label: "Rewards Economy", icon: Sparkles, requiredPermissions: ["canViewFinancials", "canConfigurePlatform"] },
    { id: "Customers", label: "Customer Base", icon: Users, requiredPermissions: ["canManageMerchants", "canModerateOffers", "canViewFinancials"] },
    { id: "Categories", label: "Categories", icon: Tag, requiredPermissions: ["canManageTaxonomy"] },
    { id: "AdminStaff", label: "Platform Staff & Roles", icon: UserCheck, requiredPermissions: ["canManageStaff"] },
    { id: "Audit", label: "Audit & RBAC", icon: ShieldCheck, requiredPermissions: ["canConfigurePlatform", "canManageStaff"] },
    { id: "Settings", label: "Settings", icon: Settings, requiredPermissions: ["canConfigurePlatform"] },
  ];

  const storeNav: NavItem[] = [
    { id: "StoreDashboard", label: "Branch Overview", icon: LayoutDashboard },
    { id: "StoreStaff", label: "In-Store Staff & Roles", icon: UserCheck },
    { id: "CounterQR", label: "Counter QR Standee", icon: QrCode },
    { id: "LiveBilling", label: "Live Redemptions", icon: Receipt },
    { id: "StoreSettings", label: "Branch Timings & Info", icon: Settings },
  ];

  const merchantNav: NavItem[] = [
    { id: "MerchantDashboard", label: "Console Overview", icon: LayoutDashboard },
    { id: "BranchStores", label: "Branch Stores", icon: Store },
    { id: "StoreStaff", label: "Staff & Custom Roles", icon: UserCheck },
    { id: "OfferStudio", label: "Offer Studio", icon: TicketPercent },
    { id: "CounterQR", label: "Counter QR Standee", icon: QrCode },
    { id: "LiveBilling", label: "Live Redemptions", icon: Receipt },
    { id: "CustomerLoyalty", label: "Customer Loyalty", icon: Users },
    { id: "GrowthPlaybooks", label: "Growth Automations", icon: Zap },
    { id: "Messaging", label: "Messaging Campaigns", icon: Send },
    { id: "MerchantProfile", label: "Store Profile & Payout", icon: Building2 },
  ];

  const userInitials = React.useMemo(() => {
    const raw = store.currentUser?.name?.trim();
    if (!raw) return role === "admin" ? "SA" : role === "store" ? "ST" : "MP";
    const parts = raw.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  }, [store.currentUser?.name, role]);

  const filteredAdminNav = React.useMemo(() => {
    const user = store.currentUser;
    // Only genuine Super Admin has unrestricted access to all modules
    const isSuperAdmin =
      user?.email?.toLowerCase() === "riya.admin@pinak.app" ||
      user?.staffRoleId === "SUPERADMIN";

    if (user?.status === "SUSPENDED") {
      return [];
    }

    if (isSuperAdmin) {
      return adminNav;
    }

    const perms = user?.permissions || {};
    const hasAnyPermission = ADMIN_PERMISSION_KEYS.some((key) => perms[key] === true);

    // If staff member has no permissions assigned, show NO modules in sidebar
    if (!hasAnyPermission) {
      return [];
    }

    return adminNav.filter((item) => {
      if (item.id === "Overview") return hasAnyPermission;
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) return false;
      return item.requiredPermissions.some((key) => perms[key] === true);
    });
  }, [store.currentUser, pendingMerchantsCount, pendingStoresCount, pendingOffersCount]);

  const items: NavItem[] =
    role === "store" ? storeNav : role === "merchant" ? merchantNav : filteredAdminNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r bg-white dark:bg-[#111422] border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sticky Sidebar Logo Header: Always pinned at the top */}
        <div className="sticky top-0 z-20 flex items-center justify-between h-[68px] px-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#111422]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="brand-mark shrink-0">P</div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-base font-['Manrope'] text-slate-900 dark:text-white leading-none">
                  PINAK
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                  Rewards Super-App
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Container: Switcher, Navigation, and AI Banner scroll underneath sticky header */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 select-none">

          {/* Navigation Items */}
          <div className="flex-1 px-2 py-3 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {role === "admin" ? "Platform Modules" : "Store Management"}
              </div>
            )}

            {items.length === 0 && role === "admin" && (
              <div className="p-3 text-center rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 my-2">
                <ShieldCheck size={20} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                {!isCollapsed && (
                  <>
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">No Modules Permitted</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      All administrative permissions have been removed for this account.
                    </p>
                  </>
                )}
              </div>
            )}

            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  data-path={getPathForTab(role, item.id)}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-pink-50/80 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 ${
                      isActive ? "text-pink-600 dark:text-pink-400" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!isCollapsed && Boolean(item.count && item.count > 0) && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* AI Assistant Banner */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto shrink-0">
            {!isCollapsed ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-900 via-purple-900 to-pink-900 text-white relative overflow-hidden shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={16} className="text-amber-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-200">
                    PINAK AI Assistant
                  </span>
                </div>
                <p className="text-xs text-white/80 line-clamp-2 mb-3">
                  Instant analytics, discovery trends, and growth playbooks.
                </p>
                <button
                  onClick={onOpenAI}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors"
                >
                  <span>Ask AI Copilot</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAI}
                className="w-full flex justify-center p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                title="Open PINAK AI"
              >
                <Sparkles size={18} />
              </button>
            )}
          </div>

          {/* User Account & Logout Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            {!isCollapsed ? (
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                      role === "admin"
                        ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                        : role === "store"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : "bg-gradient-to-br from-pink-500 to-rose-600"
                    }`}
                  >
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {store.currentUser?.name ||
                        (role === "admin"
                          ? "Platform Admin"
                          : role === "store"
                          ? "Store Branch Desk"
                          : (store.merchants[0]?.businessName || "Merchant Partner"))}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {store.currentUser?.email ||
                        (role === "admin"
                          ? "admin@pinak.app"
                          : "partner@pinak.app")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                  title="Sign out of console"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
