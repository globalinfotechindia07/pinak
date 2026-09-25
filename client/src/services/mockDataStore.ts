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
  MERCHANTS: "pinak_merchants_v2",
  STORES: "pinak_stores_v2",
  OFFERS: "pinak_offers_v2",
  TRANSACTIONS: "pinak_transactions_v2",
  CUSTOMERS: "pinak_customers_v2",
  CATEGORIES: "pinak_categories_v2",
  REWARDS: "pinak_rewards_v2",
  AUDIT: "pinak_audit_v2",
  NOTIFICATIONS: "pinak_notifications_v2",
  CURRENT_USER: "pinak_current_user_v2",
};

// Seed Categories
const SEED_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Food & Dining", description: "Restaurants, cafes, bistros, cloud kitchens", icon: "Utensils", color: "orange", storeCount: 842, growth: "18.4%", status: "ACTIVE" },
  { id: "cat-2", name: "Beauty & Wellness", description: "Salons, luxury spas, grooming, dermatology", icon: "Sparkles", color: "pink", storeCount: 318, growth: "12.1%", status: "ACTIVE" },
  { id: "cat-3", name: "Gym & Fitness", description: "Fitness clubs, crossfit, yoga, martial arts", icon: "Dumbbell", color: "emerald", storeCount: 142, growth: "15.8%", status: "ACTIVE" },
  { id: "cat-4", name: "Retail & Shopping", description: "Fashion, electronics, lifestyle, apparel", icon: "ShoppingBag", color: "blue", storeCount: 206, growth: "9.8%", status: "ACTIVE" },
  { id: "cat-5", name: "Stay & Travel", description: "Boutique hotels, weekend resorts, experiences", icon: "Hotel", color: "purple", storeCount: 94, growth: "22.6%", status: "ACTIVE" },
  { id: "cat-6", name: "Cafes & Bakeries", description: "Specialty coffee, artisanal bakery, desserts", parentId: "cat-1", parentName: "Food & Dining", icon: "Coffee", color: "amber", storeCount: 120, growth: "20.1%", status: "ACTIVE" }
];

// Seed Merchants (Brand Level)
const SEED_MERCHANTS: Merchant[] = [
  {
    id: "m-1",
    businessName: "The Curry Leaf",
    legalEntityName: "Curry Leaf Hospitality Pvt Ltd",
    categoryId: "cat-1",
    categoryName: "Food & Dining",
    ownerName: "Sunil Deshmukh",
    ownerEmail: "sunil@curryleaf.in",
    ownerPhone: "+91 98221 44550",
    city: "Nagpur",
    bankUpiId: "thecurryleaf@icici",
    gstin: "27AABCC8921N1Z5",
    pan: "AABCC8921N",
    kycStatus: "APPROVED",
    status: "ACTIVE",
    rating: 4.8,
    initials: "TC",
    createdAt: "2026-08-10T10:00:00Z",
    storeCount: 3
  },
  {
    id: "m-2",
    businessName: "Glow Theory Studio",
    legalEntityName: "Glow Theory Salon LLP",
    categoryId: "cat-2",
    categoryName: "Beauty & Wellness",
    ownerName: "Pooja Hegde",
    ownerEmail: "pooja@glowtheory.com",
    ownerPhone: "+91 97665 11223",
    city: "Pune",
    bankUpiId: "glowtheory@hdfcbank",
    gstin: "27AAHFG3321P1Z9",
    pan: "AAHFG3321P",
    kycStatus: "APPROVED",
    status: "ACTIVE",
    rating: 4.7,
    initials: "GT",
    createdAt: "2026-08-18T14:30:00Z",
    storeCount: 2
  },
  {
    id: "m-3",
    businessName: "Stride Fitness Club",
    legalEntityName: "Stride Athletic & Wellness Works",
    categoryId: "cat-3",
    categoryName: "Gym & Fitness",
    ownerName: "Vikram Rane",
    ownerEmail: "vikram@stridefitness.in",
    ownerPhone: "+91 98200 55432",
    city: "Mumbai",
    bankUpiId: "stridefit@okaxis",
    gstin: "27AATCS4455K1Z2",
    pan: "AATCS4455K",
    kycStatus: "PENDING_REVIEW",
    status: "ACTIVE",
    rating: 4.5,
    initials: "SF",
    createdAt: "2026-09-02T09:15:00Z",
    storeCount: 4
  },
  {
    id: "m-4",
    businessName: "Bloom & Brew",
    legalEntityName: "Bloom & Brew Artisanal Coffee",
    categoryId: "cat-6",
    categoryName: "Cafes & Bakeries",
    ownerName: "Neha Nair",
    ownerEmail: "neha@bloombrew.in",
    ownerPhone: "+91 99234 88771",
    city: "Pune",
    bankUpiId: "bloombrew@yesbank",
    gstin: "27AAOPB9988D1Z7",
    pan: "AAOPB9988D",
    kycStatus: "APPROVED",
    status: "ACTIVE",
    rating: 4.9,
    initials: "BB",
    createdAt: "2026-08-25T11:20:00Z",
    storeCount: 1
  },
  {
    id: "m-5",
    businessName: "Urban Nest Living",
    legalEntityName: "Urban Nest Home Decor Pvt Ltd",
    categoryId: "cat-4",
    categoryName: "Retail & Shopping",
    ownerName: "Anil Agarwal",
    ownerEmail: "anil@urbannest.in",
    ownerPhone: "+91 94228 33119",
    city: "Nagpur",
    bankUpiId: "urbannest@sbi",
    gstin: "27AAGCU7712M1Z4",
    pan: "AAGCU7712M",
    kycStatus: "SUBMITTED",
    status: "INACTIVE",
    rating: 4.3,
    initials: "UN",
    createdAt: "2026-09-12T16:45:00Z",
    storeCount: 2
  }
];

