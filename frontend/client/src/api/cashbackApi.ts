import apiClient from "./client";
import { CashbackSetting, StoreCashback } from "../types";

export const cashbackApi = {
  getGlobalSettings: async (): Promise<CashbackSetting> => {
    const res = await apiClient.get<any>("/admin/settings/cashback");
    return res.data?.data;
  },

  updateGlobalSettings: async (settings: Partial<CashbackSetting>): Promise<CashbackSetting> => {
    const res = await apiClient.put<any>("/admin/settings/cashback", settings);
    return res.data?.data;
  },

  getAllStoresCashback: async (): Promise<StoreCashback[]> => {
    const res = await apiClient.get<any>("/admin/settings/cashback/stores");
    return res.data?.data || [];
  },

  getStoreCashback: async (storeId: string): Promise<StoreCashback> => {
    const res = await apiClient.get<any>(`/admin/settings/cashback/stores/${storeId}`);
    return res.data?.data;
  },

  updateStoreCashback: async (storeId: string, settings: Partial<StoreCashback>): Promise<StoreCashback> => {
    const res = await apiClient.put<any>(`/admin/settings/cashback/stores/${storeId}`, settings);
    return res.data?.data;
  }
};
