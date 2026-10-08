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
  UserRole,
  MerchantWallet,
  WalletLedgerEntry,
  MerchantBankAccount,
  MerchantPayoutRequest,
  PayoutStatus,
  StoreRevenueSummary,
  PlatformSettlementOverview
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
  WALLETS: "pinak_wallets_live",
  LEDGER: "pinak_ledger_live",
  BANK_ACCOUNTS: "pinak_bank_accounts_live",
  PAYOUTS: "pinak_payouts_live",
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
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Store Admin";

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

    this.addAudit({
      action: "STORE_CREATED",
      entity: `Store Branch: ${newStore.branchName} (${newStore.id})`,
      actor: actorName,
      severity: "success",
      metadata: {
        storeId: newStore.id,
        branchName: newStore.branchName,
        merchantName: newStore.merchantName,
        city: newStore.city,
        state: newStore.state,
        createdBy: actorName
      }
    });

    return newStore;
  },
  approveStore(id: string) {
    const all = this.getStores();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Platform Admin";
    const target = all.find(s => s.id === id);

    const updated = all.map(s => s.id === id ? { ...s, status: "ACTIVE" as const } : s);
    setStored(STORAGE_KEYS.STORES, updated);

    this.addAudit({
      action: "STORE_APPROVED",
      entity: `Store Branch: ${target?.branchName || id}`,
      actor: actorName,
      severity: "success",
      metadata: {
        storeId: id,
        branchName: target?.branchName,
        status: "ACTIVE",
        approvedBy: actorName
      }
    });
  },
  updateStore(id: string, updates: Partial<Store>) {
    const all = this.getStores();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Store Administrator";
    const target = all.find(s => s.id === id);

    const updated = all.map(s => s.id === id ? { ...s, ...updates } : s);
    setStored(STORAGE_KEYS.STORES, updated);

    this.addAudit({
      action: updates.status ? `STORE_STATUS_${updates.status}` : "STORE_UPDATED",
      entity: `Store Branch: ${target?.branchName || id}`,
      actor: actorName,
      severity: updates.status === "INACTIVE" ? "warning" : "info",
      metadata: {
        storeId: id,
        branchName: target?.branchName,
        updates,
        updatedBy: actorName
      }
    });
  },
  deleteStore(id: string) {
    const all = this.getStores();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Platform Admin";
    const target = all.find(s => s.id === id);

    setStored(STORAGE_KEYS.STORES, all.filter(s => s.id !== id));

    this.addAudit({
      action: "STORE_DELETED",
      entity: `Store Branch: ${target?.branchName || id}`,
      actor: actorName,
      severity: "critical",
      metadata: {
        storeId: id,
        branchName: target?.branchName,
        deletedBy: actorName
      }
    });
  },

  getOffers(): Offer[] {
    return getStored<Offer[]>(STORAGE_KEYS.OFFERS, []);
  },
  setOffers(offers: Offer[]) {
    setStored(STORAGE_KEYS.OFFERS, offers);
  },
  addOffer(draft: Partial<Offer>): Offer {
    const all = this.getOffers();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Merchant Partner";
    const actorRole = currentUser?.staffRoleName || (currentUser?.role === "admin" ? "SUPERADMIN" : "MERCHANT_OWNER");

    const newOffer: Offer = {
      id: draft.id || `off-${Date.now()}`,
      merchantId: draft.merchantId || "",
      merchantName: draft.merchantName || "Partner Merchant",
      storeId: draft.storeId || "all",
      applicableStoreIds: draft.applicableStoreIds || [],
      title: draft.title || "Special Offer",
      tagline: draft.tagline || "",
      type: draft.type || "FLAT_PCT",
      value: draft.value || 10,
      maxDiscount: draft.maxDiscount,
      minBillAmount: draft.minBillAmount || 300,
      perUserLimit: draft.perUserLimit ?? 1,
      maxTotalRedemptions: draft.maxTotalRedemptions,
      validFrom: draft.validFrom || new Date().toISOString().split("T")[0],
      validTo: draft.validTo || "2026-12-31",
      activeDays: draft.activeDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: draft.startTime || "",
      endTime: draft.endTime || "",
      redemptionMethod: draft.redemptionMethod || "AUTO_APPLIED",
      promoCode: draft.promoCode || "",
      imageUrl: draft.imageUrl || "",
      status: draft.status || "PENDING_APPROVAL",
      redemptions: draft.redemptions || 0,
      terms: draft.terms || "Standard terms apply.",
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.OFFERS, [newOffer, ...all]);

    this.addAudit({
      action: "OFFER_CREATED",
      entity: `Offer Campaign: ${newOffer.title} (${newOffer.id})`,
      actor: actorName,
      severity: "success",
      metadata: {
        offerId: newOffer.id,
        title: newOffer.title,
        merchantName: newOffer.merchantName,
        discountType: newOffer.type,
        value: newOffer.value,
        maxDiscountCap: newOffer.maxDiscount || "No Cap",
        perUserLimit: newOffer.perUserLimit || "Unlimited",
        maxTotalBudget: newOffer.maxTotalRedemptions || "Unlimited",
        redemptionMethod: newOffer.redemptionMethod,
        createdRole: actorRole,
        actor: actorName
      }
    });

    return newOffer;
  },
  updateOfferStatus(id: string, status: "ACTIVE" | "PAUSED" | "EXPIRED" | "PENDING_APPROVAL" | "REJECTED", reason?: string) {
    const all = this.getOffers();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Operations Admin";
    const target = all.find(o => o.id === id);

    const updated = all.map(o => o.id === id ? { ...o, status } : o);
    setStored(STORAGE_KEYS.OFFERS, updated);

    const actionType =
      status === "ACTIVE"
        ? "OFFER_APPROVED"
        : status === "REJECTED"
        ? "OFFER_REJECTED"
        : status === "PAUSED"
        ? "OFFER_PAUSED"
        : status === "EXPIRED"
        ? "OFFER_EXPIRED"
        : "OFFER_STATUS_CHANGED";

    this.addAudit({
      action: actionType,
      entity: `Offer Campaign: ${target?.title || id}`,
      actor: actorName,
      severity: status === "ACTIVE" ? "success" : status === "REJECTED" ? "critical" : "warning",
      metadata: {
        offerId: id,
        title: target?.title,
        previousStatus: target?.status,
        newStatus: status,
        reason: reason || undefined,
        updatedBy: actorName
      }
    });
  },
  updateOffer(id: string, updates: Partial<Offer>) {
    const all = this.getOffers();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Offer Administrator";
    const target = all.find(o => o.id === id);

    const updated = all.map(o => o.id === id ? { ...o, ...updates } : o);
    setStored(STORAGE_KEYS.OFFERS, updated);

    this.addAudit({
      action: "OFFER_UPDATED",
      entity: `Offer Campaign: ${target?.title || id}`,
      actor: actorName,
      severity: "info",
      metadata: {
        offerId: id,
        title: target?.title,
        updates,
        updatedBy: actorName
      }
    });
  },
  deleteOffer(id: string) {
    const all = this.getOffers();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Platform Admin";
    const target = all.find(o => o.id === id);

    setStored(STORAGE_KEYS.OFFERS, all.filter(o => o.id !== id));

    this.addAudit({
      action: "OFFER_DELETED",
      entity: `Offer Campaign: ${target?.title || id}`,
      actor: actorName,
      severity: "critical",
      metadata: {
        offerId: id,
        title: target?.title,
        deletedBy: actorName
      }
    });
  },
  cloneOffer(id: string): Offer | null {
    const all = this.getOffers();
    const currentUser = this.getCurrentUser();
    const actorName = currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Merchant Partner";
    const existing = all.find(o => o.id === id);
    if (!existing) return null;
    const cloned: Offer = {
      ...existing,
      id: `off-${Date.now()}`,
      title: `${existing.title} (Copy)`,
      status: "PENDING_APPROVAL",
      redemptions: 0,
      createdAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.OFFERS, [cloned, ...all]);

    this.addAudit({
      action: "OFFER_CREATED",
      entity: `Offer Campaign: ${cloned.title} (${cloned.id})`,
      actor: actorName,
      severity: "success",
      metadata: {
        offerId: cloned.id,
        title: cloned.title,
        clonedFrom: id,
        clonedBy: actorName
      }
    });

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

  // Merchant Wallet & double-entry ledger methods
  getMerchantWallet(merchantId: string = "m-1"): MerchantWallet {
    const wallets = getStored<MerchantWallet[]>(STORAGE_KEYS.WALLETS, []);
    let wallet = wallets.find(w => w.merchantId === merchantId);
    if (!wallet) {
      wallet = {
        id: `wal-${merchantId}`,
        merchantId,
        currency: "INR",
        availableBalance: 185400.0,
        pendingBalance: 12500.0,
        totalWithdrawn: 420000.0,
        lifetimeVolume: 617900.0,
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      };
      setStored(STORAGE_KEYS.WALLETS, [wallet, ...wallets]);
    }
    return wallet;
  },

  getMerchantLedger(merchantId: string = "m-1", storeId?: string): WalletLedgerEntry[] {
    const entries = getStored<WalletLedgerEntry[]>(STORAGE_KEYS.LEDGER, [
      {
        id: "led-101",
        walletId: `wal-${merchantId}`,
        storeId: "st-1",
        storeName: "Dharampeth Flagship",
        entryType: "CREDIT",
        amount: 2450.0,
        feeDeducted: 122.5,
        netAmount: 2327.5,
        runningBalance: 185400.0,
        description: "Counter Bill UPI Settlement - Order #PINAK-8912",
        sourceReference: "TX_UPI_982137",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "led-102",
        walletId: `wal-${merchantId}`,
        storeId: "st-2",
        storeName: "Civil Lines Executive",
        entryType: "CREDIT",
        amount: 1800.0,
        feeDeducted: 90.0,
        netAmount: 1710.0,
        runningBalance: 183072.5,
        description: "Flash Offer Redemption - Flat 20% OFF",
        sourceReference: "TX_OFFER_55123",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "led-103",
        walletId: `wal-${merchantId}`,
        entryType: "HOLD",
        amount: 50000.0,
        feeDeducted: 5.0,
        netAmount: 49995.0,
        runningBalance: 181362.5,
        description: "Instant Bank Payout Request - HDFC Bank **8891",
        sourceReference: "PAYOUT_REQ_9812",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: "led-104",
        walletId: `wal-${merchantId}`,
        entryType: "DEBIT",
        amount: 50000.0,
        feeDeducted: 5.0,
        netAmount: 49995.0,
        runningBalance: 131362.5,
        description: "Bank Transfer Settled - UTR: AXIS2026100799812",
        sourceReference: "UTR_AXIS2026100799812",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]);

    if (storeId && storeId !== "ALL") {
      return entries.filter(e => e.storeId === storeId);
    }
    return entries;
  },

  getMerchantBankAccounts(merchantId: string = "m-1"): MerchantBankAccount[] {
    return getStored<MerchantBankAccount[]>(STORAGE_KEYS.BANK_ACCOUNTS, [
      {
        id: "bank-101",
        merchantId,
        accountHolderName: "Silver Spoon Hospitality Pvt Ltd",
        bankName: "HDFC Bank",
        accountNumberLast4: "8891",
        ifscCode: "HDFC0001234",
        upiVpa: "silverspoon@hdfcbank",
        isPrimary: true,
        verificationStatus: "VERIFIED",
        pennyDropReference: "PENNY_REF_981237",
        createdAt: "2026-01-15T10:00:00Z"
      },
      {
        id: "bank-102",
        merchantId,
        accountHolderName: "Silver Spoon Operations",
        bankName: "ICICI Bank",
        accountNumberLast4: "4021",
        ifscCode: "ICIC0005521",
        upiVpa: "silverspoon.ops@icici",
        isPrimary: false,
        verificationStatus: "VERIFIED",
        pennyDropReference: "PENNY_REF_551299",
        createdAt: "2026-03-10T14:30:00Z"
      }
    ]);
  },

  addMerchantBankAccount(account: Omit<MerchantBankAccount, "id" | "createdAt">): MerchantBankAccount {
    const list = this.getMerchantBankAccounts(account.merchantId);
    const newAcc: MerchantBankAccount = {
      ...account,
      id: `bank-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newAcc, ...list];
    setStored(STORAGE_KEYS.BANK_ACCOUNTS, updated);
    this.addAudit({
      action: "BANK_ACCOUNT_ADDED",
      entity: `Merchant Bank Account (${account.bankName} **${account.accountNumberLast4})`,
      actor: "Merchant Owner",
      severity: "info",
      metadata: { bankId: newAcc.id, bankName: account.bankName, ifsc: account.ifscCode }
    });
    return newAcc;
  },

  getMerchantPayouts(merchantId?: string): MerchantPayoutRequest[] {
    const payouts = getStored<MerchantPayoutRequest[]>(STORAGE_KEYS.PAYOUTS, [
      {
        id: "pout-101",
        merchantId: merchantId || "m-1",
        merchantName: "Silver Spoon Hospitality",
        walletId: "wal-m-1",
        bankAccountId: "bank-101",
        bankName: "HDFC Bank",
        accountNumberLast4: "8891",
        accountHolderName: "Silver Spoon Hospitality Pvt Ltd",
        amount: 50000.0,
        payoutFee: 5.0,
        netPayout: 49995.0,
        currency: "INR",
        mode: "IMPS",
        status: "SUCCESS",
        provider: "RAZORPAYX",
        providerPayoutId: "pout_9821378123",
        bankUtr: "AXIS2026100799812",
        idempotencyKey: "idem-key-9812",
        requestedBy: "usr-merchant-owner",
        processedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: "pout-102",
        merchantId: merchantId || "m-1",
        merchantName: "Silver Spoon Hospitality",
        walletId: "wal-m-1",
        bankAccountId: "bank-101",
        bankName: "HDFC Bank",
        accountNumberLast4: "8891",
        accountHolderName: "Silver Spoon Hospitality Pvt Ltd",
        amount: 25000.0,
        payoutFee: 5.0,
        netPayout: 24995.0,
        currency: "INR",
        mode: "IMPS",
        status: "PROCESSING",
        provider: "RAZORPAYX",
        providerPayoutId: "pout_5512991002",
        bankUtr: "Pending RBI Clearing",
        idempotencyKey: `idem-key-${Date.now()}`,
        requestedBy: "usr-merchant-owner",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]);

    if (merchantId) {
      return payouts.filter(p => p.merchantId === merchantId);
    }
    return payouts;
  },

  requestMerchantPayout(merchantId: string, amount: number, bankAccountId: string, mode: "IMPS" | "NEFT" | "RTGS" | "UPI" = "IMPS"): MerchantPayoutRequest {
    const wallet = this.getMerchantWallet(merchantId);
    if (wallet.availableBalance < amount) {
      throw new Error("Insufficient available wallet balance for payout request");
    }

    const banks = this.getMerchantBankAccounts(merchantId);
    const bank = banks.find(b => b.id === bankAccountId) || banks[0];

    const fee = 5.0;
    const netPayout = amount - fee;

    // Deduct available, add to pending
    const wallets = getStored<MerchantWallet[]>(STORAGE_KEYS.WALLETS, []);
    const updatedWallets = wallets.map(w => {
      if (w.merchantId === merchantId) {
        return {
          ...w,
          availableBalance: w.availableBalance - amount,
          pendingBalance: w.pendingBalance + amount,
          updatedAt: new Date().toISOString()
        };
      }
      return w;
    });
    setStored(STORAGE_KEYS.WALLETS, updatedWallets);

    const newPayout: MerchantPayoutRequest = {
      id: `pout-${Date.now()}`,
      merchantId,
      merchantName: "Silver Spoon Hospitality",
      walletId: wallet.id,
      bankAccountId: bank.id,
      bankName: bank.bankName,
      accountNumberLast4: bank.accountNumberLast4,
      accountHolderName: bank.accountHolderName,
      amount,
      payoutFee: fee,
      netPayout,
      currency: "INR",
      mode,
      status: "PROCESSING",
      provider: "RAZORPAYX",
      providerPayoutId: `pout_${Date.now()}`,
      bankUtr: `AXIS2026100${Math.floor(100000 + Math.random() * 900000)}`,
      idempotencyKey: `idem-${Date.now()}`,
      requestedBy: "usr-merchant-owner",
      createdAt: new Date().toISOString()
    };

    const payouts = this.getMerchantPayouts();
    setStored(STORAGE_KEYS.PAYOUTS, [newPayout, ...payouts]);

    // Record immutable HOLD ledger entry
    const ledger = this.getMerchantLedger(merchantId);
    const newLedgerEntry: WalletLedgerEntry = {
      id: `led-${Date.now()}`,
      walletId: wallet.id,
      entryType: "HOLD",
      amount,
      feeDeducted: fee,
      netAmount: netPayout,
      runningBalance: wallet.availableBalance - amount,
      description: `Instant Bank Payout Request - ${bank.bankName} (**${bank.accountNumberLast4})`,
      sourceReference: `PAYOUT_REQ_${newPayout.id.slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.LEDGER, [newLedgerEntry, ...ledger]);

    this.addAudit({
      action: "MERCHANT_PAYOUT_REQUESTED",
      entity: `Bank Payout ₹${amount.toLocaleString()} (${bank.bankName} **${bank.accountNumberLast4})`,
      actor: "Merchant Owner",
      severity: "info",
      metadata: { payoutId: newPayout.id, amount, mode, utr: newPayout.bankUtr }
    });

    emitChange();
    return newPayout;
  },

  adminActionOnPayout(payoutId: string, action: "HOLD" | "RELEASE" | "RETRY"): MerchantPayoutRequest {
    const payouts = this.getMerchantPayouts();
    let target: MerchantPayoutRequest | undefined;
    const updated = payouts.map(p => {
      if (p.id === payoutId) {
        let status: PayoutStatus = p.status;
        if (action === "HOLD") status = "HELD";
        if (action === "RELEASE" || action === "RETRY") status = "PROCESSING";
        target = { ...p, status };
        return target;
      }
      return p;
    });
    setStored(STORAGE_KEYS.PAYOUTS, updated);

    if (target) {
      this.addAudit({
        action: `PAYOUT_${action}`,
        entity: `Payout Request ${payoutId} (₹${target.amount.toLocaleString()})`,
        actor: "Super Admin",
        severity: action === "HOLD" ? "warning" : "info",
        metadata: { payoutId, action, status: target.status }
      });
    }

    emitChange();
    return target!;
  },

  getStoreRevenueBreakdown(merchantId: string = "m-1"): StoreRevenueSummary[] {
    const stores = this.getStores().filter(s => s.merchantId === merchantId || s.merchantId === "m-1");
    return stores.map(st => ({
      storeId: st.id,
      storeName: st.storeName,
      totalSalesCount: Math.floor(Math.random() * 40) + 15,
      grossVolume: st.id === "st-1" ? 120000.0 : 85000.0,
      netEarnings: st.id === "st-1" ? 114000.0 : 80750.0,
      pendingClearing: 0.0
    }));
  },

  getPlatformSettlementOverview(): PlatformSettlementOverview {
    const wallets = getStored<MerchantWallet[]>(STORAGE_KEYS.WALLETS, []);
    const payouts = this.getMerchantPayouts();

    const gmv = wallets.reduce((acc, w) => acc + (w.lifetimeVolume || 617900), 4850000.0);
    const escrow = wallets.reduce((acc, w) => acc + (w.availableBalance || 185400), 1240000.0);

    return {
      totalPlatformGmv: gmv,
      totalEscrowBalance: escrow,
      netCommissionEarned: gmv * 0.025,
      totalMerchantWallets: Math.max(wallets.length, 42),
      pendingPayoutCount: payouts.filter(p => p.status === "PROCESSING" || p.status === "INITIATED").length,
      pendingPayoutVolume: payouts.filter(p => p.status === "PROCESSING" || p.status === "INITIATED").reduce((acc, p) => acc + p.amount, 0),
      failedPayoutCount: payouts.filter(p => p.status === "FAILED" || p.status === "HELD").length
    };
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

export const dataStore = appStore;
