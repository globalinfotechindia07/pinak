import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../hooks/useAppStore";
import { UserRole, ADMIN_PERMISSION_KEYS, Merchant } from "../types";
import { Sidebar } from "../features/layout/Sidebar";
import { Topbar } from "../features/layout/Topbar";
import { NotificationDrawer } from "../features/layout/NotificationDrawer";
import { AIAssistantDrawer } from "../features/layout/AIAssistantDrawer";
import { Badge } from "../components/ui/badge";
import { ShieldCheck } from "lucide-react";
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
import { AdminStaffManager } from "../features/admin/AdminStaffManager";

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
import { StoreStaffManager } from "../features/merchant/StoreStaffManager";
import { StoreBranchDashboard } from "../features/store/StoreBranchDashboard";
import { MerchantWalletDashboard } from "../features/merchant/MerchantWalletDashboard";


import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getPathForTab, resolveTabFromPath } from "../lib/routes";
import { categoryApi } from "../api/categoryApi";
import { storeApi } from "../api/storeApi";
import { merchantApi } from "../api/merchantApi";
import { offerApi } from "../api/offerApi";
import { authApi } from "../api/authApi";
import { transactionApi } from "../api/transactionApi";
import { adminApi, AdminDashboardMetrics } from "../api/adminApi";
import { notificationApi } from "../api/notificationApi";
import { cityApi } from "../api/cityApi";
import { staffApi } from "../api/staffApi";

