import React, { useState, useId } from "react";
import {
  UtensilsCrossed,
  Camera,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  X,
  Check,
  Eye,
  Info,
  ExternalLink,
  ShoppingBag,
  Sparkle,
  Image as ImageIcon,
  CheckCircle2,
  Store,
  Layers,
  Scissors
} from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export interface StoreMediaAndAmenitiesProps {
  imageUrl?: string;
  menuImages: string[];
  photos: string[];
  amenities: string[];
  onImageUrlChange?: (url: string) => void;
  onMenuImagesChange: (images: string[]) => void;
  onPhotosChange: (photos: string[]) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  categoryHint?: string; // e.g. "Dining", "Cafe", "Retail", "Fabindia", "Salon"
  storeType?: "DINING" | "RETAIL" | "SERVICES";
  onStoreTypeChange?: (type: "DINING" | "RETAIL" | "SERVICES") => void;
}

// Curated Popular Amenities with Categories & Emojis
export const PRESET_AMENITIES: { id: string; label: string; icon: string; category: "Retail" | "Dining" | "Comfort" | "Accessibility" | "Connectivity" | "Payment" }[] = [
  // Retail & Fashion (Especially for Fabindia, Boutiques, Supermarkets)
  { id: "Trial Rooms", label: "Trial / Fitting Rooms", icon: "👗", category: "Retail" },
  { id: "Alteration Service", label: "Alteration Service", icon: "✂️", category: "Retail" },
  { id: "Gift Wrapping", label: "Gift Wrapping", icon: "🎁", category: "Retail" },
  { id: "Instant In-Store Pickup", label: "Store Pickup (Click & Collect)", icon: "🛍️", category: "Retail" },
  { id: "Return & Exchange Available", label: "Easy Return / Exchange", icon: "🔄", category: "Retail" },
  { id: "Personal Stylist & Assistance", label: "Personal Shopper / Stylist", icon: "👔", category: "Retail" },

  // Comfort & Payment (Universal)
  { id: "Air Conditioned", label: "Air Conditioned", icon: "❄️", category: "Comfort" },
  { id: "Cards & UPI Accepted", label: "Cards & UPI Accepted", icon: "💳", category: "Payment" },
  { id: "Free High-Speed Wi-Fi", label: "Free Wi-Fi", icon: "📶", category: "Connectivity" },
  { id: "Valet Parking", label: "Valet Parking", icon: "🚗", category: "Comfort" },
  { id: "Free Parking", label: "Free Parking", icon: "🅿️", category: "Comfort" },
  { id: "Wheelchair Accessible", label: "Wheelchair Accessible", icon: "♿", category: "Accessibility" },
  { id: "Kid Friendly", label: "Kid Friendly", icon: "👶", category: "Accessibility" },
  { id: "Pet Friendly", label: "Pet Friendly", icon: "🐕", category: "Accessibility" },
  { id: "Charging Points", label: "Charging Points", icon: "🔌", category: "Connectivity" },

  // Dining & Hospitality
  { id: "Pure Veg", label: "Pure Veg", icon: "🌿", category: "Dining" },
  { id: "Outdoor Seating", label: "Outdoor Seating", icon: "🌳", category: "Dining" },
  { id: "Rooftop Ambience", label: "Rooftop Ambience", icon: "✨", category: "Dining" },
  { id: "Full Bar & Cocktails", label: "Full Bar & Drinks", icon: "🍸", category: "Dining" },
  { id: "Live Music", label: "Live Music", icon: "🎵", category: "Dining" },
  { id: "Private Dining Area", label: "Private Dining Area", icon: "🔒", category: "Dining" },
  { id: "Table Reservation", label: "Table Reservation", icon: "📅", category: "Dining" },
  { id: "Takeaway & Delivery", label: "Takeaway & Delivery", icon: "📦", category: "Dining" },
];

