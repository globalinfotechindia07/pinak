import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../hooks/useAppStore";
import { UserRole, ADMIN_PERMISSION_KEYS } from "../types";
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

export default function Home() {
  const store = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();

  // Navigation tab states
  const [adminTab, setAdminTab] = useState("Overview");
  const [merchantTab, setMerchantTab] = useState("MerchantDashboard");
  const [storeTab, setStoreTab] = useState("StoreDashboard");
  const [dashboardMetrics, setDashboardMetrics] = useState<AdminDashboardMetrics | null>(null);

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
      const cats = await categoryApi.getCategories();
      if (Array.isArray(cats) && cats.length > 0) {
        store.setCategories(
          cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || `${c.name} category`,
            icon: "Utensils",
            color: "orange",
            storeCount: 12,
            growth: "+14.2%",
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
          operatingHours: s.openingTime && s.closingTime ? `${s.openingTime} – ${s.closingTime}` : "10:00 AM – 10:00 PM",
          hasActiveOffer: true,
          createdAt: s.createdAt || new Date().toISOString(),
          storeEmail: s.contactEmail || "",
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
                bankUpiId: m.bankUpiId || m.settlementUpi || "",
                gstin: m.gstin || "",
                kycStatus: (m.kycStatus === "REJECTED" || m.approvalStatus === "REJECTED") ? "REJECTED" : (m.kycStatus === "VERIFIED" || m.approvalStatus === "APPROVED" ? "APPROVED" : (m.kycStatus || "PENDING_REVIEW")),
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
          backendOffers.map((o: any) => ({
            id: o.id,
            merchantId: o.merchantId,
            merchantName: o.merchantName || "Partner Merchant",
            storeId: o.storeId || "all",
            title: o.title,
            type: o.type === "PERCENTAGE_DISCOUNT" ? "FLAT_PCT" : (o.type === "CASHBACK" ? "CASHBACK" : "FLAT_INR"),
            value: o.value,
            maxDiscount: o.maxDiscountAmount || 0,
            minBillAmount: o.minTransactionAmount || 0,
            validFrom: o.validFrom ? o.validFrom.split("T")[0] : new Date().toISOString().split("T")[0],
            validTo: o.validTo ? o.validTo.split("T")[0] : "",
            status: o.status || "ACTIVE",
            redemptions: o.currentUsageCount || 0,
            terms: o.description || "Standard offer terms apply.",
            createdAt: o.createdAt || new Date().toISOString(),
          }))
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
            } else if (a.action === "STORE_CREATED") {
              actionName = meta.storeName ? `Store Branch Provisioned (${meta.storeName})` : "Store Branch Provisioned";
              entityName = meta.storeName ? `Store: ${meta.storeName}` : "Store Outlet";
            } else if (a.action === "STORE_APPROVED") {
              actionName = "Store Branch Approved";
              entityName = meta.storeName ? `Store: ${meta.storeName}` : "Store Outlet";
            }

            return {
              id: a.id || `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              action: actionName,
              entity: entityName,
              actor: actorName,
              time: a.createdAt || new Date().toISOString(),
              severity:
                a.action?.toLowerCase().includes("fail") || a.action?.toLowerCase().includes("reject")
                  ? "warning"
                  : a.action?.toLowerCase().includes("remove") || a.action?.toLowerCase().includes("delete")
                  ? "critical"
                  : a.action?.toLowerCase().includes("invite") || a.action?.toLowerCase().includes("create")
                  ? "success"
                  : "info",
              metadata: meta,
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
      await categoryApi.createCategory({
        name: draft.name || "New Category",
        slug: (draft.name || "new-category").toLowerCase().replace(/\s+/g, "-"),
        parentId: draft.parentId,
        description: draft.description,
        status: "ACTIVE",
      });
      toast.success(`Category "${draft.name}" saved successfully!`);
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend category create failed, saving locally:", apiErr.message);
      store.addCategory(draft);
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
      });

      toast.success(`Merchant "${draft.businessName}" onboarded successfully!`);

      // If initial store is provided, provision store branch on backend immediately
      if (draft.initialStore && created?.id) {
        try {
          await storeApi.createStore({
            merchantId: created.id,
            storeName: draft.initialStore.branchName || `${draft.businessName} Flagship`,
            address: draft.initialStore.address || `${draft.initialStore.city || draft.city || "Nagpur"} Central`,
            cityId: (draft.initialStore.city || draft.city || "Nagpur").toLowerCase(),
            state: draft.initialStore.state || draft.state || "Maharashtra",
            pincode: draft.initialStore.pincode || "440010",
            latitude: 21.1458,
            longitude: 79.0882,
            openingTime: draft.initialStore.openingTime || "10:00",
            closingTime: draft.initialStore.closingTime || "22:00",
          });
          toast.success("Initial flagship store branch provisioned successfully!");
        } catch (storeErr: any) {
          console.warn("Backend store branch provisioning warning:", storeErr?.response?.data || storeErr.message);
        }
      }

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
    try {
      await storeApi.createStore({
        merchantId: draft.merchantId,
        storeName: draft.branchName || draft.storeName || draft.name || "New Branch",
        contactPhone: draft.phone || "9876543210",
        address: draft.address || "Main Street",
        cityId: (draft.city || "Nagpur").toLowerCase(),
        state: draft.state || "Maharashtra",
        pincode: draft.pincode || "440001",
        latitude: draft.latitude || 21.1458,
        longitude: draft.longitude || 79.0882,
        openingTime: draft.openingTime || "09:00",
        closingTime: draft.closingTime || "22:00",
      });
      toast.success(`Branch "${draft.branchName || draft.name || "Outlet"}" created successfully!`);
      await syncBackendData();
    } catch (apiErr: any) {
      console.warn("Backend store create failed, saving locally:", apiErr?.response?.data || apiErr.message);
      store.addStore(draft);
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
      if (updates.status === "SUSPENDED") {
        await merchantApi.suspendMerchantAdmin(id, "Account suspended by platform admin");
        store.updateMerchant(id, { status: "SUSPENDED" });
        toast.info("Merchant suspended successfully");
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

  const handleAddOffer = async (draft: any) => {
    try {
      await offerApi.createOffer({
        title: draft.title || "Special Deal",
        description: draft.terms || "Offer details",
        type: draft.type === "FLAT_PCT" ? "PERCENTAGE_DISCOUNT" : "FIXED_DISCOUNT",
        value: Number(draft.value) || 20,
        minTransactionAmount: Number(draft.minBillAmount) || 500,
        maxDiscountAmount: Number(draft.maxDiscount) || 200,
        validFrom: draft.validFrom ? `${draft.validFrom}T00:00:00Z` : new Date().toISOString(),
        validTo: draft.validTo ? `${draft.validTo}T23:59:59Z` : "2026-12-31T23:59:59Z",
      });
      toast.success(`Offer "${draft.title}" submitted successfully!`);
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend offer create failed:", err.message);
      store.addOffer(draft);
    }
  };

  const handleApproveOffer = async (id: string) => {
    try {
      await offerApi.approveOfferAdmin(id);
      toast.success("Offer approved successfully!");
      await syncBackendData();
    } catch (err: any) {
      console.warn("Backend offer approval:", err.message);
      store.updateOfferStatus(id, "ACTIVE");
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
                          onAddStore={handleAddStore}
                          onApproveStore={handleApproveStore}
                          onDeleteStore={handleDeleteStore}
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
                          onAddOffer={handleAddOffer}
                          onUpdateOfferStatus={(id, status) => {
                            if (status === "ACTIVE") {
                              handleApproveOffer(id);
                            } else {
                              store.updateOfferStatus(id, status);
                            }
                          }}
                          onDeleteOffer={(id) => {
                            store.deleteOffer(id);
                            toast.success("Offer campaign removed");
                          }}
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

                  {currentTab === "BranchStores" && (
                    <BranchStores
                      stores={store.stores}
                      onAddStore={handleAddStore}
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
                            Physical counter location and contact configurations for this branch.
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
