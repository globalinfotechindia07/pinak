import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockStore } from "../hooks/useMockStore";
import { UserRole } from "../types";
import { Sidebar } from "../features/layout/Sidebar";
import { Topbar } from "../features/layout/Topbar";
import { NotificationDrawer } from "../features/layout/NotificationDrawer";
import { AIAssistantDrawer } from "../features/layout/AIAssistantDrawer";
import { Login } from "./Login";

// Admin Feature Modules
import { OverviewDashboard } from "../features/admin/OverviewDashboard";
import { MerchantNetwork } from "../features/admin/MerchantNetwork";
import { StoreManagement } from "../features/admin/StoreManagement";
import { OfferGovernance } from "../features/admin/OfferGovernance";
import { DiscoveryControl } from "../features/admin/DiscoveryControl";
import { TransactionMonitor } from "../features/admin/TransactionMonitor";
import { RewardsEconomy } from "../features/admin/RewardsEconomy";
import { CategoryManager } from "../features/admin/CategoryManager";
import { CustomerInsights } from "../features/admin/CustomerInsights";
import { AuditSecurity } from "../features/admin/AuditSecurity";
import { WorkspaceSettings } from "../features/admin/WorkspaceSettings";

// Merchant Feature Modules
import { MerchantDashboard } from "../features/merchant/MerchantDashboard";
import { BranchStores } from "../features/merchant/BranchStores";
import { OfferStudio } from "../features/merchant/OfferStudio";
import { LiveBillingFeed } from "../features/merchant/LiveBillingFeed";
import { CustomerLoyalty } from "../features/merchant/CustomerLoyalty";
import { GrowthPlaybooks } from "../features/merchant/GrowthPlaybooks";
import { MessagingCampaigns } from "../features/merchant/MessagingCampaigns";
import { MerchantProfile } from "../features/merchant/MerchantProfile";
import { CounterQRModal } from "../features/merchant/CounterQRModal";

import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import { categoryApi } from "../api/categoryApi";
import { storeApi } from "../api/storeApi";
import { merchantApi } from "../api/merchantApi";