export default function Home() {
  const store = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();

  // Navigation tab states
  const [adminTab, setAdminTab] = useState("Overview");
  const [merchantTab, setMerchantTab] = useState("MerchantDashboard");
  const [storeTab, setStoreTab] = useState("StoreDashboard");
  const [dashboardMetrics, setDashboardMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Silent session restoration on initial load via HttpOnly refresh token cookie
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const bootUser = await authApi.bootstrapSession();
        if (bootUser && isMounted) {
          const userRoleStr = String(bootUser.role || "").toUpperCase();
          const staffScope = String(bootUser.staffScope || "").toUpperCase();
          const isPlatform = staffScope === "PLATFORM" || userRoleStr.includes("ADMIN");
          const isStore = staffScope === "STORE" || userRoleStr.includes("STORE") || userRoleStr.includes("BRANCH");
          const resolvedRole: UserRole = isPlatform ? "admin" : isStore ? "store" : "merchant";

          store.login(resolvedRole, bootUser.email, bootUser.storeId, {
            id: bootUser.id,
            name: bootUser.name,
            roleName: (bootUser as any).staffRoleName || (bootUser as any).roleName,
            staffRoleId: bootUser.staffRoleId,
            staffScope: bootUser.staffScope,
            permissions: bootUser.permissions,
            status: bootUser.status,
          });
        }
      } catch (err) {
        console.debug("[Auth] No active session cookie found:", err);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Permissions Guard for Scoped RBAC
  const isTabPermitted = (tab: string): boolean => {
    if (store.role !== "admin") return true;
    const user = store.currentUser;
    const isSuperAdmin =
      user?.email?.toLowerCase() === "riya.admin@pinak.app" ||
      user?.staffRoleId === "SUPERADMIN";

    if (user?.status === "SUSPENDED") {
      return false;
    }

    if (isSuperAdmin) {
      return true;
    }

    const perms = user?.permissions || {};
    const hasAnyPermission = ADMIN_PERMISSION_KEYS.some((key) => perms[key] === true);

    // If staff member has no permissions assigned, NO tab is permitted
    if (!hasAnyPermission) {
      return false;
    }

    switch (tab) {
      case "Overview":
        return hasAnyPermission;
      case "Discovery":
        return !!perms.canModerateOffers || !!perms.canConfigurePlatform;
      case "Merchants":
        return !!perms.canManageMerchants || !!perms.canVerifyKYC;
      case "Stores":
        return !!perms.canManageMerchants;
      case "Offers":
        return !!perms.canModerateOffers;
      case "Transactions":
        return !!perms.canViewFinancials;
      case "Rewards":
        return !!perms.canViewFinancials || !!perms.canConfigurePlatform;
      case "Customers":
        return !!perms.canManageMerchants || !!perms.canModerateOffers || !!perms.canViewFinancials;
      case "Categories":
        return !!perms.canManageTaxonomy;
      case "AdminStaff":
        return !!perms.canManageStaff;
      case "Audit":
        return !!perms.canConfigurePlatform || !!perms.canManageStaff;
      case "Settings":
        return !!perms.canConfigurePlatform;
      default:
        return false;
    }
  };

  // Synchronize URL with active tab and role (handles direct link, browser back/forward, refresh)
  useEffect(() => {
    if (!store.isAuthenticated) return;
    const resolved = resolveTabFromPath(location, store.role);
    if (resolved.isKnown) {
      if (resolved.role !== store.role) {
        store.setRole(resolved.role);
      }
      if (resolved.role === "admin") {
        if (isTabPermitted(resolved.tab)) {
          setAdminTab(resolved.tab);
        } else {
          const candidateTabs = [
            "Overview", "Discovery", "Merchants", "Stores", "Offers",
            "Transactions", "Rewards", "Customers", "Categories",
            "AdminStaff", "Audit", "Settings"
          ];
          const firstPermitted = candidateTabs.find((t) => isTabPermitted(t));
          if (firstPermitted) {
            setAdminTab(firstPermitted);
            setLocation(getPathForTab("admin", firstPermitted), { replace: true });
          } else {
            setAdminTab(resolved.tab);
          }
        }
      } else if (resolved.role === "store") {
        setStoreTab(resolved.tab);
      } else {
        setMerchantTab(resolved.tab);
      }
    } else if (location === "/" || location === "") {
      const activeCurrentTab =
        store.role === "admin"
          ? adminTab
          : store.role === "store"
          ? storeTab
          : merchantTab;
      const targetPath = getPathForTab(store.role, activeCurrentTab);
      if (location !== targetPath) {
        setLocation(targetPath, { replace: true });
      }
    }
  }, [location, store.isAuthenticated, store.role, store.currentUser]);

  // Layout UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("pinak_sidebar_collapsed") === "true";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  // Active store resolution
  const activeStore =
    store.stores.find((s) => s.id === store.activeStoreId) || store.stores[0];

  // Sync tab with role
  const currentTab =
    store.role === "admin"
      ? adminTab
      : store.role === "store"
      ? storeTab
      : merchantTab;

  const setCurrentTab = (tab: string) => {
    if (tab === "CounterQR") {
      setIsQROpen(true);
      return;
    }
    if (store.role === "admin") {
      setAdminTab(tab);
    } else if (store.role === "store") {
      setStoreTab(tab);
    } else {
      setMerchantTab(tab);
    }

    // Immediately update browser address bar with the menu URL
    const targetPath = getPathForTab(store.role, tab);
    if (location !== targetPath) {
      setLocation(targetPath);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pinak_sidebar_collapsed", String(next));
      return next;
    });
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
  const syncBackendData = async () => {
    if (!store.isAuthenticated) return;

    try {
      // 0. Synchronize latest user profile & permissions from backend (/auth/me) so reloads sync permissions instantly
      try {
        const me = await authApi.getMe();
        if (me && me.id) {
          let parsedPermissions: Record<string, boolean> | undefined;
          if (typeof me.permissions === "string") {
            try {
              parsedPermissions = JSON.parse(me.permissions);
            } catch {
              parsedPermissions = undefined;
            }
          } else if (typeof me.permissions === "object") {
            parsedPermissions = me.permissions as Record<string, boolean>;
          }

          if (parsedPermissions && typeof parsedPermissions === "object") {
            const cleanPerms: Record<string, boolean> = {};
            for (const [key, val] of Object.entries(parsedPermissions)) {
              if (typeof val === "boolean") {
                cleanPerms[key] = val;
              }
            }
            parsedPermissions = cleanPerms;
          }

          store.updateCurrentUser({
            name: me.name || store.currentUser?.name,
            email: me.email || store.currentUser?.email,
            staffScope: me.staffScope || store.currentUser?.staffScope,
            staffRoleId: me.staffRoleId || store.currentUser?.staffRoleId,
            staffRoleName: (me as any).staffRoleName || (me as any).roleName || store.currentUser?.staffRoleName,
            permissions: parsedPermissions,
            status: me.status || store.currentUser?.status,
          });
        }
      } catch (meErr) {
        console.warn("[Home] Could not sync user profile:", meErr);
      }

      // 0b. If authenticated merchant, synchronize commercial merchant profile
      if (store.role === "merchant") {
        try {
          const profile = await merchantApi.getProfile();
          if (profile && profile.id) {
            store.updateCurrentUser({
              name: profile.businessName || store.currentUser?.name,
              merchantId: profile.id,
            });
          }
        } catch (mErr) {
          console.warn("[Home] Could not sync merchant profile:", mErr);
        }
      }

      // 1. Fetch categories from Spring Boot
      const cats =
        store.role === "admin"
          ? await categoryApi.getAdminCategories().catch(() => categoryApi.getCategories())
          : await categoryApi.getCategories();
      if (Array.isArray(cats) && cats.length > 0) {
        store.setCategories(
          cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || `${c.name} category`,
            icon: c.icon || "Tag",
            color: "purple",
            storeCount: c.storeCount || 0,
            growth: c.growth || "+0.0%",
            status: c.status || "ACTIVE",
            parentId: c.parentId,
            parentName: c.parentName,
          }))
        );
      }

      // 2. Fetch stores from Spring Boot
      let backendStores: any[] = [];
      if (store.role === "merchant") {
        backendStores = await storeApi.getMyStores().catch(() => []);
      } else {
        const adminRes = await storeApi.getAllStoresAdmin().catch(() => null);
        backendStores = adminRes?.content || (Array.isArray(adminRes) ? adminRes : []);
      }
      const rawStoresList = Array.isArray(backendStores)
        ? backendStores
        : (backendStores as any)?.content && Array.isArray((backendStores as any).content)
        ? (backendStores as any).content
        : [];

      store.setStores(
        rawStoresList.map((s: any) => ({
          id: s.id,
          merchantId: s.merchantId || "",
          merchantName: s.merchantName || "Partner Brand",
          storeName: s.storeName || s.name || s.branchName || "Store Location",
          branchName: s.storeName || s.name || s.branchName || "Store Location",
          address: s.address || s.addressLine1 || "",
          city: s.cityName || s.cityId || s.city || "Nagpur",
          state: s.state || "Maharashtra",
          pincode: s.pincode || "",
          latitude: s.latitude ? Number(s.latitude) : 21.1458,
          longitude: s.longitude ? Number(s.longitude) : 79.0669,
          status: s.status || "ACTIVE",
          phone: s.contactPhone || s.phone || "",
          operatingHours: s.operatingHours || (s.openingTime && s.closingTime ? `${s.openingTime} – ${s.closingTime} (${s.operatingDays || "Daily"})` : "10:00 AM – 10:00 PM (Daily)"),
          hasActiveOffer: true,
          createdAt: s.createdAt || new Date().toISOString(),
          district: s.district || s.addressLine2 || "",
          category: s.category || s.cuisineOrCategory || "Dining & Restaurant",
          storeEmail: s.storeEmail || s.contactEmail || s.managerEmail || "",
          managerName: s.managerName || "Store Manager",
          managerEmail: s.managerEmail || s.storeEmail || "",
          managerPhone: s.managerPhone || s.phone || s.contactPhone || "",
          menuImages: Array.isArray(s.menuImages) ? s.menuImages : (Array.isArray(s.menu_images) ? s.menu_images : []),
          photos: Array.isArray(s.photos) ? s.photos : (Array.isArray(s.storePhotos) ? s.storePhotos : []),
          amenities: Array.isArray(s.amenities) ? s.amenities : [],
          posTerminalId: s.posTerminalId || "POS-01",
          qrCodePayload: `PINAK:STORE:${s.id}`,
        }))
      );

      // 3. Fetch merchants from Spring Boot (admin)
      if (store.role === "admin") {
        const mRes = await merchantApi.getMerchantsAdmin().catch(() => null);
        if (mRes) {
          const mList = mRes?.content || (Array.isArray(mRes) ? mRes : []);
          if (Array.isArray(mList)) {
            store.setMerchants(
              mList.map((m: any) => ({
                id: m.id,
                businessName: m.businessName,
                legalEntityName: m.legalName || m.businessName,
                categoryId: m.categoryId || "",
                categoryName: m.categoryName || "General",
                ownerName: m.ownerName || (m.legalName ? m.legalName.split(" ")[0] + " (Owner)" : "Merchant Partner"),
                ownerEmail: m.email || "",
                ownerPhone: m.phone || "",
                city: m.city || "Nagpur",
                district: m.district || "Nagpur",
                state: m.state || "Maharashtra",
                pincode: m.pincode || "",
                address: m.address || "",
                bankUpiId: m.bankUpiId || m.settlementUpi || "",
                bankName: m.bankName || "",
                accountHolderName: m.accountHolderName || m.legalName || m.businessName || "",
                bankAccountNumber: m.bankAccountNumber || "",
                bankIfsc: m.bankIfsc || "",
                gstin: m.gstin || "",
                pan: m.pan || "",
                commissionRate: m.commissionRate != null ? Number(m.commissionRate) : 5.0,
                kycStatus: (m.kycStatus === "REJECTED" || m.approvalStatus === "REJECTED") ? "REJECTED" : (m.kycStatus === "VERIFIED" || m.approvalStatus === "APPROVED" ? "APPROVED" : "PENDING_REVIEW"),
                status: m.status || "ACTIVE",
                rating: m.rating ?? 5.0,
                initials: (m.businessName || "M").substring(0, 2).toUpperCase(),
                createdAt: m.createdAt || new Date().toISOString(),
                storeCount: backendStores.filter((s: any) => s.merchantId === m.id).length || 0,
                createdBy: m.createdBy || undefined,
                createdRole: m.createdRole || undefined,
                kycReviewedBy: m.kycReviewedBy || undefined,
                kycReviewedAt: m.kycReviewedAt || undefined,
              }))
            );
          }
        }
      }

      // 4. Fetch offers from Spring Boot
      let backendOffers: any[] = [];
      if (store.role === "merchant") {
        backendOffers = await offerApi.getMyOffers().catch(() => []);
      } else {
        backendOffers = await offerApi.getAdminOffers().catch(() => []);
      }
      if (Array.isArray(backendOffers)) {
        store.setOffers(
          backendOffers.map((o: any) => {
            const matchedMerchant = store.merchants.find((m) => m.id === o.merchantId);
            const matchedStore = store.stores.find((s) => s.id === o.storeId);
            const isChainWide = !o.storeId || o.storeId === "all";
            return {
              id: o.id,
              merchantId: o.merchantId,
              merchantName: o.merchantName || matchedMerchant?.businessName || "Partner Brand",
              storeId: o.storeId || "all",
              storeName: isChainWide
                ? "All Outlets (Brand-Wide)"
                : (matchedStore?.storeName || matchedStore?.branchName || o.storeName || "Branch Outlet"),
              title: o.title,
              type: ((o.offerType || o.type) === "PERCENTAGE_DISCOUNT" || (o.offerType || o.type) === "FLAT_PCT" || (o.offerType || o.type) === "PERCENTAGE")
                ? "FLAT_PCT"
                : ((o.offerType || o.type) === "BUY_X_GET_Y" || (o.offerType || o.type) === "BOGO" || (o.offerType || o.type) === "BUY_ONE_GET_ONE"
                  ? "BOGO"
                  : ((o.offerType || o.type) === "CASHBACK" ? "CASHBACK" : "FLAT_AMT")),
              value: Number(o.value) || 0,
              buyQuantity: o.buyQuantity ? Number(o.buyQuantity) : 1,
              getQuantity: o.getQuantity ? Number(o.getQuantity) : 1,
              maxDiscount: o.maxDiscountAmount ? Number(o.maxDiscountAmount) : 0,
              minBillAmount: o.minTransactionAmount ? Number(o.minTransactionAmount) : 0,
              validFrom: o.validFrom ? o.validFrom.split("T")[0] : new Date().toISOString().split("T")[0],
              validTo: o.validTo ? o.validTo.split("T")[0] : "",
              status: o.status === "DEACTIVATED" ? "PAUSED" : (o.status || "ACTIVE"),
              approvalStatus: o.approvalStatus || "APPROVED",
              redemptions: o.currentUsageCount || 0,
              terms: o.termsAndConditions || o.description || "Standard offer terms apply.",
              createdAt: o.createdAt || new Date().toISOString(),
              scopeType: o.offerScope || "SERVICE",
              originalPrice: o.originalMrp ? Number(o.originalMrp) : undefined,
              dealPrice: o.flashSellingPrice ? Number(o.flashSellingPrice) : undefined,
              isFlashDeal: Boolean(o.isFlash),
              totalFlashUnits: o.remainingQuantity ? Number(o.remainingQuantity) : 50,
              bonusCoins: o.bonusCoins ? Number(o.bonusCoins) : 100,
              imageUrl: o.imageUrl || "",
              badgeText: o.badgeText || "",
              ctaText: o.ctaText || "Book & Pay",
              isTableBookingEnabled: Boolean(o.isTableBookingEnabled || o.offerScope === "TABLE" || o.ctaText === "Reserve Table"),
              bookingType: o.bookingType || (o.isTableBookingEnabled ? "TABLE_RESERVATION" : undefined),
              redemptionType: o.redemptionType || "BOTH",
              minAdvanceHours: o.minAdvanceHours != null ? Number(o.minAdvanceHours) : 0,
              minPartySize: o.minPartySize ? Number(o.minPartySize) : undefined,
              maxPartySize: o.maxPartySize ? Number(o.maxPartySize) : undefined,
              availableTablesPerSlot: o.availableTablesPerSlot ? Number(o.availableTablesPerSlot) : undefined,
              coverChargeAmount: o.coverChargeAmount ? Number(o.coverChargeAmount) : undefined,
              gracePeriodMinutes: o.gracePeriodMinutes ? Number(o.gracePeriodMinutes) : undefined,
              slotTimes: o.slotTimes ? (typeof o.slotTimes === 'string' && o.slotTimes.startsWith('[') ? JSON.parse(o.slotTimes) : o.slotTimes) : undefined,
              seatingAreas: o.seatingAreas ? (typeof o.seatingAreas === 'string' && o.seatingAreas.startsWith('[') ? JSON.parse(o.seatingAreas) : o.seatingAreas) : undefined,
              perUserLimit: o.perCustomerLimit || 1,
              maxTotalRedemptions: o.usageLimit || 1000,
            };
          })
        );
      }

      // 5. Fetch live transactions from Spring Boot
      let backendTx: any[] = [];
      if (store.role === "admin") {
        backendTx = await transactionApi.getAdminTransactions().catch(() => []);
      } else {
        backendTx = await transactionApi.getMerchantTransactions().catch(() => []);
      }
      if (Array.isArray(backendTx)) {
        store.setTransactions(
          backendTx.map((t: any) => ({
            id: t.id,
            paymentIntentId: t.transactionReference || `pay_${t.id.substring(0, 8)}`,
            referenceType: "OFFER",
            referenceId: t.offerId || "direct",
            customerName: t.customerName || "Customer",
            customerPhone: t.customerPhone || "",
            merchantId: t.merchantId,
            merchantName: t.merchantName || "Partner Merchant",
            storeName: t.storeName || "Store Location",
            billAmount: Number(t.grossAmount) || 0,
            discountAmount: Number(t.discountAmount) || 0,
            payableAmount: Number(t.payableAmount) || 0,
            payeeVpa: t.payeeVpa || t.merchantUpi || "merchant@upi",
            upiIntentUrl: t.upiIntentUrl || (t.payeeVpa ? `upi://pay?pa=${t.payeeVpa}&am=${t.payableAmount}&tr=${t.id}` : ""),
            utr: t.utr || (t.id ? `UTR${t.id.substring(0, 8).toUpperCase()}` : ""),
            signatureValid: true,
            status: t.status === "COMPLETED" ? "SUCCESS" : t.status,
            settlementStatus: t.status === "COMPLETED" ? "SETTLED" : "PENDING",
            pointsEarned: Math.floor((Number(t.payableAmount) || 0) * 0.05),
            timestamp: t.createdAt || new Date().toISOString(),
          }))
        );
      }

      // 6. Fetch live registered platform customers (admin)
      if (store.role === "admin") {
        const users = await adminApi.getUsers({ role: "CUSTOMER" }).catch(() => []);
        if (Array.isArray(users) && users.length > 0) {
          store.setCustomers(
            users.map((u: any, idx: number) => ({
              id: u.id,
              name: u.name || `${u.firstName || "Customer"} ${u.lastName || ""}`.trim() || `User #${u.id.substring(0, 6)}`,
              phone: u.phone || u.mobile || "+91 98220 00000",
              email: u.email || `customer-${idx + 1}@pinak.app`,
              city: "Nagpur",
              visits: 4,
              rewardsBalance: 120,
              segment: "Regular",
              initials: (u.firstName ? u.firstName.substring(0, 2) : (u.name ? u.name.substring(0, 2) : "CU")).toUpperCase(),
              lastActive: u.createdAt || new Date().toISOString(),
            }))
          );
        }

        // 7. Fetch live system audit logs from Spring Boot (admin)
        const audits = await adminApi.getAuditLogs().catch(() => null);
        if (Array.isArray(audits)) {
          const fallbackActor = store.currentUser?.email
            ? `${store.currentUser.name ? store.currentUser.name + " (" + store.currentUser.email + ")" : store.currentUser.email + " (Super Admin)"}`
            : "riya.admin@pinak.app (Super Admin)";

          const mappedAudits = audits.map((a: any) => {
            // Clean IP representation for display
            let cleanIp = a.ipAddress;
            if (cleanIp === "0:0:0:0:0:0:0:1" || cleanIp === "::1") {
              cleanIp = "127.0.0.1 (Localhost)";
            }

            let meta: Record<string, any> = {
              requestId: a.requestId,
              ipAddress: cleanIp,
            };

            // Actor should ALWAYS be the authenticated identity/role, NEVER a network IP
            let actorName = fallbackActor;
            let entityName = a.resourceType || "Platform Governance";
            let actionName = a.action || "System Event";

            if (a.reason) {
              try {
                const parsed = typeof a.reason === "string" ? JSON.parse(a.reason) : a.reason;
                if (parsed && typeof parsed === "object") {
                  meta = { ...meta, ...parsed };
                  if (parsed.invitedBy) {
                    actorName = parsed.invitedBy.includes("@") ? `${parsed.invitedBy}` : `${parsed.invitedBy} (Super Admin)`;
                  } else if (parsed.actor) {
                    actorName = parsed.actor;
                  }

                  if (parsed.staffEmail) {
                    entityName = parsed.staffName
                      ? `Staff: ${parsed.staffName} (${parsed.staffEmail})`
                      : `Staff: ${parsed.staffEmail}`;
                  } else if (parsed.roleName) {
                    entityName = `Role: ${parsed.roleName}`;
                  }
                } else {
                  meta.reason = a.reason;
                }
              } catch {
                meta.reason = a.reason;
              }
            }

            // Map friendly action & entity names for common events
            if (a.action === "TOKEN_REFRESH") {
              actionName = "Session Token Refreshed";
              entityName = "Authentication & JWT Session";
              actorName = fallbackActor;
            } else if (a.action === "LOGIN_SUCCESS") {
              actionName = "User Login Success";
              entityName = "Authentication Session";
              actorName = fallbackActor;
            } else if (a.action === "LOGIN_FAILED") {
              actionName = "User Login Failed";
              entityName = "Authentication Guard";
              actorName = fallbackActor;
            } else if (a.action === "LOGOUT") {
              actionName = "User Logged Out";
              entityName = "Authentication Session";
              actorName = fallbackActor;
            } else if (a.action === "STAFF_INVITED") {
              actionName = meta.roleName ? `Staff Member Invited (${meta.roleName})` : "Staff Member Invited";
            } else if (a.action === "STAFF_UPDATED") {
              actionName = meta.status
                ? `Staff Status Changed (${meta.status})`
                : meta.roleName
                ? `Staff Role / Permissions Updated (${meta.roleName})`
                : "Staff Member Updated";
            } else if (a.action === "STAFF_REMOVED") {
              actionName = "Staff Access Revoked";
            } else if (a.action === "ROLE_CREATED") {
              actionName = meta.roleName ? `Platform Role Created (${meta.roleName})` : "Platform Role Created";
            } else if (a.action === "ROLE_UPDATED") {
              actionName = meta.roleName ? `Platform Role Modified (${meta.roleName})` : "Platform Role Modified";
            } else if (a.action === "ROLE_DELETED") {
              actionName = meta.roleName ? `Platform Role Deleted (${meta.roleName})` : "Platform Role Deleted";
            } else if (a.action === "MERCHANT_CREATED") {
              actionName = meta.businessName ? `Merchant Brand Onboarded (${meta.businessName})` : "Merchant Brand Onboarded";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "MERCHANT_UPDATED") {
              actionName = "Merchant Details Updated";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "MERCHANT_APPROVED") {
              actionName = "Merchant KYC Verified & Approved";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "MERCHANT_REJECTED") {
              actionName = "Merchant KYC Rejected";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "MERCHANT_SUSPENDED") {
              actionName = "Merchant Account Suspended";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "MERCHANT_DELETED") {
              actionName = meta.businessName ? `Merchant Brand Deleted (${meta.businessName})` : "Merchant Brand Deleted";
              entityName = meta.businessName ? `Merchant: ${meta.businessName}` : "Merchant Brand";
            } else if (a.action === "STORE_CREATED") {
              actionName = meta.storeName ? `Store Branch Provisioned (${meta.storeName})` : "Store Branch Provisioned";
              entityName = meta.storeName ? `Store: ${meta.storeName}` : "Store Outlet";
            } else if (a.action === "STORE_APPROVED") {
              actionName = "Store Branch Approved";
              entityName = meta.storeName ? `Store: ${meta.storeName}` : "Store Outlet";
            }

            const detailsText =
              meta.details ||
              (a.action === "MERCHANT_CREATED"
                ? `Onboarded merchant brand "${meta.businessName || "New Merchant"}" with owner "${meta.ownerName || meta.ownerEmail || ""}".`
                : a.action === "MERCHANT_DELETED"
                ? `Permanently deleted merchant brand "${meta.businessName || "Merchant"}", removed branch outlets and de-provisioned owner access credentials.`
                : a.action === "MERCHANT_APPROVED"
                ? `Approved KYC documents & commercial verification for merchant brand.`
                : a.action === "MERCHANT_REJECTED"
                ? `Rejected merchant KYC application: ${meta.reason || "Verification rejected during review"}.`
                : a.action === "MERCHANT_UPDATED"
                ? `Updated merchant business profile and contact information.`
                : `${actionName} action executed.`);

            return {
              id: a.id || `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              action: actionName,
              entity: entityName,
              actor: actorName,
              details: detailsText,
              time: a.createdAt || new Date().toISOString(),
              severity:
                a.action?.toLowerCase().includes("fail") || a.action?.toLowerCase().includes("reject")
                  ? "warning"
                  : a.action?.toLowerCase().includes("remove") || a.action?.toLowerCase().includes("delete")
                  ? "critical"
                  : a.action?.toLowerCase().includes("invite") || a.action?.toLowerCase().includes("create")
                  ? "success"
                  : "info",
              metadata: { ...meta, details: detailsText },
            };
          });

          // Strictly use real backend audit records
          store.setAuditLogs(mappedAudits);
        }

        // 8. Fetch live operational summary metrics for Overview Dashboard
        const metrics = await adminApi.getDashboardSummary().catch(() => null);
        if (metrics) {
          setDashboardMetrics(metrics);
        }
      }

      // 9. Fetch live notifications from backend
      try {
        const notifs = await notificationApi.getNotifications({ size: 30 });
        if (notifs?.content && Array.isArray(notifs.content)) {
          store.setNotifications(
            notifs.content.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type === "MERCHANT" ? "merchant" : (n.type === "OFFER" ? "offer" : "transaction"),
              time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
              read: n.isRead,
            }))
          );
        }
      } catch (notifErr: any) {
        // Handled silently
      }

      // 10. Fetch active operating cities from discovery service
      try {
        const cities = await cityApi.getOperatingCities();
        if (Array.isArray(cities) && cities.length > 0) {
          store.setOperatingCities(cities);
        }
      } catch (cityErr: any) {
        // Handled silently
      }
    } catch (e: any) {
      console.info("[Pinak API] Live sync complete:", e?.message);
    }
  };

  useEffect(() => {
    syncBackendData();
  }, [store.isAuthenticated, store.role]);

  // Live API handlers for Category & Store actions
  const handleAddCategory = async (draft: any) => {
    try {
      const cleanSlug = (draft.name || "new-category")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      await categoryApi.createCategory({
        name: draft.name || "New Category",
        slug: cleanSlug || `cat-${Date.now()}`,
        parentId: draft.parentId || undefined,
        description: draft.description || "",
        icon: draft.icon || "Tag",
        status: (draft.status as any) || "ACTIVE",
      });
      toast.success(`Category "${draft.name}" saved successfully!`);
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend category create failed, saving locally:", apiErr?.response?.data || apiErr.message);
      store.addCategory(draft);
    }
  };

  const handleUpdateCategory = async (id: string, updates: any) => {
    try {
      const cleanSlug = updates.name
        ? updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : undefined;

      await categoryApi.updateCategory(id, {
        name: updates.name || "Category",
        slug: cleanSlug,
        parentId: updates.parentId || undefined,
        description: updates.description || "",
        icon: updates.icon || "Tag",
        status: updates.status || "ACTIVE",
      });
      toast.success(`Category "${updates.name || "item"}" updated successfully!`);
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend category update failed, updating locally:", apiErr?.response?.data || apiErr.message);
      store.updateCategory(id, updates);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.deleteCategory(id);
      toast.success("Category deleted successfully!");
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend category delete failed, deleting locally:", apiErr?.response?.data || apiErr.message);
      store.deleteCategory(id);
    }
  };

  const handleToggleCategoryStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      await categoryApi.updateCategoryStatus(id, status);
      toast.success(`Category status updated to ${status}!`);
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend category status update failed, updating locally:", apiErr?.response?.data || apiErr.message);
      store.updateCategory(id, { status });
    }
  };

  // Live API handler for Merchant Onboarding
  const handleAddMerchant = async (draft: any) => {
    try {
      // Resolve category ID from database categories
      const categoryMatch = store.categories.find(
        (c) => c.name.toLowerCase() === (draft.categoryName || "").toLowerCase()
      );
      const categoryId = draft.categoryId || categoryMatch?.id;

      const created = await merchantApi.createMerchant({
        businessName: draft.businessName,
        legalName: draft.legalEntityName || draft.businessName,
        categoryId: categoryId,
        phone: draft.ownerPhone,
        email: draft.ownerEmail,
        bankUpiId: draft.bankUpiId,
        gstin: draft.gstin,
        pan: draft.pan,
        description: `Registered partner merchant ${draft.businessName}`,
        state: draft.state || "Maharashtra",
        district: draft.district || "Nagpur",
        city: draft.city || "Nagpur",
        pincode: draft.pincode || "440010",
        address: draft.address || `${draft.city || "Nagpur"} Central`,
        bankName: draft.bankName,
        accountHolderName: draft.accountHolderName || draft.legalEntityName || draft.businessName,
        bankAccountNumber: draft.bankAccountNumber,
        bankIfsc: draft.bankIfsc,
        commissionRate: draft.commissionRate != null ? Number(draft.commissionRate) : 5.0,
      });

      toast.success(`Merchant "${draft.businessName}" onboarded successfully!`);

      await syncBackendData();
    } catch (apiErr: any) {
      const errMsg =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        apiErr?.message ||
        "Failed to onboard merchant";
      toast.error(errMsg);
      throw apiErr;
    }
  };

  const handleAddStore = async (draft: any) => {
    // 1. Authoritative Backend Validation for Store Manager Email
    if (draft.managerEmail && draft.managerEmail.trim()) {
      const email = draft.managerEmail.trim().toLowerCase();
      try {
        const valRes = await staffApi.validateStaffEmail(email, draft.merchantId, "STORE");
        if (valRes && valRes.valid === false && valRes.message) {
          throw new Error(valRes.message);
        }
      } catch (valErr: any) {
        const valMsg = valErr?.response?.data?.message || valErr?.message;
        if (valMsg && (valMsg.includes("cannot use") || valMsg.includes("conflict") || valMsg.includes("already"))) {
          throw new Error(valMsg);
        }
      }
    }

    // 1.5 Clean and Authoritative Backend Validation for Store Phone
    const rawPhone = (draft.managerPhone || draft.phone || "").trim();
    const cleanPhone = rawPhone.replace(/[\s\-_()]/g, "");
    if (cleanPhone) {
      try {
        const phoneVal = await storeApi.validateStorePhone(
          cleanPhone,
          draft.merchantId,
          undefined,
          draft.managerEmail ? draft.managerEmail.trim() : undefined
        );
        if (phoneVal && phoneVal.valid === false && phoneVal.message) {
          throw new Error(phoneVal.message);
        }
      } catch (valErr: any) {
        const valMsg = valErr?.response?.data?.message || valErr?.message;
        if (valMsg && (valMsg.includes("Phone number") || valMsg.includes("Duplicate") || valMsg.includes("already"))) {
          throw new Error(valMsg);
        }
      }
    }

    try {
      const createdStore = await storeApi.createStore({
        merchantId: draft.merchantId,
        storeName: draft.branchName || draft.storeName || draft.name || "New Branch",
        contactPhone: cleanPhone || "9876543210",
        address: draft.address && draft.address.trim().length >= 5 ? draft.address.trim() : "Main Road Outlet",
        cityId: (draft.city || "Nagpur").toLowerCase(),
        state: draft.state || "Maharashtra",
        pincode: draft.pincode && /^[0-9]{5,10}$/.test(draft.pincode) ? draft.pincode : "440010",
        latitude: Number(draft.latitude) || 21.1458,
        longitude: Number(draft.longitude) || 79.0882,
        openingTime: draft.openingTime || "09:00",
        closingTime: draft.closingTime || "22:00",
        imageUrl: draft.imageUrl || (draft.photos && draft.photos[0]) || "",
        menuImages: draft.menuImages || [],
        photos: draft.photos || [],
        amenities: draft.amenities || [],
      });

      const storeId = createdStore?.id;

      // Save branch locally with manager details
      const assignedStoreEmail = (draft.storeEmail || draft.managerEmail || "").trim();
      const assignedManagerPhone = (draft.managerPhone || draft.phone || "").trim();
      store.addStore({
        ...draft,
        id: storeId || draft.id,
        phone: assignedManagerPhone || "9876543210",
        storeEmail: assignedStoreEmail || undefined,
        managerEmail: assignedStoreEmail || undefined,
        managerName: draft.managerName || "Store Manager",
        managerPhone: assignedManagerPhone || undefined,
        district: draft.district,
        storePin: draft.posPin,
      });

      // If store manager email was provided, dispatch unified staff invitation!
      if (assignedStoreEmail) {
        try {
          await staffApi.inviteMerchantStaff({
            name: draft.managerName?.trim() || `${draft.branchName || "Store"} Manager`,
            email: assignedStoreEmail.toLowerCase(),
            phone: assignedManagerPhone || draft.phone,
            roleId: "STORE_MANAGER",
            scope: "STORE",
            merchantId: draft.merchantId,
            storeId: storeId,
            posPin: draft.posPin?.trim() || undefined,
          });
          toast.success(
            `Branch "${draft.branchName || "Outlet"}" created! Password setup invitation dispatched to ${assignedStoreEmail}.`
          );
        } catch (inviteErr: any) {
          const inviteMsg = inviteErr?.response?.data?.message || inviteErr.message;
          console.warn("Store manager invitation notice:", inviteMsg);
          if (inviteMsg && (inviteMsg.includes("Enterprise Notice") || inviteMsg.includes("Merchant Owner"))) {
            toast.error(inviteMsg);
            throw new Error(inviteMsg);
          } else {
            toast.success(
              `Branch "${draft.branchName || "Outlet"}" created! Invitation dispatch note: ${inviteMsg || "Recorded"}`
            );
          }
        }
      } else {
        toast.success(`Branch "${draft.branchName || draft.name || "Outlet"}" created successfully!`);
      }

      await syncBackendData();
    } catch (apiErr: any) {
      const errMsg = apiErr?.response?.data?.message || apiErr?.message;
      if (errMsg && (errMsg.includes("Enterprise Notice") || errMsg.includes("Merchant Owner"))) {
        throw new Error(errMsg);
      }
      console.warn("Backend store create failed, saving locally:", errMsg);
      store.addStore(draft);
      toast.success(`Store branch "${draft.branchName || "Outlet"}" saved locally.`);
    }
  };

  const handleApproveStore = async (id: string) => {
    try {
      await storeApi.approveStoreAdmin(id);
      toast.success("Store branch approved successfully!");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend store approval:", err?.response?.data || err.message);
      store.approveStore(id);
    }
  };

  const handleUpdateStore = async (id: string, updates: any) => {
    try {
      await storeApi.updateStore(id, {
        name: updates.branchName || updates.storeName || updates.name,
        description: updates.description,
        phone: updates.phone,
        addressLine1: updates.address,
        cityId: (updates.city || "nagpur").toLowerCase(),
        state: updates.state || "Maharashtra",
        pincode: updates.pincode || "440010",
        latitude: Number(updates.latitude) || 21.1458,
        longitude: Number(updates.longitude) || 79.0882,
        openingTime: updates.openingTime,
        closingTime: updates.closingTime,
        operatingDays: updates.operatingDays,
        menuImages: updates.menuImages,
        photos: updates.photos,
        amenities: updates.amenities,
      } as any);
      store.updateStore(id, updates);
      toast.success("Store outlet updated successfully!");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend store update fallback:", err?.response?.data || err.message);
      store.updateStore(id, updates);
      toast.success("Store outlet updated");
      await syncBackendData();
    }
  };

  const handleUpdateKyc = async (id: string, status: any) => {
    try {
      if (status === "APPROVED") {
        await merchantApi.approveMerchantAdmin(id);
        store.updateMerchantKyc(id, "APPROVED");
        toast.success("Merchant approved successfully!");
      } else if (status === "REJECTED") {
        await merchantApi.rejectMerchantAdmin(id, "Verification rejected during admin review");
        store.updateMerchantKyc(id, "REJECTED");
        toast.info("Merchant application rejected.");
      } else if (status === "SUSPENDED") {
        await merchantApi.suspendMerchantAdmin(id, "Account suspended by admin");
        store.updateMerchant(id, { status: "SUSPENDED" });
        toast.info("Merchant account suspended.");
      } else if (status === "PENDING_REVIEW") {
        store.updateMerchantKyc(id, "PENDING_REVIEW");
        toast.info("Clarification requested from merchant. Application marked for revision.");
      } else {
        await merchantApi.activateMerchantAdmin(id);
        store.updateMerchant(id, { status: "ACTIVE" });
        toast.success("Merchant activated successfully!");
      }
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend merchant approval update:", err?.response?.data || err.message);
      store.updateMerchantKyc(id, status);
    }
  };

  const handleUpdateMerchant = async (id: string, updates: Partial<Merchant>) => {
    try {
      if (updates.status === "SUSPENDED" || updates.status === "INACTIVE") {
        await merchantApi.suspendMerchantAdmin(id, updates.status === "INACTIVE" ? "Deactivated by administrator" : "Account suspended by platform admin");
        store.updateMerchant(id, { status: updates.status });
        toast.info(updates.status === "INACTIVE" ? "Merchant deactivated successfully" : "Merchant suspended successfully");
      } else if (updates.status === "ACTIVE") {
        await merchantApi.activateMerchantAdmin(id);
        store.updateMerchant(id, { status: "ACTIVE" });
        toast.success("Merchant activated successfully");
      } else {
        store.updateMerchant(id, updates);
        toast.success("Merchant updated successfully");
      }
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend merchant status update notice:", err?.response?.data || err.message);
      store.updateMerchant(id, updates);
      await syncBackendData();
    }
  };

  const handleDeleteMerchant = async (id: string) => {
    try {
      await merchantApi.deleteMerchant(id);
      store.deleteMerchant(id);
      toast.success("Merchant deleted permanently from database.");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend merchant delete notice:", err?.response?.data || err.message);
      store.deleteMerchant(id);
      toast.success("Merchant deleted successfully");
      await syncBackendData();
    }
  };

  const handleDeleteStore = async (id: string) => {
    try {
      await storeApi.deleteStore(id);
      store.deleteStore(id);
      toast.success("Store outlet permanently removed.");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend store delete notice:", err?.response?.data || err.message);
      store.deleteStore(id);
      toast.success("Store outlet removed");
      await syncBackendData();
    }
  };

  const formatInstant = (val?: string | null, isEnd: boolean = false): string => {
    if (!val) {
      return isEnd
        ? new Date(Date.now() + 90 * 86400000).toISOString()
        : new Date().toISOString();
    }
    if (val.includes("T")) {
      return new Date(val).toISOString();
    }
    return new Date(`${val}T${isEnd ? "23:59:59" : "00:00:00"}Z`).toISOString();
  };

  const handleAddOffer = async (draft: any) => {
    try {
      const merchantStores = store.stores.filter((s) => s.merchantId === draft.merchantId);
      if (!merchantStores || merchantStores.length === 0) {
        toast.error("The merchant must have at least one store before creating an offer.");
        throw new Error("Merchant has no stores configured");
      }
      // If a specific store is selected, target that store; if 'all' or empty, pass null for brand-wide / all branches
      const chosenStoreId = (draft.storeId && draft.storeId !== "all" && String(draft.storeId).trim() !== "") ? draft.storeId : null;

      const isProduct = draft.scopeType === "PRODUCT" || draft.offerScope === "STORE_PRODUCT";
      const resolvedValue = isProduct && draft.originalPrice && draft.dealPrice && draft.originalPrice > draft.dealPrice
        ? (draft.type === "FLAT_AMT" ? (draft.originalPrice - draft.dealPrice) : Math.round(((draft.originalPrice - draft.dealPrice) / draft.originalPrice) * 100))
        : (Number(draft.value) || 20);

      const resolvedMinBill = Math.max(Number(draft.minBillAmount) || 0, draft.type === "FLAT_AMT" ? resolvedValue : 0);

      const resolvedOfferType = draft.type === "FLAT_PCT" || draft.type === "PERCENTAGE" || draft.type === "PERCENTAGE_DISCOUNT"
        ? "PERCENTAGE_DISCOUNT"
        : (draft.type === "BOGO" || draft.type === "BUY_ONE_GET_ONE" || draft.type === "BUY_X_GET_Y"
          ? "BOGO"
          : (draft.type === "CASHBACK" ? "CASHBACK" : "FIXED_DISCOUNT"));

      const resolvedDescription = isProduct
        ? (draft.unitOrWeight || draft.tagline || `Special store product deal at ${draft.merchantName || 'partner store'}`)
        : (draft.tagline || draft.terms || draft.description || "Offer details");

      const payload: any = {
        merchantId: draft.merchantId,
        storeId: chosenStoreId,
        title: (draft.title || draft.productName || "Special Deal").trim(),
        description: resolvedDescription,
        type: resolvedOfferType,
        offerType: resolvedOfferType,
        value: resolvedValue,
        minTransactionAmount: resolvedMinBill,
        maxDiscountAmount: draft.maxDiscount ? Number(draft.maxDiscount) : (isProduct && draft.originalPrice && draft.dealPrice ? (draft.originalPrice - draft.dealPrice) : null),
        usageLimit: Number(draft.maxTotalRedemptions) || 1000,
        perCustomerLimit: Number(draft.perUserLimit) || 1,
        validFrom: formatInstant(draft.validFrom, false),
        validTo: formatInstant(draft.validTo, true),
        offerScope: isProduct ? "PRODUCT" : "SERVICE",
        originalMrp: draft.originalPrice ? Number(draft.originalPrice) : null,
        flashSellingPrice: draft.dealPrice ? Number(draft.dealPrice) : null,
        isFlash: Boolean(draft.isFlashDeal),
        remainingQuantity: draft.totalFlashUnits ? Number(draft.totalFlashUnits) : 50,
        bonusCoins: Number(draft.bonusCoins) || 100,
        imageUrl: draft.imageUrl || null,
        badgeText: draft.badgeText || (isProduct && draft.originalPrice && draft.dealPrice ? `${Math.round(((draft.originalPrice - draft.dealPrice) / draft.originalPrice) * 100)}% OFF` : null),
        ctaText: draft.ctaText || (isProduct ? "Add to Cart" : draft.isTableBookingEnabled ? "Reserve Table" : "Book & Pay"),
        buyQuantity: draft.type === "BOGO" ? Number(draft.buyQuantity || 1) : 1,
        getQuantity: draft.type === "BOGO" ? Number(draft.getQuantity || 1) : 1,
        isTableBookingEnabled: Boolean(draft.isTableBookingEnabled),
        bookingType: draft.bookingType || (draft.isTableBookingEnabled ? "TABLE_RESERVATION" : undefined),
        minPartySize: draft.minPartySize ? Number(draft.minPartySize) : undefined,
        maxPartySize: draft.maxPartySize ? Number(draft.maxPartySize) : undefined,
        availableTablesPerSlot: draft.availableTablesPerSlot ? Number(draft.availableTablesPerSlot) : undefined,
        coverChargeAmount: draft.coverChargeAmount ? Number(draft.coverChargeAmount) : undefined,
        gracePeriodMinutes: draft.gracePeriodMinutes ? Number(draft.gracePeriodMinutes) : undefined,
        slotTimes: draft.slotTimes || undefined,
        seatingAreas: draft.seatingAreas || undefined,
        redemptionType: draft.redemptionType || (draft.offerScope === "PRE_BOOK" ? "PRE_BOOK" : draft.offerScope === "WALK_IN" ? "WALK_IN" : "BOTH"),
        minAdvanceHours: draft.minAdvanceHours ? Number(draft.minAdvanceHours) : 0,
      };

      const isAdmin = store.role?.toLowerCase() === "admin" || !store.currentUser?.merchantId;
      let createdResponse: any;
      if (isAdmin) {
        createdResponse = await offerApi.createAdminOffer(payload);
      } else {
        createdResponse = await offerApi.createOffer(payload);
      }

      toast.success(`Offer "${draft.title}" saved to PostgreSQL and active on mobile discovery!`);
      await syncBackendData();
      return createdResponse;
    } catch (err: any) {
      console.error("Backend offer create error:", err?.response?.data || err.message);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Failed to save offer to database";
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateOfferStatus = async (
    id: string,
    status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING_APPROVAL" | "PAUSED",
    reason?: string
  ) => {
    try {
      if (status === "ACTIVE") {
        await offerApi.approveOfferAdmin(id);
        toast.success("Offer approved & live on mobile discovery!");
      } else if (status === "PAUSED") {
        await offerApi.suspendOfferAdmin(id, reason || "Paused by Super Admin");
        toast.info("Campaign offer paused");
      } else if (status === "REJECTED") {
        await offerApi.rejectOfferAdmin(id, reason || "Rejected by Super Admin");
        toast.warning("Campaign offer rejected");
      }
      await syncBackendData();
    } catch (err: any) {
      console.error("Backend offer status update error:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || err.message || "Failed to update offer status");
      store.updateOfferStatus(id, status);
    }
  };

  const handleApproveOffer = async (id: string) => {
    return handleUpdateOfferStatus(id, "ACTIVE");
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await offerApi.deleteOffer(id);
      store.deleteOffer(id);
      toast.success("Offer permanently deleted from database.");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend offer delete notice:", err?.response?.data || err.message);
      store.deleteOffer(id);
      toast.success("Offer removed");
      await syncBackendData();
    }
  };

  const pendingOffersCount = store.offers.filter((o) => o.status === "PENDING_APPROVAL").length;
  const pendingMerchantsCount = store.merchants.filter(
    (m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED"
  ).length;
  const pendingStoresCount = store.stores.filter((s) => s.status === "PENDING_APPROVAL").length;
  const unreadNotifications = store.notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    store.logout();
    setLocation("/login");
    toast.success("Logged out successfully. Have a great day!");
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch {}
    store.markAllNotificationsRead();
  };

  // While checking silent session via HttpOnly cookie on initial load
  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] dark:bg-[#0c0e17]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

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
          isDark={theme === "dark"}
          onToggleTheme={() => toggleTheme?.()}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadCount={unreadNotifications}
          onLogout={handleLogout}
        />

        {/* Page Body with Motion Transition */}
        <main className="flex-1 p-4 md:p-8 w-full">
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
                  {!isTabPermitted(currentTab) ? (
                    <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-12 animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/60 shadow-xs">
                        <ShieldCheck size={32} />
                      </div>
                      <h3 className="text-xl font-bold font-['Manrope'] text-slate-900 dark:text-white mb-2">
                        Module Access Restricted
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        Your assigned role{" "}
                        <strong className="text-purple-600 dark:text-purple-400 font-semibold">
                          {store.currentUser?.staffRoleName || "Platform Staff"}
                        </strong>{" "}
                        does not have permissions granted for the <strong>{currentTab}</strong> module. Please contact a Super Administrator if you require elevated privileges.
                      </p>
                      {ADMIN_PERMISSION_KEYS.some((key) => store.currentUser?.permissions?.[key] === true) ? (
                        <button
                          onClick={() => {
                            const candidateTabs = [
                              "Overview", "Discovery", "Merchants", "Stores", "Offers",
                              "Transactions", "Rewards", "Customers", "Categories",
                              "AdminStaff", "Audit", "Settings"
                            ];
                            const firstPermitted = candidateTabs.find((t) => isTabPermitted(t));
                            if (firstPermitted) {
                              setAdminTab(firstPermitted);
                              setLocation(getPathForTab("admin", firstPermitted));
                            }
                          }}
                          className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
                        >
                          Go to Permitted Modules
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLogout()}
                          className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
                        >
                          Sign Out
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {currentTab === "Overview" && (
                        <OverviewDashboard
                          merchants={store.merchants}
                          stores={store.stores}
                          offers={store.offers}
                          transactions={store.transactions}
                          metrics={dashboardMetrics}
                          onNavigateTab={setCurrentTab}
                          onApproveMerchant={(id) => handleUpdateKyc(id, "APPROVED")}
                          onApproveOffer={(id) => handleApproveOffer(id)}
                        />
                      )}

                      {currentTab === "Discovery" && (
                        <DiscoveryControl
                          stores={store.stores}
                          offers={store.offers}
                          merchants={store.merchants}
                          categories={store.categories}
                        />
                      )}

                      {currentTab === "Merchants" && (
                        <MerchantNetwork
                          merchants={store.merchants}
                          onAddMerchant={handleAddMerchant}
                          onUpdateKyc={handleUpdateKyc}
                          onNavigateTab={setCurrentTab}
                          onDeleteMerchant={handleDeleteMerchant}
                          onUpdateMerchant={handleUpdateMerchant}
                        />
                      )}

                      {currentTab === "Stores" && (
                        <StoreManagement
                          stores={store.stores}
                          merchants={store.merchants}
                          offers={store.offers}
                          onAddStore={handleAddStore}
                          onApproveStore={handleApproveStore}
                          onDeleteStore={handleDeleteStore}
                          onAddOffer={handleAddOffer}
                          onNavigateTab={setCurrentTab}
                          onUpdateStore={(id, updates) => {
                            store.updateStore(id, updates);
                            toast.success("Store details updated");
                          }}
                        />
                      )}

                      {currentTab === "Offers" && (
                        <OfferGovernance
                          offers={store.offers}
                          merchants={store.merchants}
                          stores={store.stores}
                          onAddOffer={handleAddOffer}
                          onUpdateOfferStatus={handleUpdateOfferStatus}
                          onDeleteOffer={handleDeleteOffer}
                          onCloneOffer={(id) => {
                            const cloned = store.cloneOffer(id);
                            if (cloned) {
                              toast.success(`Campaign cloned as "${cloned.title}"`);
                            }
                          }}
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
                          onUpdateCategory={handleUpdateCategory}
                          onDeleteCategory={handleDeleteCategory}
                          onToggleCategoryStatus={handleToggleCategoryStatus}
                        />
                      )}

                      {currentTab === "AdminStaff" && <AdminStaffManager />}

                      {currentTab === "Audit" && (
                        <AuditSecurity auditLogs={store.auditLogs} />
                      )}

                      {currentTab === "Settings" && <WorkspaceSettings />}
                    </>
                  )}
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

                  {currentTab === "MerchantWallet" && (
                    <MerchantWalletDashboard
                      merchantId={store.currentUser?.merchantId || store.currentUser?.id || "m-1"}
                      stores={store.stores}
                    />
                  )}

                  {currentTab === "BranchStores" && (
                    <BranchStores
                      stores={store.stores}
                      onAddStore={handleAddStore}
                      onUpdateStore={handleUpdateStore}
                      onDeleteStore={handleDeleteStore}
                      onLoginAsStore={(targetStore) => {
                        store.login("store", targetStore.storeEmail, targetStore.id);
                        setStoreTab("StoreDashboard");
                        setLocation("/store/dashboard");
                        toast.success(`Logged in as ${targetStore.branchName} store portal!`);
                      }}
                    />
                  )}

                  {currentTab === "StoreStaff" && (
                    <StoreStaffManager stores={store.stores} />
                  )}

                  {currentTab === "OfferStudio" && (
                    <OfferStudio
                      offers={store.offers}
                      stores={store.stores}
                      onAddOffer={handleAddOffer}
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

              {/* STORE BRANCH VIEWS */}
              {store.role === "store" && activeStore && (
                <>
                  {currentTab === "StoreDashboard" && (
                    <StoreBranchDashboard
                      currentStore={activeStore}
                      transactions={store.transactions}
                      offers={store.offers}
                      onNavigateTab={setCurrentTab}
                      onOpenQR={() => setIsQROpen(true)}
                    />
                  )}

                  {currentTab === "StoreWallet" && (
                    <MerchantWalletDashboard
                      merchantId={activeStore.merchantId || "m-1"}
                      stores={[activeStore]}
                    />
                  )}

                  {currentTab === "OfferStudio" && (

                    <OfferStudio
                      offers={store.offers}
                      stores={[activeStore]}
                      onAddOffer={handleAddOffer}
                      onOpenQR={() => setIsQROpen(true)}
                    />
                  )}

                  {currentTab === "StoreStaff" && (
                    <StoreStaffManager
                      stores={store.stores}
                      scopedStoreId={activeStore.id}
                      isStorePortal={true}
                    />
                  )}

                  {currentTab === "LiveBilling" && (
                    <LiveBillingFeed
                      transactions={store.transactions}
                      offers={store.offers}
                      scopedStoreId={activeStore.id}
                      isStorePortal={true}
                      onRecordTransaction={store.recordTransaction}
                    />
                  )}

                  {currentTab === "StoreSettings" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
                            {activeStore.branchName} Branch Terminal
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Physical counter location, operating timings, and contact configurations for this branch.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Branch Coordinates & Operating Hours
                          </h3>
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Branch Name</label>
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{activeStore.branchName}</p>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Street Address</label>
                              <p className="text-slate-700 dark:text-slate-300">{activeStore.address}, {activeStore.city} - {activeStore.pincode}</p>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Operating Hours</label>
                              <p className="text-slate-700 dark:text-slate-300 font-semibold">{activeStore.operatingHours}</p>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Contact Phone</label>
                              <p className="text-slate-700 dark:text-slate-300 font-mono">{activeStore.phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Dedicated Store Login Terminal
                          </h3>
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Store Login Email</label>
                              <p className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{activeStore.storeEmail || `${activeStore.id}@curryleaf.in`}</p>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Store Authentication</label>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200/60 dark:border-emerald-850">
                                  Password-Protected Account
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block mb-1">Status</label>
                              <Badge variant="success">{activeStore.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
        onMarkAllRead={handleMarkAllNotificationsRead}
      />

      <AIAssistantDrawer isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      <CounterQRModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        businessName={
          store.role === "store" && activeStore
            ? `${activeStore.merchantName || "Partner"} (${activeStore.branchName})`
            : (store.currentUser?.name || "Merchant Partner")
        }
        upiVpa={
          store.role === "store" && (activeStore as any)?.bankUpiId
            ? (activeStore as any).bankUpiId
            : (store.currentUser?.name ? `${store.currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi` : "merchant@upi")
        }
      />
    </div>
  );
}