// Curated Store Cover Facade Presets
export const STORE_COVER_PRESETS = [
  {
    category: "RETAIL",
    label: "Fabindia Ethnic Living & Apparel",
    icon: "🛍️",
    url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "RETAIL",
    label: "Artisan Handicrafts & Home Decor",
    icon: "🏡",
    url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "RETAIL",
    label: "Luxury Fashion Showroom",
    icon: "👗",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "RETAIL",
    label: "Supermarket & Kirana Grocery",
    icon: "🛒",
    url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "DINING",
    label: "Fine Dining & Gourmet Bistro",
    icon: "🍽️",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "DINING",
    label: "Artisan Cafe & Bakery",
    icon: "☕",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "SERVICES",
    label: "Luxury Salon & Spa Suite",
    icon: "💇",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
  }
];

// Presets for Retail Lookbooks (when merchant wants to show seasonal collection)
const SAMPLE_RETAIL_LOOKBOOK_PRESETS = [
  {
    label: "Summer Handloom Collection",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Handcrafted Living & Pottery",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Festive Silk & Kurtas",
    url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
  }
];

// Dining Food Menu Presets
const SAMPLE_MENU_PRESETS = [
  {
    label: "Main Food Menu (Starters & Mains)",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Beverages & Cocktails Menu",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Desserts & Specials",
    url: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80"
  }
];

// Retail Ambience Presets
const SAMPLE_RETAIL_PHOTO_PRESETS = [
  {
    label: "Fabindia Ethnic Showroom Display",
    url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Handcrafted Decor & Artisan Racks",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Boutique Front Entrance & Glow",
    url: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Modern Billing & Gift Counter",
    url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
  }
];