// Seed Stores (Branch Level - "Merchant != Store")
const SEED_STORES: Store[] = [
  {
    id: "store-1",
    merchantId: "m-1",
    merchantName: "The Curry Leaf",
    storeName: "The Curry Leaf",
    branchName: "Dharampeth Flagship",
    address: "West High Court Road, Dharampeth",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440010",
    latitude: 21.1458,
    longitude: 79.0882,
    status: "ACTIVE",
    phone: "+91 712 2554411",
    operatingHours: "11:00 AM – 11:30 PM",
    hasActiveOffer: true,
    createdAt: "2026-08-10T10:00:00Z"
  },
  {
    id: "store-2",
    merchantId: "m-1",
    merchantName: "The Curry Leaf",
    storeName: "The Curry Leaf",
    branchName: "Civil Lines Executive",
    address: "Opposite High Court, Civil Lines",
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440001",
    latitude: 21.1539,
    longitude: 79.0734,
    status: "ACTIVE",
    phone: "+91 712 2568899",
    operatingHours: "12:00 PM – 11:00 PM",
    hasActiveOffer: true,
    createdAt: "2026-08-15T12:00:00Z"
  },
  {
    id: "store-3",
    merchantId: "m-1",
    merchantName: "The Curry Leaf",
    storeName: "The Curry Leaf",
    branchName: "Koregaon Park Bistro",
    address: "Lane 6, North Main Road, Koregaon Park",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    latitude: 18.5362,
    longitude: 73.8940,
    status: "ACTIVE",
    phone: "+91 20 66442211",
    operatingHours: "11:30 AM – 11:30 PM",
    hasActiveOffer: true,
    createdAt: "2026-08-20T10:00:00Z"
  },
  {
    id: "store-4",
    merchantId: "m-2",
    merchantName: "Glow Theory Studio",
    storeName: "Glow Theory Studio",
    branchName: "FC Road Lounge",
    address: "Goodluck Chowk, FC Road, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411004",
    latitude: 18.5204,
    longitude: 73.8567,
    status: "ACTIVE",
    phone: "+91 20 25531122",
    operatingHours: "10:00 AM – 09:00 PM",
    hasActiveOffer: true,
    createdAt: "2026-08-18T14:30:00Z"
  },
  {
    id: "store-5",
    merchantId: "m-2",
    merchantName: "Glow Theory Studio",
    storeName: "Glow Theory Studio",
    branchName: "Baner Luxe",
    address: "High Street, Baner",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411045",
    latitude: 18.5590,
    longitude: 73.7868,
    status: "ACTIVE",
    phone: "+91 20 27294433",
    operatingHours: "10:00 AM – 09:30 PM",
    hasActiveOffer: false,
    createdAt: "2026-08-22T10:00:00Z"
  },
  {
    id: "store-6",
    merchantId: "m-3",
    merchantName: "Stride Fitness Club",
    storeName: "Stride Fitness Club",
    branchName: "Bandra West Center",
    address: "Linking Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    latitude: 19.0600,
    longitude: 72.8362,
    status: "PENDING_APPROVAL",
    phone: "+91 22 26401122",
    operatingHours: "06:00 AM – 11:00 PM",
    hasActiveOffer: true,
    createdAt: "2026-09-02T09:15:00Z"
  },
  {
    id: "store-7",
    merchantId: "m-4",
    merchantName: "Bloom & Brew",
    storeName: "Bloom & Brew",
    branchName: "Aundh Coffee Roastery",
    address: "ITi Road, Aundh",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411007",
    latitude: 18.5580,
    longitude: 73.8077,
    status: "ACTIVE",
    phone: "+91 20 25887711",
    operatingHours: "08:00 AM – 11:00 PM",
    hasActiveOffer: true,
    createdAt: "2026-08-25T11:20:00Z"
  }
];

