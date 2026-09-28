export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  iconUrl?: string;
  description?: string;
  displayOrder: number;
  status: "ACTIVE" | "INACTIVE";
  subCategories?: CategoryDTO[];
  storeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: string | null;
  iconUrl?: string;
  description?: string;
  displayOrder?: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  parentId?: string | null;
  iconUrl?: string;
  description?: string;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
}