// Dining Ambience Presets
const SAMPLE_DINING_PHOTO_PRESETS = [
  {
    label: "Warm Interior Seating",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Front Entrance & Facade",
    url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Chef Special Dish Presentation",
    url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Outdoor Terrace Ambience",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  }
];

export const StoreMediaAndAmenitiesSection: React.FC<StoreMediaAndAmenitiesProps> = ({
  imageUrl,
  menuImages,
  photos,
  amenities,
  onImageUrlChange,
  onMenuImagesChange,
  onPhotosChange,
  onAmenitiesChange,
  categoryHint = "Dining",
  storeType: controlledStoreType,
  onStoreTypeChange
}) => {
  // Auto-detect store category from hint if not explicitly set
  const detectedType: "DINING" | "RETAIL" | "SERVICES" = (() => {
    const hint = (categoryHint || "").toLowerCase();
    if (/fab|retail|cloth|apparel|fashion|living|decor|jewel|grocery|mart|store/i.test(hint)) {
      return "RETAIL";
    }
    if (/salon|spa|beauty|wellness|hair/i.test(hint)) {
      return "SERVICES";
    }
    return "DINING";
  })();

  const [internalStoreType, setInternalStoreType] = useState<"DINING" | "RETAIL" | "SERVICES">(
    controlledStoreType || detectedType
  );
  const activeStoreType = controlledStoreType || internalStoreType;

  const handleSelectStoreType = (type: "DINING" | "RETAIL" | "SERVICES") => {
    setInternalStoreType(type);
    if (onStoreTypeChange) onStoreTypeChange(type);
  };

  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [activeAmenityCategory, setActiveAmenityCategory] = useState<string>("All");

  const isRetail = activeStoreType === "RETAIL";
  const isServices = activeStoreType === "SERVICES";

  // File Upload Helper with HTML5 Canvas compression
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "menu" | "photo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = type === "cover" ? 1400 : 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL("image/jpeg", 0.84);
              if (type === "cover") {
                if (onImageUrlChange) onImageUrlChange(compressed);
                toast.success("Cover facade photo uploaded!");
              } else if (type === "menu") {
                onMenuImagesChange([...menuImages, compressed]);
                toast.success(isRetail ? "Catalog page uploaded!" : "Menu page uploaded!");
              } else {
                onPhotosChange([...photos, compressed]);
                toast.success("Ambience photo uploaded!");
              }
              return;
            }
          } catch (err) {
            console.warn("Canvas compression fallback:", err);
          }
          if (type === "cover") {
            if (onImageUrlChange) onImageUrlChange(dataUrl);
            toast.success("Cover photo uploaded!");
          } else if (type === "menu") {
            onMenuImagesChange([...menuImages, dataUrl]);
            toast.success("Page uploaded!");
          } else {
            onPhotosChange([...photos, dataUrl]);
            toast.success("Photo uploaded!");
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyCoverUrl = () => {
    if (!newCoverUrl.trim()) return;
    if (onImageUrlChange) onImageUrlChange(newCoverUrl.trim());
    setNewCoverUrl("");
    toast.success("Cover photo updated!");
  };

  const handleAddMenuUrl = () => {
    if (!newMenuUrl.trim()) return;
    onMenuImagesChange([...menuImages, newMenuUrl.trim()]);
    setNewMenuUrl("");
    toast.success(isRetail ? "Catalog page added!" : "Menu page added!");
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    onPhotosChange([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl("");
    toast.success("Ambience photo added!");
  };

  const toggleAmenity = (amenityId: string) => {
    if (amenities.includes(amenityId)) {
      onAmenitiesChange(amenities.filter((a) => a !== amenityId));
    } else {
      onAmenitiesChange([...amenities, amenityId]);
    }
  };

  const handleAddCustomAmenity = () => {
    const val = customAmenity.trim();
    if (!val) return;
    if (amenities.includes(val)) {
      toast.error("Amenity already added!");
      return;
    }
    onAmenitiesChange([...amenities, val]);
    setCustomAmenity("");
    toast.success(`Added custom amenity: "${val}"`);
  };

  // Filter amenities by active category pill
  const filteredAmenities = PRESET_AMENITIES.filter((a) => {
    if (activeAmenityCategory === "All") return true;
    if (activeAmenityCategory === "Retail") return a.category === "Retail";
    if (activeAmenityCategory === "Dining") return a.category === "Dining";
    if (activeAmenityCategory === "Comfort") return a.category === "Comfort" || a.category === "Accessibility" || a.category === "Connectivity" || a.category === "Payment";
    return true;
  });

  return (
    <div className="space-y-6 pt-3 border-t border-slate-200 dark:border-slate-800">
      {/* 0. Store Catalog & Business Type Selector */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Store size={14} className="text-purple-600" />
            <span>Store Business Type</span>
          </label>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Adapts media & menu requirements
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSelectStoreType("RETAIL")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between",
              activeStoreType === "RETAIL"
                ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-base">🛍️</span>
              {activeStoreType === "RETAIL" && <CheckCircle2 size={13} className="text-white" />}
            </div>
            <div className="mt-1">
              <span className="text-xs font-extrabold block">Retail & Products</span>
              <span className={cn("text-[10px] block opacity-85", activeStoreType === "RETAIL" ? "text-purple-100" : "text-slate-400")}>
                Fabindia, Fashion, Grocery
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStoreType("DINING")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between",
              activeStoreType === "DINING"
                ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-base">🍽️</span>
              {activeStoreType === "DINING" && <CheckCircle2 size={13} className="text-white" />}
            </div>
            <div className="mt-1">
              <span className="text-xs font-extrabold block">Dining & Food</span>
              <span className={cn("text-[10px] block opacity-85", activeStoreType === "DINING" ? "text-amber-100" : "text-slate-400")}>
                Restaurants, Cafes, Bars
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectStoreType("SERVICES")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between",
              activeStoreType === "SERVICES"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/40"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-base">💇</span>
              {activeStoreType === "SERVICES" && <CheckCircle2 size={13} className="text-white" />}
            </div>
            <div className="mt-1">
              <span className="text-xs font-extrabold block">Services & Salon</span>
              <span className={cn("text-[10px] block opacity-85", activeStoreType === "SERVICES" ? "text-indigo-100" : "text-slate-400")}>
                Spas, Beauty, Clinics
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 1. Store Cover Photo / Main Facade Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs">
              <ImageIcon size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Store Cover Photo (Main Facade)</span>
                {imageUrl ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                    Recommended
                  </Badge>
                )}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The primary banner shown on user search cards and the top hero section
              </p>
            </div>
          </div>
        </div>

        {/* Cover Preview Card */}
        {imageUrl ? (
          <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-21/9 sm:aspect-24/9 shadow-md">
            <img
              src={imageUrl}
              alt="Store Cover Banner"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3">
              <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Primary Cover Banner</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewZoomImage(imageUrl)}
                  className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs font-bold transition-colors"
                  title="Zoom"
                >
                  <Eye size={13} />
                </button>
                {onImageUrlChange && (
                  <button
                    type="button"
                    onClick={() => {
                      onImageUrlChange("");
                      toast.info("Cleared cover image");
                    }}
                    className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No cover photo chosen yet. Pick a curated preset below or upload a storefront photo.
            </p>
          </div>
        )}

        {/* 1-Click Curated Presets for Quick Setup */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>1-Click Curated Cover Presets:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STORE_COVER_PRESETS.filter((p) => (isRetail ? p.category === "RETAIL" : isServices ? p.category === "SERVICES" : p.category === "DINING")).map(
              (preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (onImageUrlChange) onImageUrlChange(preset.url);
                    toast.success(`Applied "${preset.label}" cover photo!`);
                  }}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all shadow-2xs",
                    imageUrl === preset.url
                      ? "bg-purple-600 text-white border-purple-600 font-bold"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:bg-purple-50/50"
                  )}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Cover Photo URL & File Upload */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCoverUrl}
            onChange={(e) => setNewCoverUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyCoverUrl();
              }
            }}
            placeholder="Paste cover facade URL (https://...)"
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-pink-500"
          />
          <button
            type="button"
            onClick={handleApplyCoverUrl}
            disabled={!newCoverUrl.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            Set URL
          </button>
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
            <Upload size={12} />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "cover")}
            />
          </label>
        </div>
      </div>

      {/* 2. Store Menu Cards vs Retail Lookbook (Adaptive Section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs",
              isRetail
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}>
              {isRetail ? <ShoppingBag size={14} /> : <UtensilsCrossed size={14} />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>
                  {isRetail
                    ? "Store Lookbook & Catalog (Optional for Retail)"
                    : isServices
                    ? "Service Rate Card / Treatments Menu"
                    : "Store Menu Card / Rate Card"}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    isRetail
                      ? "border-purple-300 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                      : "border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {menuImages.length === 0 ? "0 pages (Optional)" : `${menuImages.length} ${menuImages.length === 1 ? "page" : "pages"}`}
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRetail
                  ? "Product merchants (like Fabindia) don't need food menus. Upload lookbook pages or leave blank."
                  : isServices
                  ? "Upload service pricing, treatments, or therapy brochures"
                  : "Upload multi-page food menus, beverage lists, or dessert cards"}
              </p>
            </div>
          </div>

          {/* Quick Preset loader for fast filling */}
          {menuImages.length === 0 && (
            <button
              type="button"
              onClick={() => {
                if (isRetail) {
                  onMenuImagesChange(SAMPLE_RETAIL_LOOKBOOK_PRESETS.map((p) => p.url));
                  toast.success("Loaded 3 sample Fabindia lookbook scans!");
                } else {
                  onMenuImagesChange(SAMPLE_MENU_PRESETS.map((p) => p.url));
                  toast.success("Loaded 3 sample menu cards!");
                }
              }}
              className={cn(
                "text-[11px] font-semibold hover:underline flex items-center gap-1",
                isRetail ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              <Sparkles size={11} />
              <span>{isRetail ? "Sample Lookbook" : "Sample Menu"}</span>
            </button>
          )}
        </div>

        {/* Informational Guidance for Retail / Product Merchants */}
        {isRetail && menuImages.length === 0 && (
          <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
            <Info size={15} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[11px]">
                No Food Menu Needed for Retail & Product Merchants
              </p>
              <p className="text-[11px] text-purple-800/80 dark:text-purple-300 leading-relaxed">
                Since this is a product/retail merchant (e.g. <strong>Fabindia</strong>, apparel, electronics, or kirana), 
                the customer discovery view will automatically showcase your <strong>Live Products Catalog & Product Deals</strong> tab. 
                You can leave this blank, or upload seasonal lookbook scans if you wish.
              </p>
            </div>
          </div>
        )}

        {/* Menu/Lookbook Cards Thumbnails Grid */}
        {menuImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {menuImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-3/4 shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt={isRetail ? `Lookbook page ${idx + 1}` : `Menu page ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                  {isRetail ? `Catalog ${idx + 1}` : `Page ${idx + 1}`}
                </span>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewZoomImage(imgUrl)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition-colors"
                    title="Zoom in"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onMenuImagesChange(menuImages.filter((_, i) => i !== idx));
                      toast.info(`Removed page ${idx + 1}`);
                    }}
                    className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="Delete page"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Menu Image Input & File Upload */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMenuUrl}
            onChange={(e) => setNewMenuUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddMenuUrl();
              }
            }}
            placeholder={isRetail ? "Paste lookbook or catalog page URL (https://...)" : "Paste menu image URL (https://...)"}
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddMenuUrl}
            disabled={!newMenuUrl.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            Add URL
          </button>
          <label className={cn(
            "cursor-pointer px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs",
            isRetail ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-500 hover:bg-amber-600"
          )}>
            <Upload size={12} />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "menu")}
            />
          </label>
        </div>
      </div>

      {/* 3. Store Ambience & Showroom Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Camera size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isRetail ? "Store & Showroom Photos" : "Store Ambience Photos"}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRetail
                  ? "Showcase display racks, fitting rooms, store aisles, and entrance"
                  : "Showcase seating, entrance, interior lighting, and storefront vibe"}
              </p>
            </div>
          </div>

          {photos.length === 0 && (
            <button
              type="button"
              onClick={() => {
                if (isRetail) {
                  onPhotosChange(SAMPLE_RETAIL_PHOTO_PRESETS.map((p) => p.url));
                  toast.success("Loaded 4 sample Fabindia boutique photos!");
                } else {
                  onPhotosChange(SAMPLE_DINING_PHOTO_PRESETS.map((p) => p.url));
                  toast.success("Loaded 4 sample store photos!");
                }
              }}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles size={11} />
              <span>{isRetail ? "Fabindia Sample Photos" : "Sample Photos"}</span>
            </button>
          )}
        </div>

        {/* Photos Thumbnails Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {photos.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt={`Store photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewZoomImage(imgUrl)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition-colors"
                    title="Zoom in"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPhotosChange(photos.filter((_, i) => i !== idx));
                      toast.info(`Removed photo ${idx + 1}`);
                    }}
                    className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Ambience Photo URL & File Upload */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newPhotoUrl}
            onChange={(e) => setNewPhotoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPhotoUrl();
              }
            }}
            placeholder="Paste photo URL (https://...)"
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddPhotoUrl}
            disabled={!newPhotoUrl.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            Add URL
          </button>
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
            <Upload size={12} />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "photo")}
            />
          </label>
        </div>
      </div>

      {/* 4. Store Amenities & Conveniences Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Sparkles size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Store Amenities & Facilities</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  {amenities.length} selected
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select available conveniences to display badges on customer discovery cards
              </p>
            </div>
          </div>

          {/* Category Filter Tabs for Amenities */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
            {["All", "Retail", "Dining", "Comfort"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveAmenityCategory(cat)}
                className={cn(
                  "px-2 py-0.5 rounded-md font-medium transition-all",
                  activeAmenityCategory === cat
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities Selection Chips Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
          {filteredAmenities.map((amenity) => {
            const isSelected = amenities.includes(amenity.id);
            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs font-semibold ring-1 ring-emerald-500"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-750"
                )}
              >
                <span>{amenity.icon}</span>
                <span>{amenity.label}</span>
                {isSelected && <Check size={11} className="stroke-[3]" />}
              </button>
            );
          })}

          {/* Any custom amenities selected that aren't in presets */}
          {amenities
            .filter((a) => !PRESET_AMENITIES.some((pa) => pa.id === a))
            .map((customA) => (
              <button
                key={customA}
                type="button"
                onClick={() => toggleAmenity(customA)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs"
              >
                <span>⭐</span>
                <span>{customA}</span>
                <X size={11} className="stroke-[3] hover:text-red-200" />
              </button>
            ))}
        </div>

        {/* Custom Amenity Input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomAmenity();
              }
            }}
            placeholder="Add custom amenity (e.g. Tailoring, EV Charging, Valet)..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddCustomAmenity}
            disabled={!customAmenity.trim()}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Zooming Cover, Menu, or Ambience Photo */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewZoomImage}
              alt="Full Preview"
              className="max-w-full max-h-[82vh] object-contain mx-auto"
            />
            <div className="p-3 bg-slate-950 flex items-center justify-between border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-medium truncate max-w-md">
                Full-Size Image Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