// Seed Offers
const SEED_OFFERS: Offer[] = [
  {
    id: "off-1",
    merchantId: "m-1",
    merchantName: "The Curry Leaf",
    title: "Weekend Dine & Earn",
    type: "FLAT_AMT",
    value: 200,
    minBillAmount: 1000,
    validFrom: "2026-09-01",
    validTo: "2026-09-30",
    status: "ACTIVE",
    redemptions: 1248,
    terms: "Valid on all dine-in bills exceeding ₹1,000. Not combinable with happy hours.",
    createdAt: "2026-08-28T10:00:00Z"
  },
  {
    id: "off-2",
    merchantId: "m-2",
    merchantName: "Glow Theory Studio",
    title: "Glow Up September",
    type: "FLAT_PCT",
    value: 20,
    maxDiscount: 500,
    minBillAmount: 1500,
    validFrom: "2026-09-01",
    validTo: "2026-09-28",
    status: "ACTIVE",
    redemptions: 864,
    terms: "20% off up to ₹500 on all premium salon and hair spa packages.",
    createdAt: "2026-08-30T14:00:00Z"
  },
  {
    id: "off-3",
    merchantId: "m-3",
    merchantName: "Stride Fitness Club",
    title: "First Month Strong",
    type: "FLAT_AMT",
    value: 500,
    minBillAmount: 2500,
    validFrom: "2026-09-15",
    validTo: "2026-10-15",
    status: "PENDING_APPROVAL",
    redemptions: 0,
    terms: "Flat ₹500 discount on quarterly membership signup.",
    createdAt: "2026-09-14T09:30:00Z"
  },
  {
    id: "off-4",
    merchantId: "m-4",
    merchantName: "Bloom & Brew",
    title: "Brew & Save — Buy 1 Get 1",
    type: "BOGO",
    value: 1,
    minBillAmount: 350,
    validFrom: "2026-09-10",
    validTo: "2026-10-10",
    status: "ACTIVE",
    redemptions: 412,
    terms: "Buy any artisanal cold brew or latte and get the second beverage free.",
    createdAt: "2026-09-08T16:00:00Z"
  }
];

