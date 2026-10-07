import { UserRole } from "../types";

// Admin Tab -> URL Path
export const ADMIN_TAB_PATHS: Record<string, string> = {
  Overview: "/admin/overview",
  Discovery: "/admin/discovery",
  Merchants: "/admin/merchants",
  Stores: "/admin/stores",
  Offers: "/admin/offers",
  Transactions: "/admin/transactions",
  Rewards: "/admin/rewards",
  Customers: "/admin/customers",
  Categories: "/admin/categories",
  AdminStaff: "/admin/staff",
  Audit: "/admin/audit",
  Settings: "/admin/settings",
};

// Merchant Tab -> URL Path
export const MERCHANT_TAB_PATHS: Record<string, string> = {
  MerchantDashboard: "/merchant/dashboard",
  BranchStores: "/merchant/stores",
  StoreStaff: "/merchant/staff",
  OfferStudio: "/merchant/offers",
  CounterQR: "/merchant/counter-qr",
  LiveBilling: "/merchant/billing",
  CustomerLoyalty: "/merchant/loyalty",
  GrowthPlaybooks: "/merchant/growth",
  Messaging: "/merchant/messaging",
  MerchantProfile: "/merchant/profile",
};

// Store Tab -> URL Path
export const STORE_TAB_PATHS: Record<string, string> = {
  StoreDashboard: "/store/dashboard",
  StoreStaff: "/store/staff",
  CounterQR: "/store/counter-qr",
  LiveBilling: "/store/billing",
  StoreSettings: "/store/settings",
};

/**
 * Get the browser URL path for a given role and tab
 */
export function getPathForTab(role: UserRole, tab: string): string {
  if (role === "admin") {
    return ADMIN_TAB_PATHS[tab] || "/admin/overview";
  }
  if (role === "store") {
    return STORE_TAB_PATHS[tab] || "/store/dashboard";
  }
  return MERCHANT_TAB_PATHS[tab] || "/merchant/dashboard";
}

/**
 * Resolve role and tab from any URL pathname
 */
export function resolveTabFromPath(
  pathname: string,
  fallbackRole: UserRole = "admin"
): { role: UserRole; tab: string; isKnown: boolean } {
  const clean = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  // Admin routes
  if (clean === "/admin" || clean === "/admin/overview" || clean === "/overview") {
    return { role: "admin", tab: "Overview", isKnown: true };
  }
  if (clean === "/admin/discovery" || clean === "/discovery") {
    return { role: "admin", tab: "Discovery", isKnown: true };
  }
  if (clean === "/admin/merchants" || clean === "/merchants" || clean === "/admin/kyc") {
    return { role: "admin", tab: "Merchants", isKnown: true };
  }
  if (clean === "/admin/stores" || clean === "/stores" || clean === "/branches") {
    return { role: "admin", tab: "Stores", isKnown: true };
  }
  if (clean === "/admin/offers" || clean === "/offers") {
    return { role: "admin", tab: "Offers", isKnown: true };
  }
  if (clean === "/admin/transactions" || clean === "/transactions" || clean === "/admin/upi") {
    return { role: "admin", tab: "Transactions", isKnown: true };
  }
  if (clean === "/admin/rewards" || clean === "/rewards") {
    return { role: "admin", tab: "Rewards", isKnown: true };
  }
  if (clean === "/admin/customers" || clean === "/customers") {
    return { role: "admin", tab: "Customers", isKnown: true };
  }
  if (clean === "/admin/categories" || clean === "/categories") {
    return { role: "admin", tab: "Categories", isKnown: true };
  }
  if (
    clean === "/admin/staff" ||
    clean === "/admin/adminstaff" ||
    clean === "/admin/admin-staff" ||
    clean === "/staff"
  ) {
    return { role: "admin", tab: "AdminStaff", isKnown: true };
  }
  if (clean === "/admin/audit" || clean === "/audit" || clean === "/rbac") {
    return { role: "admin", tab: "Audit", isKnown: true };
  }
  if (clean === "/admin/settings" || clean === "/settings") {
    return { role: "admin", tab: "Settings", isKnown: true };
  }

  // Merchant routes
  if (clean === "/merchant" || clean === "/merchant/dashboard" || clean === "/merchant/overview") {
    return { role: "merchant", tab: "MerchantDashboard", isKnown: true };
  }
  if (
    clean === "/merchant/stores" ||
    clean === "/merchant/branchstores" ||
    clean === "/merchant/branch-stores"
  ) {
    return { role: "merchant", tab: "BranchStores", isKnown: true };
  }
  if (clean === "/merchant/staff" || clean === "/merchant/storestaff") {
    return { role: "merchant", tab: "StoreStaff", isKnown: true };
  }
  if (
    clean === "/merchant/offers" ||
    clean === "/merchant/offerstudio" ||
    clean === "/merchant/offer-studio"
  ) {
    return { role: "merchant", tab: "OfferStudio", isKnown: true };
  }
  if (clean === "/merchant/counter-qr" || clean === "/merchant/qr") {
    return { role: "merchant", tab: "CounterQR", isKnown: true };
  }
  if (
    clean === "/merchant/billing" ||
    clean === "/merchant/livebilling" ||
    clean === "/merchant/live-billing"
  ) {
    return { role: "merchant", tab: "LiveBilling", isKnown: true };
  }
  if (clean === "/merchant/loyalty" || clean === "/merchant/customerloyalty") {
    return { role: "merchant", tab: "CustomerLoyalty", isKnown: true };
  }
  if (clean === "/merchant/growth" || clean === "/merchant/growthplaybooks") {
    return { role: "merchant", tab: "GrowthPlaybooks", isKnown: true };
  }
  if (clean === "/merchant/messaging" || clean === "/merchant/campaigns") {
    return { role: "merchant", tab: "Messaging", isKnown: true };
  }
  if (clean === "/merchant/profile" || clean === "/merchant/merchantprofile") {
    return { role: "merchant", tab: "MerchantProfile", isKnown: true };
  }

  // Store routes
  if (clean === "/store" || clean === "/store/dashboard" || clean === "/store/overview") {
    return { role: "store", tab: "StoreDashboard", isKnown: true };
  }
  if (clean === "/store/staff" || clean === "/store/storestaff") {
    return { role: "store", tab: "StoreStaff", isKnown: true };
  }
  if (clean === "/store/counter-qr" || clean === "/store/qr") {
    return { role: "store", tab: "CounterQR", isKnown: true };
  }
  if (clean === "/store/billing" || clean === "/store/livebilling") {
    return { role: "store", tab: "LiveBilling", isKnown: true };
  }
  if (clean === "/store/settings" || clean === "/store/storesettings") {
    return { role: "store", tab: "StoreSettings", isKnown: true };
  }

  // Root or generic fallback based on current role
  if (clean === "/" || clean === "") {
    if (fallbackRole === "merchant") {
      return { role: "merchant", tab: "MerchantDashboard", isKnown: true };
    }
    if (fallbackRole === "store") {
      return { role: "store", tab: "StoreDashboard", isKnown: true };
    }
    return { role: "admin", tab: "Overview", isKnown: true };
  }

  return {
    role: fallbackRole,
    tab: fallbackRole === "merchant" ? "MerchantDashboard" : fallbackRole === "store" ? "StoreDashboard" : "Overview",
    isKnown: false,
  };
}