export default function Home() {
  const store = useMockStore();
  const { theme, toggleTheme } = useTheme();

  // Navigation tab states
  const [adminTab, setAdminTab] = useState("Overview");
  const [merchantTab, setMerchantTab] = useState("MerchantDashboard");

  // Layout UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("pinak_sidebar_collapsed") === "true";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  // Sync tab with role
  const currentTab = store.role === "admin" ? adminTab : merchantTab;
  const setCurrentTab = (tab: string) => {
    if (tab === "CounterQR") {
      setIsQROpen(true);
      return;
    }
    if (store.role === "admin") {
      setAdminTab(tab);
    } else {
      setMerchantTab(tab);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pinak_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    store.setRole(newRole);
    toast.success(`Switched to ${newRole === "admin" ? "Platform Admin" : "Merchant Console"} workspace`);
  };

  // Keyboard shortcuts (⌘K for AI, ⌘B for sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAIOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live Spring Boot backend synchronization
  useEffect(() => {
    if (!store.isAuthenticated) return;

    // 1. Fetch categories from Spring Boot
    categoryApi
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          console.log("[Pinak API] Sync successful: categories loaded from backend:", cats.length);
        }
      })
      .catch((err) => {
        console.info("[Pinak API] Backend categories endpoint:", err.message);
      });

    // 2. Fetch merchant stores / profile
    if (store.role === "merchant") {
      storeApi
        .getMyStores()
        .then((backendStores) => {
          if (Array.isArray(backendStores) && backendStores.length > 0) {
            console.log("[Pinak API] Sync successful: merchant stores loaded from backend:", backendStores.length);
          }
        })
        .catch(() => {});
    }
  }, [store.isAuthenticated, store.role]);

  // Live API handlers for Category & Store actions
  const handleAddCategory = async (draft: any) => {
    try {
      await categoryApi.createCategory({
        name: draft.name || "New Category",
        slug: (draft.name || "new-category").toLowerCase().replace(/\s+/g, "-"),
        parentId: draft.parentId,
        description: draft.description,
        status: "ACTIVE",
      });
      toast.success(`Category "${draft.name}" saved to Spring Boot backend!`);
    } catch (apiErr: any) {
      console.warn("Backend category create failed, saving to local store:", apiErr.message);
    }
    store.addCategory(draft);
  };

  const handleAddStore = async (draft: any) => {
    try {
      await storeApi.createStore({
        storeName: draft.name || "New Branch",
        contactPhone: draft.phone || "9876543210",
        address: draft.address || "Main Street",
        cityId: draft.city || "Nagpur",
        state: "Maharashtra",
        pincode: draft.pincode || "440001",
        latitude: draft.latitude || 21.1458,
        longitude: draft.longitude || 79.0882,
        openingTime: draft.openingTime || "09:00",
        closingTime: draft.closingTime || "22:00",
      });
      toast.success(`Branch "${draft.name}" submitted to Spring Boot backend!`);
    } catch (apiErr: any) {
      console.warn("Backend store create failed, saving to local store:", apiErr.message);
    }
    store.addStore(draft);
  };

  const handleApproveStore = async (id: string) => {
    try {
      await storeApi.approveStoreAdmin(id);
      toast.success("Store branch approved on backend!");
    } catch (err: any) {
      console.warn("Backend store approval:", err.message);
    }
    store.approveStore(id);
  };

  const handleUpdateKyc = async (id: string, status: any) => {
    if (status === "APPROVED") {
      try {
        await merchantApi.approveMerchantAdmin(id);
        toast.success("Merchant approved on backend!");
      } catch (err: any) {
        console.warn("Backend merchant approval:", err.message);
      }
    }
    store.updateMerchantKyc(id, status);
  };

  const pendingOffersCount = store.offers.filter((o) => o.status === "PENDING_APPROVAL").length;
  const pendingMerchantsCount = store.merchants.filter(
    (m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED"
  ).length;
  const pendingStoresCount = store.stores.filter((s) => s.status === "PENDING_APPROVAL").length;
  const unreadNotifications = store.notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    store.logout();
    toast.success("Logged out successfully. Have a great day!");
  };

  // If user is logged out, render the Login screen
  if (!store.isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] dark:bg-[#0c0e17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        role={store.role}
        onSwitchRole={handleRoleSwitch}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenAI={() => setIsAIOpen(true)}
        onLogout={handleLogout}
        pendingOffersCount={pendingOffersCount}
        pendingMerchantsCount={pendingMerchantsCount}
        pendingStoresCount={pendingStoresCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          role={store.role}
          onSwitchRole={handleRoleSwitch}
          isDark={theme === "dark"}
          onToggleTheme={() => toggleTheme?.()}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadCount={unreadNotifications}
          onResetDemo={() => {
            store.resetToDefaults();
            toast.success("Demo dataset reset to original seeds!");
          }}
          onLogout={handleLogout}
        />

        {/* Page Body with Motion Transition */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${store.role}-${currentTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* ADMIN VIEWS */}
              {store.role === "admin" && (
                <>
                  {currentTab === "Overview" && (
                    <OverviewDashboard
                      merchants={store.merchants}
                      stores={store.stores}
                      offers={store.offers}
                      transactions={store.transactions}
                      onNavigateTab={setCurrentTab}
                      onApproveMerchant={(id) => store.updateMerchantKyc(id, "APPROVED")}
                      onApproveOffer={(id) => store.updateOfferStatus(id, "ACTIVE")}
                    />
                  )}

                  {currentTab === "Discovery" && (
                    <DiscoveryControl stores={store.stores} offers={store.offers} />
                  )}

                  {currentTab === "Merchants" && (
                    <MerchantNetwork
                      merchants={store.merchants}
                      onAddMerchant={store.addMerchant}
                      onUpdateKyc={handleUpdateKyc}
                    />
                  )}

                  {currentTab === "Stores" && (
                    <StoreManagement
                      stores={store.stores}
                      merchants={store.merchants}
                      onAddStore={handleAddStore}
                      onApproveStore={handleApproveStore}
                    />
                  )}

                  {currentTab === "Offers" && (
                    <OfferGovernance
                      offers={store.offers}
                      merchants={store.merchants}
                      onAddOffer={store.addOffer}
                      onUpdateOfferStatus={store.updateOfferStatus}
                    />
                  )}

                  {currentTab === "Transactions" && (
                    <TransactionMonitor transactions={store.transactions} />
                  )}

                  {currentTab === "Rewards" && (
                    <RewardsEconomy
                      rewardRules={store.rewardRules}
                      customers={store.customers}
                      onAddRule={store.addRewardRule}
                    />
                  )}

                  {currentTab === "Customers" && (
                    <CustomerInsights customers={store.customers} />
                  )}

                  {currentTab === "Categories" && (
                    <CategoryManager
                      categories={store.categories}
                      onAddCategory={handleAddCategory}
                    />
                  )}

                  {currentTab === "Audit" && (
                    <AuditSecurity auditLogs={store.auditLogs} />
                  )}

                  {currentTab === "Settings" && <WorkspaceSettings />}
                </>
              )}

              {/* MERCHANT VIEWS */}
              {store.role === "merchant" && (
                <>
                  {currentTab === "MerchantDashboard" && (
                    <MerchantDashboard
                      stores={store.stores}
                      offers={store.offers}
                      transactions={store.transactions}
                      onNavigateTab={setCurrentTab}
                      onOpenQR={() => setIsQROpen(true)}
                    />
                  )}

                  {currentTab === "BranchStores" && (
                    <BranchStores stores={store.stores} onAddStore={handleAddStore} />
                  )}

                  {currentTab === "OfferStudio" && (
                    <OfferStudio
                      offers={store.offers}
                      stores={store.stores}
                      onAddOffer={store.addOffer}
                      onOpenQR={() => setIsQROpen(true)}
                    />
                  )}

                  {currentTab === "LiveBilling" && (
                    <LiveBillingFeed
                      transactions={store.transactions}
                      offers={store.offers}
                      onRecordTransaction={store.recordTransaction}
                    />
                  )}

                  {currentTab === "CustomerLoyalty" && <CustomerLoyalty />}

                  {currentTab === "GrowthPlaybooks" && <GrowthPlaybooks />}

                  {currentTab === "Messaging" && <MessagingCampaigns />}

                  {currentTab === "MerchantProfile" && <MerchantProfile />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Drawers & Modals */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={store.notifications}
        onMarkAllRead={store.markAllNotificationsRead}
      />

      <AIAssistantDrawer isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      <CounterQRModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        businessName="The Curry Leaf"
        upiVpa="thecurryleaf@icici"
      />
    </div>
  );
}