// Seed Transactions (with UPI Payment Intent Details)
const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1001",
    paymentIntentId: "pay_int_55210",
    referenceType: "OFFER",
    referenceId: "off-1",
    customerName: "Aarav Mehta",
    customerPhone: "+91 98230 12345",
    merchantId: "m-1",
    merchantName: "The Curry Leaf",
    storeName: "Dharampeth Flagship",
    billAmount: 1440,
    discountAmount: 200,
    payableAmount: 1240,
    payeeVpa: "thecurryleaf@icici",
    upiIntentUrl: "upi://pay?pa=thecurryleaf@icici&am=1240.00&tn=PinakOfferRedeem&tr=pay_int_55210",
    utr: "UPI2026092510154431",
    signatureValid: true,
    status: "SUCCESS",
    settlementStatus: "SETTLED",
    pointsEarned: 62,
    timestamp: "2026-09-25T14:15:20Z"
  },
  {
    id: "tx-1002",
    paymentIntentId: "pay_int_55211",
    referenceType: "OFFER",
    referenceId: "off-2",
    customerName: "Ishita Shah",
    customerPhone: "+91 99220 54321",
    merchantId: "m-2",
    merchantName: "Glow Theory Studio",
    storeName: "FC Road Lounge",
    billAmount: 2200,
    discountAmount: 440,
    payableAmount: 1760,
    payeeVpa: "glowtheory@hdfcbank",
    upiIntentUrl: "upi://pay?pa=glowtheory@hdfcbank&am=1760.00&tn=PinakOfferRedeem&tr=pay_int_55211",
    utr: "UPI2026092514021189",
    signatureValid: true,
    status: "SUCCESS",
    settlementStatus: "SETTLED",
    pointsEarned: 88,
    timestamp: "2026-09-25T14:02:10Z"
  },
  {
    id: "tx-1003",
    paymentIntentId: "pay_int_55212",
    referenceType: "OFFER",
    referenceId: "off-3",
    customerName: "Rohan Patil",
    customerPhone: "+91 94220 99887",
    merchantId: "m-3",
    merchantName: "Stride Fitness Club",
    storeName: "Bandra West Center",
    billAmount: 2999,
    discountAmount: 500,
    payableAmount: 2499,
    payeeVpa: "stridefit@okaxis",
    upiIntentUrl: "upi://pay?pa=stridefit@okaxis&am=2499.00&tn=PinakOfferRedeem&tr=pay_int_55212",
    utr: "UPI2026092513451299",
    signatureValid: true,
    status: "PENDING",
    settlementStatus: "PENDING",
    pointsEarned: 0,
    timestamp: "2026-09-25T13:45:00Z"
  },
  {
    id: "tx-1004",
    paymentIntentId: "pay_int_55213",
    referenceType: "OFFER",
    referenceId: "off-4",
    customerName: "Mira Kulkarni",
    customerPhone: "+91 97660 33445",
    merchantId: "m-4",
    merchantName: "Bloom & Brew",
    storeName: "Aundh Coffee Roastery",
    billAmount: 580,
    discountAmount: 240,
    payableAmount: 340,
    payeeVpa: "bloombrew@yesbank",
    upiIntentUrl: "upi://pay?pa=bloombrew@yesbank&am=340.00&tn=PinakOfferRedeem&tr=pay_int_55213",
    utr: "UPI2026092513105512",
    signatureValid: true,
    status: "SUCCESS",
    settlementStatus: "SETTLED",
    pointsEarned: 17,
    timestamp: "2026-09-25T13:10:00Z"
  }
];

// Seed Customers
const SEED_CUSTOMERS: Customer[] = [
  { id: "c-1", name: "Aarav Mehta", phone: "+91 98230 12345", email: "aarav.mehta@gmail.com", city: "Nagpur", visits: 18, rewardsBalance: 2480, segment: "Power user", initials: "AM", lastActive: "10 min ago" },
  { id: "c-2", name: "Ishita Shah", phone: "+91 99220 54321", email: "ishita.shah@outlook.com", city: "Pune", visits: 12, rewardsBalance: 1860, segment: "Regular", initials: "IS", lastActive: "25 min ago" },
  { id: "c-3", name: "Rohan Patil", phone: "+91 94220 99887", email: "rohan.p@yahoo.com", city: "Mumbai", visits: 8, rewardsBalance: 999, segment: "New", initials: "RP", lastActive: "1 hr ago" },
  { id: "c-4", name: "Mira Kulkarni", phone: "+91 97660 33445", email: "mira.kulkarni@gmail.com", city: "Pune", visits: 21, rewardsBalance: 3240, segment: "Power user", initials: "MK", lastActive: "2 hrs ago" }
];

// Seed Reward Rules
const SEED_REWARD_RULES: RewardRule[] = [
  { id: "rr-1", name: "Standard Merchant Earn Rate", earnPointsPerHundred: 5, categoryFilter: "All categories", status: "ACTIVE", description: "Earn 5 PINAK points for every ₹100 spent across participating merchants." },
  { id: "rr-2", name: "Weekend Dining Booster", earnPointsPerHundred: 10, categoryFilter: "Food & Dining", status: "ACTIVE", description: "Double points (10 pts per ₹100) on Saturday & Sunday for restaurants and cafes." },
  { id: "rr-3", name: "Wellness Welcome Bonus", earnPointsPerHundred: 8, categoryFilter: "Beauty & Wellness", status: "ACTIVE", description: "8 points per ₹100 for all first-time salon or spa visits." }
];

