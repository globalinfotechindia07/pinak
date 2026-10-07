import { useEffect, useState } from "react";
import { appStore } from "../services/dataStore";
import { UserRole } from "../types";

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isAuthenticated: appStore.isAuthenticated(),
    currentUser: appStore.getCurrentUser(),
    role: appStore.getCurrentRole(),
    hasPermission: (permKey: string) => appStore.hasPermission(permKey),
    activeStoreId: appStore.getActiveStoreId(),
    setActiveStoreId: (id: string | null) => appStore.setActiveStoreId(id),
    setRole: (role: UserRole) => appStore.setCurrentRole(role),
    login: (role: UserRole, email?: string, storeId?: string, userMeta?: any) => appStore.login(role, email, storeId, userMeta),
    updateCurrentUser: (updates: any) => appStore.updateCurrentUser(updates),
    logout: () => appStore.logout(),
    merchants: appStore.getMerchants(),
    stores: appStore.getStores(),
    offers: appStore.getOffers(),
    transactions: appStore.getTransactions(),
    customers: appStore.getCustomers(),
    categories: appStore.getCategories(),
    rewardRules: appStore.getRewardRules(),
    auditLogs: appStore.getAuditLogs(),
    notifications: appStore.getNotifications(),
    operatingCities: appStore.getOperatingCities(),
    discoveryCuration: appStore.getDiscoveryCuration(),
    
    // Actions
    setCategories: (categories: any[]) => appStore.setCategories(categories),
    setStores: (stores: any[]) => appStore.setStores(stores),
    setMerchants: (merchants: any[]) => appStore.setMerchants(merchants),
    setOffers: (offers: any[]) => appStore.setOffers(offers),
    setTransactions: (transactions: any[]) => appStore.setTransactions(transactions),
    setCustomers: (customers: any[]) => appStore.setCustomers(customers),
    setAuditLogs: (auditLogs: any[]) => appStore.setAuditLogs(auditLogs),
    setNotifications: (notifications: any[]) => appStore.setNotifications(notifications),
    setOperatingCities: (cities: any[]) => appStore.setOperatingCities(cities),
    setDiscoveryCuration: (config: any) => appStore.setDiscoveryCuration(config),
    addMerchant: (draft: any) => appStore.addMerchant(draft),
    updateMerchantKyc: (id: string, status: any) => appStore.updateMerchantKyc(id, status),
    updateMerchant: (id: string, updates: any) => appStore.updateMerchant(id, updates),
    deleteMerchant: (id: string) => appStore.deleteMerchant(id),
    addStore: (draft: any) => appStore.addStore(draft),
    approveStore: (id: string) => appStore.approveStore(id),
    updateStore: (id: string, updates: any) => appStore.updateStore(id, updates),
    deleteStore: (id: string) => appStore.deleteStore(id),
    addOffer: (draft: any) => appStore.addOffer(draft),
    updateOfferStatus: (id: string, status: any) => appStore.updateOfferStatus(id, status),
    updateOffer: (id: string, updates: any) => appStore.updateOffer(id, updates),
    deleteOffer: (id: string) => appStore.deleteOffer(id),
    cloneOffer: (id: string) => appStore.cloneOffer(id),
    recordTransaction: (data: any) => appStore.recordTransaction(data),
    addCategory: (draft: any) => appStore.addCategory(draft),
    addRewardRule: (draft: any) => appStore.addRewardRule(draft),
    addAudit: (event: any) => appStore.addAudit(event),
    markAllNotificationsRead: () => appStore.markAllNotificationsRead(),
    resetToDefaults: () => appStore.resetToDefaults()
  };
}
