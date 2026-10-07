import {
  Merchant,
  Store,
  Offer,
  Transaction,
  Customer,
  Category,
  RewardRule,
  AuditEvent,
  NotificationItem,
  UserRole
} from "../types";

const STORAGE_KEYS = {
  MERCHANTS: "pinak_merchants_live",
  STORES: "pinak_stores_live",
  OFFERS: "pinak_offers_live",
  TRANSACTIONS: "pinak_transactions_live",
  CUSTOMERS: "pinak_customers_live",
  CATEGORIES: "pinak_categories_live",
  REWARDS: "pinak_rewards_live",
  AUDIT: "pinak_audit_live",
  NOTIFICATIONS: "pinak_notifications_live",
  CURRENT_USER: "pinak_current_user",
  IS_AUTHENTICATED: "pinak_is_authenticated",
  USER_ROLE: "pinak_user_role",
  USER_EMAIL: "pinak_user_email",
  ACTIVE_STORE: "pinak_active_store",
  CITIES: "pinak_cities_live",
  DISCOVERY_CURATION: "pinak_discovery_curation_live",
};

// Clean out any legacy mock storage keys with dummy seed records
function purgeLegacyMockStorage() {
  try {
    const legacyKeys = [
      "pinak_merchants_v2",
      "pinak_stores_v2",
      "pinak_offers_v2",
      "pinak_transactions_v2",
      "pinak_customers_v2",
      "pinak_categories_v2",
      "pinak_rewards_v2",
      "pinak_audit_v2",
      "pinak_notifications_v2",
      "pinak_mock_seeded"
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));

    // Also purge any cached audit logs containing legacy mock IDs or old dummy email
    const currentAuditRaw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (
      currentAuditRaw &&
      (currentAuditRaw.includes("aud-auth-101") ||
        currentAuditRaw.includes("aud-merch-102") ||
        currentAuditRaw.includes("aud-store-104") ||
        currentAuditRaw.includes("admin@pinak.in"))
    ) {
      localStorage.removeItem(STORAGE_KEYS.AUDIT);
    }

    // Purge old dummy merchant records from localStorage if present
    const currentMerchRaw = localStorage.getItem(STORAGE_KEYS.MERCHANTS);
    if (
      currentMerchRaw &&
      (currentMerchRaw.includes("The Bombay Canteen") ||
        currentMerchRaw.includes("The Curry Leaf") ||
        currentMerchRaw.includes("Curry Leaf Hospitality") ||
        currentMerchRaw.includes("Hunger Inc"))
    ) {
      localStorage.removeItem(STORAGE_KEYS.MERCHANTS);
    }

    // Purge old dummy store records from localStorage if present
    const currentStoresRaw = localStorage.getItem(STORAGE_KEYS.STORES);
    if (
      currentStoresRaw &&
      (currentStoresRaw.includes("Dharampeth Flagship") ||
        currentStoresRaw.includes("Civil Lines Executive") ||
        currentStoresRaw.includes("The Curry Leaf") ||
        currentStoresRaw.includes("The Bombay Canteen"))
    ) {
      localStorage.removeItem(STORAGE_KEYS.STORES);
    }

    // Purge old dummy offer records from localStorage if present
    const currentOffersRaw = localStorage.getItem(STORAGE_KEYS.OFFERS);
    if (
      currentOffersRaw &&
      (currentOffersRaw.includes("The Curry Leaf") ||
        currentOffersRaw.includes("The Bombay Canteen"))
    ) {
      localStorage.removeItem(STORAGE_KEYS.OFFERS);
    }

    const currentBroadcasts = localStorage.getItem("pinak_broadcast_campaigns");
    if (currentBroadcasts && (currentBroadcasts.includes("The Curry Leaf") || currentBroadcasts.includes("bc-1"))) {
      localStorage.removeItem("pinak_broadcast_campaigns");
    }

    const currentPlaybooks = localStorage.getItem("pinak_growth_playbooks");
    if (currentPlaybooks && (currentPlaybooks.includes("The Curry Leaf") || currentPlaybooks.includes("pb-1"))) {
      localStorage.removeItem("pinak_growth_playbooks");
    }
  } catch {
    // Ignore storage access errors in non-browser environments
  }
}
purgeLegacyMockStorage();

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach(l => l());
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/security errors
  }
  emitChange();
}

export interface CurrentUserProfile {
  id?: string;
  merchantId?: string;
  name: string;
  email: string;
  role: UserRole;
  staffScope?: string;
  staffRoleId?: string;
  staffRoleName?: string;
  permissions?: Record<string, boolean>;
  status?: string;
}