// Seed Audit Events
const SEED_AUDIT: AuditEvent[] = [
  { id: "aud-1", action: "Merchant KYC Approved", entity: "The Curry Leaf", actor: "Riya Shah (Super Admin)", time: "2026-09-25T12:30:00Z", severity: "success" },
  { id: "aud-2", action: "Offer Campaign Activated", entity: "Weekend Dine & Earn", actor: "Kabir Joshi (Operations)", time: "2026-09-25T11:45:00Z", severity: "info" },
  { id: "aud-3", action: "UPI Webhook Signature Verified", entity: "pay_int_55210 (₹1,240)", actor: "PSP Switch Webhook", time: "2026-09-25T14:15:21Z", severity: "success" },
  { id: "aud-4", action: "New Store Branch Submitted", entity: "Stride Fitness - Bandra West", actor: "Vikram Rane", time: "2026-09-25T09:15:00Z", severity: "warning" }
];

// Seed Notifications
const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", title: "New KYC Review Needed", message: "Urban Nest Living submitted business documents in Nagpur.", type: "merchant", time: "5 min ago", read: false },
  { id: "notif-2", title: "High-Value Transaction", message: "₹2,200 bill processed at Glow Theory Studio.", type: "transaction", time: "28 min ago", read: false },
  { id: "notif-3", title: "Store Branch Pending", message: "Stride Fitness Club added Bandra West branch for location review.", type: "merchant", time: "1 hr ago", read: false },
  { id: "notif-4", title: "Campaign Milestone", message: "Weekend Dine & Earn crossed 1,200 redemptions.", type: "offer", time: "3 hrs ago", read: true }
];

// Simple Event Emitter for Reactive State
type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach(l => l());
}

