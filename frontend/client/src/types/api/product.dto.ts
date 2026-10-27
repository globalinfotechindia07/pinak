export interface ProductDTO {
  id: string;
  merchantId: string;
  storeId?: string;
  categoryId?: string;
  name: string;
  brand?: string;
  unit?: string; // e.g. "Serves 2", "1 Kg", "500ml", "Full Plate"
  description?: string;
  imageUrl?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  currency?: string;
  stockQuantity?: number;
  inStock?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  merchantId: string;
  storeId?: string;
  categoryId?: string;
  name: string;
  brand?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  stockQuantity?: number;
  inStock?: boolean;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  merchantId?: string;
  storeId?: string;
  categoryId?: string;
  name?: string;
  brand?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  mrp?: number;
  sellingPrice?: number;
  discountPercent?: number;
  stockQuantity?: number;
  inStock?: boolean;
  isActive?: boolean;
}
