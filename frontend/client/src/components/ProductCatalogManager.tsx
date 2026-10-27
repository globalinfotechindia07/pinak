import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Package,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Flame,
  ChefHat,
  ShoppingBag,
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";
import { productApi } from "../api/productApi";
import { ProductDTO, CreateProductRequest } from "../types/api/product.dto";
import { cn } from "../lib/utils";

interface ProductCatalogManagerProps {
  storeId: string;
  merchantId: string;
  storeName?: string;
  categoryName?: string;
  defaultMode?: "food" | "retail";
}

// Preset food images for quick selection
const FOOD_PRESET_IMAGES = [
  {
    name: "Tandoori Platter",
    url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Chole Bhature",
    url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Biryani Special",
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Gourmet Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Artisan Pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Royal Sweets",
    url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
  },
];

// Preset retail images for quick selection
const RETAIL_PRESET_IMAGES = [
  {
    name: "Boxed Sweets",
    url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Dry Fruits / Nuts",
    url: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Organic Beverage",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Snack Namkeen Pack",
    url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=500&auto=format&fit=crop&q=80",
  },
];

export const ProductCatalogManager: React.FC<ProductCatalogManagerProps> = ({
  storeId,
  merchantId,
  storeName = "Store Outlet",
  categoryName = "",
  defaultMode = "food",
}) => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "food" | "retail">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [itemType, setItemType] = useState<"food" | "retail">(defaultMode);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState(""); // Serves 2 or 500g
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mrp, setMrp] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [inStock, setInStock] = useState<boolean>(true);

  // Determine if current store looks like a restaurant
  const isRestaurantStore =
    categoryName.toLowerCase().includes("food") ||
    categoryName.toLowerCase().includes("dining") ||
    categoryName.toLowerCase().includes("restaur") ||
    categoryName.toLowerCase().includes("cafe");

  useEffect(() => {
    loadProducts();
  }, [storeId]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productApi.getProductsByStore(storeId);
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products for store");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = (mode: "food" | "retail" = isRestaurantStore ? "food" : "retail") => {
    setEditingProduct(null);
    setItemType(mode);
    setName("");
    setBrand(mode === "food" ? "Chef's Special" : "");
    setUnit(mode === "food" ? "Serves 1-2" : "500g");
    setDescription("");
    setImageUrl(
      mode === "food"
        ? FOOD_PRESET_IMAGES[0].url
        : RETAIL_PRESET_IMAGES[0].url
    );
    setMrp("");
    setSellingPrice("");
    setStockQuantity(50);
    setInStock(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductDTO) => {
    setEditingProduct(p);
    const isFood = (p.unit || "").toLowerCase().includes("serve") || (p.unit || "").toLowerCase().includes("plate");
    setItemType(isFood ? "food" : "retail");
    setName(p.name);
    setBrand(p.brand || "");
    setUnit(p.unit || "");
    setDescription(p.description || "");
    setImageUrl(p.imageUrl || "");
    setMrp(p.mrp);
    setSellingPrice(p.sellingPrice);
    setStockQuantity(p.stockQuantity ?? 50);
    setInStock(p.inStock ?? true);
    setIsModalOpen(true);
  };

  // Calculate discount percentage automatically
  const calculatedDiscount = React.useMemo(() => {
    if (typeof mrp === "number" && typeof sellingPrice === "number" && mrp > 0 && sellingPrice < mrp) {
      return Math.round(((mrp - sellingPrice) / mrp) * 100);
    }
    return 0;
  }, [mrp, sellingPrice]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for the item");
      return;
    }
    const numMrp = Number(mrp);
    const numSelling = Number(sellingPrice);
    if (!numMrp || numMrp <= 0) {
      toast.error("Please enter a valid MRP price");
      return;
    }
    if (!numSelling || numSelling <= 0) {
      toast.error("Please enter a valid selling/offer price");
      return;
    }
    if (numSelling > numMrp) {
      toast.error("Offer price cannot be higher than MRP");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProductRequest = {
        merchantId,
        storeId,
        name: name.trim(),
        brand: brand.trim() || undefined,
        unit: unit.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        mrp: numMrp,
        sellingPrice: numSelling,
        discountPercent: calculatedDiscount,
        stockQuantity,
        inStock,
        isActive: true,
      };

      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, payload);
        toast.success(`Updated "${name}" successfully`);
      } else {
        await productApi.createProduct(payload);
        toast.success(`Added "${name}" to store catalog`);
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to save item";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}" from this store?`)) {
      return;
    }
    try {
      await productApi.deleteProduct(id);
      toast.success(`Deleted "${itemName}"`);
      await loadProducts();
    } catch (err: any) {
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const isFood = (p.unit || "").toLowerCase().includes("serve") || (p.unit || "").toLowerCase().includes("plate");
    if (filterType === "food") return matchesSearch && isFood;
    if (filterType === "retail") return matchesSearch && !isFood;
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
            {isRestaurantStore ? <UtensilsCrossed size={18} /> : <Package size={18} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{isRestaurantStore ? "Restaurant Menu & Food Dishes" : "Store Products & Retail Catalog"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                {products.length} {products.length === 1 ? "Item" : "Items"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Items added here automatically show in the consumer mobile app Flash Deals & Highlights.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openAddModal("food")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all shadow-xs"
          >
            <ChefHat size={14} />
            <span>+ Add Food Dish</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal("retail")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dishes or products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors",
              filterType === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("food")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1",
              filterType === "food"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
          >
            <ChefHat size={12} />
            Dishes
          </button>
          <button
            type="button"
            onClick={() => setFilterType("retail")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1",
              filterType === "retail"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
          >
            <ShoppingBag size={12} />
            Products
          </button>
        </div>
      </div>

      {/* Catalog List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading store catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-800/40">
            {isRestaurantStore ? <UtensilsCrossed size={22} /> : <Package size={22} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No items in this outlet catalog yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Add your best-selling dishes, platters, or packaged products to showcase them to nearby consumers on PINAK.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => openAddModal("food")}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
            >
              <ChefHat size={14} />
              Add Restaurant Dish
            </button>
            <button
              type="button"
              onClick={() => openAddModal("retail")}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add Store Product
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map((p) => {
            const isFood = (p.unit || "").toLowerCase().includes("serve") || (p.unit || "").toLowerCase().includes("plate");
            return (
              <div
                key={p.id}
                className="group relative flex gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 transition-all shadow-xs hover:shadow-md"
              >
                {/* Image Thumbnail */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      {isFood ? <UtensilsCrossed size={20} /> : <Package size={20} />}
                    </div>
                  )}
                  {p.discountPercent && p.discountPercent > 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                      {p.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                      {p.brand && (
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {p.brand}
                        </span>
                      )}
                      {p.brand && p.unit && <span>•</span>}
                      {p.unit && (
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                          {p.unit}
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Price Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        ₹{Number(p.sellingPrice).toLocaleString("en-IN")}
                      </span>
                      {p.mrp > p.sellingPrice && (
                        <span className="text-[10px] line-through text-slate-400 font-medium">
                          ₹{Number(p.mrp).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.2 rounded-md",
                        p.inStock
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      )}
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish & Product Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  {itemType === "food" ? <ChefHat size={18} /> : <ShoppingBag size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingProduct ? "Edit Catalog Item" : itemType === "food" ? "Add Food Dish / Platter" : "Add Store Product / Item"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <span className="font-semibold text-purple-600 dark:text-purple-400">{storeName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setItemType("food");
                  if (!unit || unit === "500g") setUnit("Serves 1-2");
                  if (!brand) setBrand("Chef's Special");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all",
                  itemType === "food"
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                )}
              >
                <ChefHat size={15} />
                <span>Restaurant Food Dish</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType("retail");
                  if (!unit || unit === "Serves 1-2") setUnit("500g");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all",
                  itemType === "retail"
                    ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                )}
              >
                <ShoppingBag size={15} />
                <span>Packaged Store Product</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Item Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {itemType === "food" ? "Dish / Platter Name *" : "Product Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    itemType === "food"
                      ? "e.g., Maharaja Special Thali, Tandoori BBQ Platter"
                      : "e.g., Kaju Katli Box 500g, Desi Cow Ghee 1L"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Brand & Unit/Servings Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {itemType === "food" ? "Course / Kitchen Tag" : "Brand Name"}
                  </label>
                  <input
                    type="text"
                    placeholder={itemType === "food" ? "e.g., Main Course, Chef Special" : "e.g., Haldiram's, Amul"}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {itemType === "food" ? "Serving Size / Portion" : "Net Weight / Pack Size"}
                  </label>
                  <input
                    type="text"
                    placeholder={itemType === "food" ? "e.g., Serves 2, Full Plate" : "e.g., 500g, 1 Litre, Pack of 4"}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              {/* Price & Discount Calculator Row */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      {itemType === "food" ? "Menu MRP (₹) *" : "Regular MRP (₹) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 400"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Offer Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 280"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Savings Discount
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-extrabold flex items-center justify-between">
                      <span>{calculatedDiscount}%</span>
                      <Tag size={13} />
                    </div>
                  </div>
                </div>

                {/* Quick discount chips */}
                {typeof mrp === "number" && mrp > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Deal Presets:</span>
                    {[10, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const dealPrice = Math.round(mrp * (1 - pct / 100));
                          setSellingPrice(dealPrice);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        {pct}% OFF (₹{Math.round(mrp * (1 - pct / 100))})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Description & Ingredients / Features
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    itemType === "food"
                      ? "Ingredients, accompaniments (e.g. served with spicy mint chutney and garlic naan)..."
                      : "Product highlights, packaging details, expiry, quality guarantee..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Image URL & Presets */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Photo URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-xs"
                  />
                  {imageUrl && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Preset image selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-[10px] text-slate-400 shrink-0">Sample Photos:</span>
                  {(itemType === "food" ? FOOD_PRESET_IMAGES : RETAIL_PRESET_IMAGES).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg border text-[10px] font-medium shrink-0 transition-colors",
                        imageUrl === preset.url
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock & Availability */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Currently In Stock & Available
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingProduct ? "Update Item" : "Save to Store Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogManager;
