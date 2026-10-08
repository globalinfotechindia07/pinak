export type StoreStatus = "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED";

export interface StoreLocationDTO {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  cityId?: string;
  state?: string;
  pincode?: string;
}

export interface StoreDTO {
  id: string;
  merchantId: string;
  storeName: string;
  branchCode?: string;
  contactPhone: string;
  address: string;
  cityId: string;
  cityName?: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  openingTime: string; // e.g. "10:00"
  closingTime: string; // e.g. "22:00"
  operatingDays?: string; // e.g. "Daily (Mon - Sun)"
  managerName?: string;
  managerEmail?: string;
  status: StoreStatus;
  approvalStatus?: string;
  activeOfferCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreRequest {
  storeName: string;
  branchCode?: string;
  contactPhone: string;
  address: string;
  cityId: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  operatingDays?: string;
  managerName?: string;
  managerEmail?: string;
  status?: StoreStatus;
}

export interface UpdateStoreRequest {
  storeName?: string;
  branchCode?: string;
  contactPhone?: string;
  address?: string;
  cityId?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  operatingDays?: string;
  managerName?: string;
  managerEmail?: string;
  status?: StoreStatus;
}

export interface UpdateStoreStatusRequest {
  status: StoreStatus;
  reason?: string;
}