export const appStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Auth State
  isAuthenticated(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === "true";
    } catch {
      return false;
    }
  },

  getCurrentRole(): UserRole {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole | null;
      if (stored === "admin" || stored === "merchant" || stored === "store") {
        return stored;
      }
      return "admin";
    } catch {
      return "admin";
    }
  },

  setCurrentRole(role: UserRole) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    } catch {}
    emitChange();
  },

  getCurrentUser(): CurrentUserProfile | null {
    return getStored<CurrentUserProfile | null>(
      STORAGE_KEYS.CURRENT_USER,
      null
    );
  },

  hasPermission(permKey: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.status === "SUSPENDED") return false;
    if (user.role !== "admin") return true;
    const isSuperAdmin =
      user.email?.toLowerCase() === "riya.admin@pinak.app" ||
      user.staffRoleId === "SUPERADMIN" ||
      user.staffRoleName?.toUpperCase() === "SUPER ADMIN";
    if (isSuperAdmin) {
      return true;
    }
    if (!user.permissions) return false;
    return !!user.permissions[permKey];
  },

  getActiveStoreId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_STORE) || null;
    } catch {
      return null;
    }
  },

  setActiveStoreId(id: string | null) {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_STORE);
      }
    } catch {}
    emitChange();
  },

  login(
    role: UserRole,
    email?: string,
    storeId?: string,
    userMeta?: {
      id?: string;
      name?: string;
      roleName?: string;
      staffRoleName?: string;
      staffRoleId?: string;
      staffScope?: string;
      permissions?: Record<string, boolean> | string;
      status?: string;
    }
  ) {
    try {
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "true");
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      if (email) localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      if (storeId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE, storeId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_STORE);
      }

      let parsedPermissions: Record<string, boolean> | undefined;
      if (typeof userMeta?.permissions === "string") {
        try {
          parsedPermissions = JSON.parse(userMeta.permissions);
        } catch {
          parsedPermissions = undefined;
        }
      } else if (typeof userMeta?.permissions === "object") {
        parsedPermissions = userMeta.permissions as Record<string, boolean>;
      }

      // Sanitize: ONLY retain boolean values for legitimate permission keys (strip inviteToken, inviteExpiresAt, etc.)
      if (parsedPermissions && typeof parsedPermissions === "object") {
        const cleanPerms: Record<string, boolean> = {};
        for (const [key, val] of Object.entries(parsedPermissions)) {
          if (typeof val === "boolean") {
            cleanPerms[key] = val;
          }
        }
        parsedPermissions = cleanPerms;
      }

      const userProfile: CurrentUserProfile = {
        id: userMeta?.id,
        name: userMeta?.name || (role === "admin" ? "Platform Administrator" : role === "store" ? "Store Manager" : "Merchant Partner"),
        email: email || (role === "admin" ? "admin@pinak.app" : "partner@pinak.app"),
        role,
        staffScope: userMeta?.staffScope,
        staffRoleId: userMeta?.staffRoleId,
        staffRoleName: userMeta?.staffRoleName || userMeta?.roleName,
        permissions: parsedPermissions,
        status: userMeta?.status,
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userProfile));
    } catch {}
    emitChange();
  },

  updateCurrentUser(updates: Partial<CurrentUserProfile>) {
    const current = this.getCurrentUser();
    if (!current) return;
    const updated: CurrentUserProfile = {
      ...current,
      ...updates,
      permissions: updates.permissions !== undefined ? updates.permissions : current.permissions,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    } catch {}
    emitChange();
  },

  logout() {
    try {
      localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STORE);
    } catch {}
    emitChange();
  },

  // Real Collections (No dummy/mock seed records)
  getMerchants(): Merchant[] {
    return getStored<Merchant[]>(STORAGE_KEYS.MERCHANTS, []);
  },
  setMerchants(merchants: Merchant[]) {
    setStored(STORAGE_KEYS.MERCHANTS, merchants);
  },
  addMerchant(draft: Partial<Merchant>): Merchant {
    const all = this.getMerchants();
    const currentUser = this.getCurrentUser();
    const creatorName = draft.createdBy || (currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Super Admin (admin@pinak.app)");
    const creatorRole = draft.createdRole || currentUser?.staffRoleName || (currentUser?.role === "admin" ? "SUPERADMIN" : "OPERATIONS_LEAD");

    const newMerchant: Merchant = {
      id: draft.id || `m-${Date.now()}`,
      businessName: draft.businessName || "New Merchant",
      legalEntityName: draft.legalEntityName || draft.businessName || "New Merchant",
      categoryId: draft.categoryId || "",
      categoryName: draft.categoryName || "",
      ownerName: draft.ownerName || "Merchant Owner",
      ownerEmail: draft.ownerEmail || "",
      ownerPhone: draft.ownerPhone || "",
      city: draft.city || "Nagpur",
      district: draft.district || "Nagpur",
      state: draft.state || "Maharashtra",
      bankUpiId: draft.bankUpiId || "",
      gstin: draft.gstin || "",
      pan: draft.pan || "",
      kycStatus: draft.kycStatus || "PENDING_REVIEW",
      status: draft.status || "ACTIVE",
      rating: draft.rating || 5.0,
      initials: (draft.businessName || "M").substring(0, 2).toUpperCase(),
      createdAt: draft.createdAt || new Date().toISOString(),
      storeCount: draft.storeCount || 1,
      createdBy: creatorName,
      createdRole: creatorRole
    };
    setStored(STORAGE_KEYS.MERCHANTS, [newMerchant, ...all]);

    this.addAudit({
      action: "MERCHANT_ONBOARDED",
      entity: `Merchant: ${newMerchant.businessName} (${newMerchant.id})`,
      actor: creatorName,
      severity: "success",
      metadata: {
        merchantId: newMerchant.id,
        businessName: newMerchant.businessName,
        legalName: newMerchant.legalEntityName,
        city: newMerchant.city,
        onboardedBy: creatorName,
        role: creatorRole
      }
    });

    return newMerchant;
  },
  updateMerchantKyc(id: string, status: "APPROVED" | "PENDING_REVIEW" | "SUBMITTED" | "REJECTED" | "SUSPENDED") {
    const all = this.getMerchants();
    const currentUser = this.getCurrentUser();
    const reviewerName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Compliance Reviewer";
    const now = new Date().toISOString();
    const target = all.find(m => m.id === id);

    const updated = all.map(m => m.id === id ? {
      ...m,
      kycStatus: status,
      kycReviewedBy: reviewerName,
      kycReviewedAt: now
    } : m);
    setStored(STORAGE_KEYS.MERCHANTS, updated);

    this.addAudit({
      action: `MERCHANT_KYC_${status}`,
      entity: `Merchant: ${target?.businessName || id}`,
      actor: reviewerName,
      severity: status === "APPROVED" ? "success" : status === "REJECTED" ? "critical" : "warning",
      metadata: {
        merchantId: id,
        businessName: target?.businessName,
        previousStatus: target?.kycStatus,
        newStatus: status,
        reviewedBy: reviewerName,
        timestamp: now
      }
    });
  },
  updateMerchant(id: string, updates: Partial<Merchant>) {
    const all = this.getMerchants();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Operations Admin";
    const target = all.find(m => m.id === id);

    const updated = all.map(m => m.id === id ? { ...m, ...updates } : m);
    setStored(STORAGE_KEYS.MERCHANTS, updated);

    this.addAudit({
      action: updates.status ? `MERCHANT_STATUS_${updates.status}` : "MERCHANT_UPDATED",
      entity: `Merchant: ${target?.businessName || id}`,
      actor: actorName,
      severity: updates.status === "SUSPENDED" ? "warning" : "info",
      metadata: {
        merchantId: id,
        businessName: target?.businessName,
        updates,
        updatedBy: actorName
      }
    });
  },
  deleteMerchant(id: string) {
    const all = this.getMerchants();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Super Admin";
    const target = all.find(m => m.id === id);

    setStored(STORAGE_KEYS.MERCHANTS, all.filter(m => m.id !== id));
    // Cascade cleanup associated stores and offers
    const stores = this.getStores();
    setStored(STORAGE_KEYS.STORES, stores.filter(s => s.merchantId !== id));
    const offers = this.getOffers();
    setStored(STORAGE_KEYS.OFFERS, offers.filter(o => o.merchantId !== id));

    this.addAudit({
      action: "MERCHANT_DELETED",
      entity: `Merchant: ${target?.businessName || id}`,
      actor: actorName,
      severity: "critical",
      metadata: {
        merchantId: id,
        businessName: target?.businessName,
        deletedBy: actorName
      }
    });
  },

  getStores(): Store[] {
    return getStored<Store[]>(STORAGE_KEYS.STORES, []);
  },
  setStores(stores: Store[]) {
    setStored(STORAGE_KEYS.STORES, stores);
  },
  addStore(draft: Partial<Store>): Store {
    const all = this.getStores();
    const newStore: Store = {
      id: draft.id || `store-${Date.now()}`,
      merchantId: draft.merchantId || "",
      merchantName: draft.merchantName || "Partner Merchant",
      storeName: draft.storeName || draft.branchName || "Store Branch",
      branchName: draft.branchName || draft.storeName || "Branch Outlet",
      address: draft.address || "",
      city: draft.city || "Nagpur",
      district: draft.district || "Nagpur",
      state: draft.state || "Maharashtra",
      pincode: draft.pincode || "440001",
      latitude: draft.latitude || 21.1458,
      longitude: draft.longitude || 79.0882,
      status: draft.status || "ACTIVE",
      phone: draft.phone || "+91 98220 00000",
      operatingHours: draft.operatingHours || "10:00 - 22:00",
      hasActiveOffer: draft.hasActiveOffer ?? false,
      createdAt: draft.createdAt || new Date().toISOString(),
      storeEmail: draft.storeEmail,
      storePin: draft.storePin,
      managerName: draft.managerName,
    };
    setStored(STORAGE_KEYS.STORES, [newStore, ...all]);
    return newStore;
  },
  approveStore(id: string) {
    const all = this.getStores();
    const updated = all.map(s => s.id === id ? { ...s, status: "ACTIVE" as const } : s);
    setStored(STORAGE_KEYS.STORES, updated);
  },
  updateStore(id: string, updates: Partial<Store>) {
    const all = this.getStores();
    const updated = all.map(s => s.id === id ? { ...s, ...updates } : s);
    setStored(STORAGE_KEYS.STORES, updated);
  },
  deleteStore(id: string) {
    const all = this.getStores();
    setStored(STORAGE_KEYS.STORES, all.filter(s => s.id !== id));
  },

  getOffers(): Offer[] {
    return getStored<Offer[]>(STORAGE_KEYS.OFFERS, []);
  },
  setOffers(offers: Offer[]) {
    setStored(STORAGE_KEYS.OFFERS, offers);
  },
  addOffer(draft: Partial<Offer>): Offer {
    const all = this.getOffers();
    const newOffer: Offer = {
      id: draft.id || `off-${Date.now()}`,
      merchantId: draft.merchantId || "",
      merchantName: draft.merchantName || "Partner Merchant",
      storeId: draft.storeId || "all",
      title: draft.title || "Special Offer",
      type: draft.type || "FLAT_PCT",
      value: draft.value || 10,
      maxDiscount: draft.maxDiscount || 100,
      minBillAmount: draft.minBillAmount || 300,
      validFrom: draft.validFrom || new Date().toISOString().split("T")[0],
      validTo: draft.validTo || "2026-12-31",
      status: draft.status || "ACTIVE",
      redemptions: draft.redemptions || 0,
      terms: draft.terms || "Standard terms apply.",
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.OFFERS, [newOffer, ...all]);
    return newOffer;
  },
  updateOfferStatus(id: string, status: "ACTIVE" | "PAUSED" | "EXPIRED" | "PENDING_APPROVAL") {
    const all = this.getOffers();
    const updated = all.map(o => o.id === id ? { ...o, status } : o);
    setStored(STORAGE_KEYS.OFFERS, updated);
  },
  updateOffer(id: string, updates: Partial<Offer>) {
    const all = this.getOffers();
    const updated = all.map(o => o.id === id ? { ...o, ...updates } : o);
    setStored(STORAGE_KEYS.OFFERS, updated);
  },
  deleteOffer(id: string) {
    const all = this.getOffers();
    setStored(STORAGE_KEYS.OFFERS, all.filter(o => o.id !== id));
  },
  cloneOffer(id: string): Offer | null {
    const all = this.getOffers();
    const existing = all.find(o => o.id === id);
    if (!existing) return null;
    const cloned: Offer = {
      ...existing,
      id: `off-${Date.now()}`,
      title: `${existing.title} (Copy)`,
      status: "ACTIVE",
      redemptions: 0,
      createdAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.OFFERS, [cloned, ...all]);
    return cloned;
  },

  getTransactions(): Transaction[] {
    return getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  },
  setTransactions(transactions: Transaction[]) {
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  recordTransaction(data: Partial<Transaction>): Transaction {
    const all = this.getTransactions();
    const newTx: Transaction = {
      id: data.id || `tx-${Date.now()}`,
      paymentIntentId: data.paymentIntentId || `pay_${Date.now()}`,
      referenceType: data.referenceType || "OFFER",
      referenceId: data.referenceId || "direct",
      customerName: data.customerName || "Customer",
      customerPhone: data.customerPhone || "+91 98220 00000",
      merchantId: data.merchantId || "",
      merchantName: data.merchantName || "Partner Merchant",
      storeName: data.storeName || "Store Outlet",
      billAmount: data.billAmount || 0,
      discountAmount: data.discountAmount || 0,
      payableAmount: data.payableAmount || 0,
      payeeVpa: data.payeeVpa || "merchant@upi",
      upiIntentUrl: data.upiIntentUrl || "",
      utr: data.utr || `UTR${Date.now()}`,
      signatureValid: true,
      status: data.status || "SUCCESS",
      settlementStatus: data.settlementStatus || "SETTLED",
      pointsEarned: data.pointsEarned || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };
    setStored(STORAGE_KEYS.TRANSACTIONS, [newTx, ...all]);
    return newTx;
  },

  getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },
  setCustomers(customers: Customer[]) {
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },
  setCategories(categories: Category[]) {
    setStored(STORAGE_KEYS.CATEGORIES, categories);
  },
  addCategory(draft: Partial<Category>): Category {
    const all = this.getCategories();
    const newCat: Category = {
      id: draft.id || `cat-${Date.now()}`,
      name: draft.name || "New Category",
      description: draft.description || "",
      parentId: draft.parentId,
      parentName: draft.parentName,
      icon: draft.icon || "Tag",
      color: draft.color || "purple",
      storeCount: 0,
      growth: "0.0%",
      status: draft.status || "ACTIVE"
    };
    setStored(STORAGE_KEYS.CATEGORIES, [...all, newCat]);
    return newCat;
  },

  getRewardRules(): RewardRule[] {
    return getStored<RewardRule[]>(STORAGE_KEYS.REWARDS, []);
  },
  addRewardRule(draft: Partial<RewardRule>): RewardRule {
    const all = this.getRewardRules();
    const newRule: RewardRule = {
      id: draft.id || `rr-${Date.now()}`,
      name: draft.name || "Custom Reward Rule",
      earnPointsPerHundred: draft.earnPointsPerHundred || 5,
      categoryFilter: draft.categoryFilter || "All categories",
      status: draft.status || "ACTIVE",
      description: draft.description || ""
    };
    setStored(STORAGE_KEYS.REWARDS, [...all, newRule]);
    return newRule;
  },

  getAuditLogs(): AuditEvent[] {
    const raw = getStored<AuditEvent[]>(STORAGE_KEYS.AUDIT, []);
    return raw.map((entry) => ({
      ...entry,
      actor: (entry.actor || "riya.admin@pinak.app (Super Admin)").replace(/admin@pinak\.in/g, "riya.admin@pinak.app"),
    }));
  },
  setAuditLogs(auditLogs: AuditEvent[]) {
    setStored(STORAGE_KEYS.AUDIT, auditLogs);
  },
  addAudit(event: Omit<AuditEvent, "id" | "time">) {
    const all = this.getAuditLogs();
    const newEntry: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}`,
      time: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.AUDIT, [newEntry, ...all].slice(0, 150));
  },

  getNotifications(): NotificationItem[] {
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  setNotifications(notifications: NotificationItem[]) {
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  addNotification(notif: Omit<NotificationItem, "id" | "time" | "read">) {
    const all = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      time: "Just now",
      read: false
    };
    setStored(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...all]);
  },
  markAllNotificationsRead() {
    const all = this.getNotifications().map(n => ({ ...n, read: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  // Operating Cities from Discovery Service
  getOperatingCities(): Array<{ id: string; name: string; slug: string; state: string; country: string }> {
    return getStored<Array<{ id: string; name: string; slug: string; state: string; country: string }>>(
      STORAGE_KEYS.CITIES,
      []
    );
  },
  setOperatingCities(cities: Array<{ id: string; name: string; slug: string; state: string; country: string }>) {
    setStored(STORAGE_KEYS.CITIES, cities);
  },

  // Discovery Curation & Ranking Weights
  getDiscoveryCuration(): {
    featuredStoreIds: Record<string, number>;
    heroOfferId: string;
    rankingWeights: {
      distance: number;
      discountValue: number;
      rating: number;
      popularity: number;
    };
    updatedAt?: string;
  } {
    return getStored(STORAGE_KEYS.DISCOVERY_CURATION, {
      featuredStoreIds: {},
      heroOfferId: "",
      rankingWeights: {
        distance: 45,
        discountValue: 30,
        rating: 15,
        popularity: 10,
      },
    });
  },

  setDiscoveryCuration(config: {
    featuredStoreIds: Record<string, number>;
    heroOfferId: string;
    rankingWeights: {
      distance: number;
      discountValue: number;
      rating: number;
      popularity: number;
    };
    updatedAt?: string;
  }) {
    setStored(STORAGE_KEYS.DISCOVERY_CURATION, config);
  },

  resetToDefaults() {
    Object.values(STORAGE_KEYS).forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    emitChange();
  }
};
