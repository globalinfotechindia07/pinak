import { useEffect, useState, useSyncExternalStore } from "react";
import { mockStore } from "../services/mockDataStore";

export function useMockStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = mockStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    role: mockStore.getCurrentRole(),
    setRole: (role: any) => mockStore.setCurrentRole(role),
    merchants: mockStore.getMerchants(),
    stores: mockStore.getStores(),
    offers: mockStore.getOffers(),
    transactions: mockStore.getTransactions(),
    customers: mockStore.getCustomers(),
    categories: mockStore.getCategories(),
    rewardRules: mockStore.getRewardRules(),
    auditLogs: mockStore.getAuditLogs(),
    notifications: mockStore.getNotifications(),
    
    // Actions
    addMerchant: (draft: any) => mockStore.addMerchant(draft),
    updateMerchantKyc: (id: string, status: any) => mockStore.updateMerchantKyc(id, status),
    addStore: (draft: any) => mockStore.addStore(draft),
    approveStore: (id: string) => mockStore.approveStore(id),
    addOffer: (draft: any) => mockStore.addOffer(draft),
    updateOfferStatus: (id: string, status: any) => mockStore.updateOfferStatus(id, status),
    recordTransaction: (data: any) => mockStore.recordTransaction(data),
    addCategory: (draft: any) => mockStore.addCategory(draft),
    addRewardRule: (draft: any) => mockStore.addRewardRule(draft),
    addAudit: (event: any) => mockStore.addAudit(event),
    markAllNotificationsRead: () => mockStore.markAllNotificationsRead(),
    resetToDefaults: () => mockStore.resetToDefaults()
  };
}