function getStored<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function setStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emitChange();
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export const mockStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Auth / Role
  getCurrentRole(): UserRole {
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_USER) as UserRole) || "admin";
  },
  setCurrentRole(role: UserRole) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, role);
    this.addAudit({
      action: "Role switched",
      entity: `${role} workspace`,
      actor: "Current User",
      severity: "info"
    });
    emitChange();
  },

  // Merchants
  getMerchants(): Merchant[] {
    return getStored(STORAGE_KEYS.MERCHANTS, SEED_MERCHANTS);
  },
  addMerchant(draft: Partial<Merchant>): Merchant {
    const all = this.getMerchants();
    const initials = (draft.businessName || "New")
      .split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newMerchant: Merchant = {
      id: `m-${Date.now()}`,
      businessName: draft.businessName || "Untitled Business",
      legalEntityName: draft.legalEntityName || draft.businessName || "Untitled Legal Entity",
      categoryId: draft.categoryId || "cat-1",
      categoryName: draft.categoryName || "Food & Dining",
      ownerName: draft.ownerName || "Merchant Owner",
      ownerEmail: draft.ownerEmail || "owner@merchant.in",
      ownerPhone: draft.ownerPhone || "+91 98000 00000",
      city: draft.city || "Nagpur",
      bankUpiId: draft.bankUpiId || "business@upi",
      gstin: draft.gstin || "27ABCDE1234F1Z5",
      pan: draft.pan || "ABCDE1234F",
      kycStatus: "SUBMITTED",
      status: "INACTIVE",
      rating: 5.0,
      initials,
      createdAt: new Date().toISOString(),
      storeCount: 1
    };

    setStored(STORAGE_KEYS.MERCHANTS, [newMerchant, ...all]);
    this.addAudit({
      action: "New Merchant Registered",
      entity: newMerchant.businessName,
      actor: newMerchant.ownerName,
      severity: "info"
    });
    this.addNotification({
      title: "New Merchant Registered",
      message: `${newMerchant.businessName} submitted onboarding for ${newMerchant.city}.`,
      type: "merchant"
    });
    return newMerchant;
  },
  updateMerchantKyc(merchantId: string, status: "APPROVED" | "REJECTED" | "PENDING_REVIEW") {
    const all = this.getMerchants();
    const updated = all.map(m => m.id === merchantId ? { ...m, kycStatus: status, status: status === "APPROVED" ? ("ACTIVE" as const) : m.status } : m);
    setStored(STORAGE_KEYS.MERCHANTS, updated);
    const m = all.find(x => x.id === merchantId);
    this.addAudit({
      action: `Merchant KYC ${status}`,
      entity: m?.businessName || merchantId,
      actor: "Riya Shah (Admin)",
      severity: status === "APPROVED" ? "success" : "warning"
    });
    this.addNotification({
      title: `Merchant KYC ${status}`,
      message: `${m?.businessName || "Merchant"} has been ${status.toLowerCase()} by admin.`,
      type: "merchant"
    });
  },

  // Stores ("Merchant != Store")
  getStores(): Store[] {
    return getStored(STORAGE_KEYS.STORES, SEED_STORES);
  },
  addStore(draft: Partial<Store>): Store {
    const all = this.getStores();
    const newStore: Store = {
      id: `store-${Date.now()}`,
      merchantId: draft.merchantId || "m-1",
      merchantName: draft.merchantName || "The Curry Leaf",
      storeName: draft.storeName || draft.merchantName || "The Curry Leaf",
      branchName: draft.branchName || "New Branch",
      address: draft.address || "Main Market Road",
      city: draft.city || "Nagpur",
      state: draft.state || "Maharashtra",
      pincode: draft.pincode || "440001",
      latitude: draft.latitude || 21.1458,
      longitude: draft.longitude || 79.0882,
      status: "PENDING_APPROVAL",
      phone: draft.phone || "+91 712 2500000",
      operatingHours: draft.operatingHours || "11:00 AM – 11:00 PM",
      hasActiveOffer: false,
      createdAt: new Date().toISOString()
    };

    setStored(STORAGE_KEYS.STORES, [newStore, ...all]);

    // Update merchant's store count
    const merchants = this.getMerchants();
    const updatedMerchants = merchants.map(m => m.id === newStore.merchantId ? { ...m, storeCount: m.storeCount + 1 } : m);
    setStored(STORAGE_KEYS.MERCHANTS, updatedMerchants);

    this.addAudit({
      action: "New Physical Store Branch Added",
      entity: `${newStore.merchantName} - ${newStore.branchName}`,
      actor: "Merchant Console",
      severity: "info"
    });
    this.addNotification({
      title: "Store Location Pending Review",
      message: `${newStore.branchName} (${newStore.city}) was added and needs geocode approval.`,
      type: "merchant"
    });
    return newStore;
  },
  approveStore(storeId: string) {
    const all = this.getStores();
    const updated = all.map(s => s.id === storeId ? { ...s, status: "ACTIVE" as const } : s);
    setStored(STORAGE_KEYS.STORES, updated);
    const store = all.find(s => s.id === storeId);
    this.addAudit({
      action: "Store Branch Geocode Approved",
      entity: `${store?.merchantName} - ${store?.branchName}`,
      actor: "Riya Shah (Admin)",
      severity: "success"
    });
  },

  // Offers
  getOffers(): Offer[] {
    return getStored(STORAGE_KEYS.OFFERS, SEED_OFFERS);
  },
  addOffer(draft: Partial<Offer>): Offer {
    const all = this.getOffers();
    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      merchantId: draft.merchantId || "m-1",
      merchantName: draft.merchantName || "The Curry Leaf",
      storeId: draft.storeId || "all",
      title: draft.title || "Special Deal",
      type: draft.type || "FLAT_PCT",
      value: draft.value || 15,
      maxDiscount: draft.maxDiscount || 300,
      minBillAmount: draft.minBillAmount || 500,
      validFrom: draft.validFrom || new Date().toISOString().split("T")[0],
      validTo: draft.validTo || "2026-10-31",
      status: "PENDING_APPROVAL",
      redemptions: 0,
      terms: draft.terms || "Standard offer terms apply.",
      createdAt: new Date().toISOString()
    };

    setStored(STORAGE_KEYS.OFFERS, [newOffer, ...all]);
    this.addAudit({
      action: "New Offer Campaign Created",
      entity: `${newOffer.title} (${newOffer.merchantName})`,
      actor: "Merchant Console",
      severity: "info"
    });
    this.addNotification({
      title: "Offer Pending Approval",
      message: `${newOffer.merchantName} requested approval for '${newOffer.title}'.`,
      type: "offer"
    });
    return newOffer;
  },
  updateOfferStatus(offerId: string, status: "ACTIVE" | "REJECTED" | "EXPIRED") {
    const all = this.getOffers();
    const updated = all.map(o => o.id === offerId ? { ...o, status } : o);
    setStored(STORAGE_KEYS.OFFERS, updated);
    const off = all.find(o => o.id === offerId);
    this.addAudit({
      action: `Offer ${status}`,
      entity: off?.title || offerId,
      actor: "Kabir Joshi (Admin)",
      severity: status === "ACTIVE" ? "success" : "warning"
    });
    this.addNotification({
      title: `Offer Campaign ${status}`,
      message: `'${off?.title}' is now ${status.toLowerCase()} on mobile discovery.`,
      type: "offer"
    });
  },

  // Transactions
  getTransactions(): Transaction[] {
    return getStored(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
  },
  recordTransaction(data: Partial<Transaction>): Transaction {
    const all = this.getTransactions();
    const intentNum = Math.floor(10000 + Math.random() * 90000);
    const utrNum = `UPI20260925${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      paymentIntentId: `pay_int_${intentNum}`,
      referenceType: data.referenceType || "OFFER",
      referenceId: data.referenceId || "off-1",
      customerName: data.customerName || "Sneha Sharma",
      customerPhone: data.customerPhone || "+91 98111 22334",
      merchantId: data.merchantId || "m-1",
      merchantName: data.merchantName || "The Curry Leaf",
      storeName: data.storeName || "Dharampeth Flagship",
      billAmount: data.billAmount || 1200,
      discountAmount: data.discountAmount || 200,
      payableAmount: data.payableAmount || 1000,
      payeeVpa: data.payeeVpa || "thecurryleaf@icici",
      upiIntentUrl: `upi://pay?pa=${data.payeeVpa || "thecurryleaf@icici"}&am=${data.payableAmount || 1000}.00&tn=PinakOfferRedeem&tr=pay_int_${intentNum}`,
      utr: utrNum,
      signatureValid: true,
      status: "SUCCESS",
      settlementStatus: "SETTLED",
      pointsEarned: Math.floor((data.payableAmount || 1000) * 0.05),
      timestamp: new Date().toISOString()
    };

    setStored(STORAGE_KEYS.TRANSACTIONS, [newTx, ...all]);

    // Update offer redemptions
    const offers = this.getOffers();
    const updatedOffers = offers.map(o => o.id === newTx.referenceId ? { ...o, redemptions: o.redemptions + 1 } : o);
    setStored(STORAGE_KEYS.OFFERS, updatedOffers);

    this.addAudit({
      action: "UPI Payment Settled via Intent",
      entity: `${newTx.paymentIntentId} (₹${newTx.payableAmount})`,
      actor: "UPI Gateway / PSP Switch",
      severity: "success"
    });

    return newTx;
  },

  // Customers
  getCustomers(): Customer[] {
    return getStored(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
  },

  // Categories
  getCategories(): Category[] {
    return getStored(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  },
  addCategory(draft: Partial<Category>): Category {
    const all = this.getCategories();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: draft.name || "New Category",
      description: draft.description || "",
      parentId: draft.parentId,
      parentName: draft.parentName,
      icon: draft.icon || "Tag",
      color: draft.color || "purple",
      storeCount: 0,
      growth: "0.0%",
      status: "ACTIVE"
    };
    setStored(STORAGE_KEYS.CATEGORIES, [...all, newCat]);
    this.addAudit({
      action: "New Category Created",
      entity: newCat.name,
      actor: "Riya Shah (Admin)",
      severity: "info"
    });
    return newCat;
  },

  // Rewards
  getRewardRules(): RewardRule[] {
    return getStored(STORAGE_KEYS.REWARDS, SEED_REWARD_RULES);
  },
  addRewardRule(draft: Partial<RewardRule>): RewardRule {
    const all = this.getRewardRules();
    const newRule: RewardRule = {
      id: `rr-${Date.now()}`,
      name: draft.name || "Custom Rule",
      earnPointsPerHundred: draft.earnPointsPerHundred || 5,
      categoryFilter: draft.categoryFilter || "All categories",
      status: "ACTIVE",
      description: draft.description || ""
    };
    setStored(STORAGE_KEYS.REWARDS, [...all, newRule]);
    return newRule;
  },

  // Audit Logs
  getAuditLogs(): AuditEvent[] {
    return getStored(STORAGE_KEYS.AUDIT, SEED_AUDIT);
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

  // Notifications
  getNotifications(): NotificationItem[] {
    return getStored(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
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

  // Reset demo
  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.MERCHANTS);
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.OFFERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.REWARDS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    emitChange();
  }
};
