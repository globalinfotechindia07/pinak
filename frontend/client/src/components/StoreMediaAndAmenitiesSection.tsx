import React, { useState } from "react";
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
  Tag
} from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export interface StoreMediaAndAmenitiesProps {
  menuImages: string[];
  photos: string[];
  amenities: string[];
  onMenuImagesChange: (images: string[]) => void;
  onPhotosChange: (photos: string[]) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  categoryHint?: string; // e.g. "Dining", "Cafe", "Retail", "Salon"
}

// Curated Popular Amenities with Emojis & Labels
export const PRESET_AMENITIES: { id: string; label: string; icon: string; category: string }[] = [
  // Dining & Hospitality
  { id: "Air Conditioned", label: "Air Conditioned", icon: "❄️", category: "Comfort" },
  { id: "Free High-Speed Wi-Fi", label: "Free Wi-Fi", icon: "📶", category: "Connectivity" },
  { id: "Valet Parking", label: "Valet Parking", icon: "🚗", category: "Parking" },
  { id: "Free Parking", label: "Free Parking", icon: "🅿️", category: "Parking" },
  { id: "Cards & UPI Accepted", label: "Cards & UPI", icon: "💳", category: "Payment" },
  { id: "Pure Veg", label: "Pure Veg", icon: "🌿", category: "Dining" },
  { id: "Outdoor Seating", label: "Outdoor Seating", icon: "🌳", category: "Dining" },
  { id: "Rooftop Ambience", label: "Rooftop Ambience", icon: "✨", category: "Dining" },
  { id: "Full Bar & Cocktails", label: "Full Bar", icon: "🍸", category: "Dining" },
  { id: "Live Music", label: "Live Music", icon: "🎵", category: "Entertainment" },
  { id: "Private Dining Area", label: "Private Dining", icon: "🔒", category: "Comfort" },
  { id: "Kid Friendly", label: "Kid Friendly", icon: "👶", category: "Accessibility" },
  { id: "Wheelchair Accessible", label: "Wheelchair Accessible", icon: "♿", category: "Accessibility" },
  { id: "Pet Friendly", label: "Pet Friendly", icon: "🐕", category: "Accessibility" },
  { id: "Charging Points", label: "Charging Points", icon: "🔌", category: "Connectivity" },
  { id: "Smoking Zone", label: "Smoking Zone", icon: "🚬", category: "Comfort" },
  { id: "Table Reservation", label: "Table Reservation", icon: "📅", category: "Service" },
  { id: "Takeaway & Delivery", label: "Takeaway", icon: "📦", category: "Service" },
  { id: "Locker & Shower", label: "Locker & Shower", icon: "🚿", category: "Wellness" }
];

// Sample Presets for Quick Demo / Seeding
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

const SAMPLE_PHOTO_PRESETS = [
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
  menuImages,
  photos,
  amenities,
  onMenuImagesChange,
  onPhotosChange,
  onAmenitiesChange,
  categoryHint
}) => {
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // File Upload Helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "menu" | "photo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        if (type === "menu") {
          onMenuImagesChange([...menuImages, dataUrl]);
          toast.success("Menu page uploaded successfully!");
        } else {
          onPhotosChange([...photos, dataUrl]);
          toast.success("Ambience photo uploaded successfully!");
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddMenuUrl = () => {
    if (!newMenuUrl.trim()) return;
    onMenuImagesChange([...menuImages, newMenuUrl.trim()]);
    setNewMenuUrl("");
    toast.success("Menu image added!");
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    onPhotosChange([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl("");
    toast.success("Photo added!");
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

  return (
    <div className="space-y-6 pt-3 border-t border-slate-200 dark:border-slate-800">
      {/* 1. Store Menu Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              <UtensilsCrossed size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Store Menu Card / Rate Card</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                  {menuImages.length} {menuImages.length === 1 ? "page" : "pages"}
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload multi-page food menus, beverage lists, or service rate cards
              </p>
            </div>
          </div>

          {/* Quick Preset loader for fast filling */}
          {menuImages.length === 0 && (
            <button
              type="button"
              onClick={() => {
                onMenuImagesChange(SAMPLE_MENU_PRESETS.map((p) => p.url));
                toast.success("Loaded 3 sample menu cards!");
              }}
              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Sparkles size={11} />
              <span>Sample Menu</span>
            </button>
          )}
        </div>

        {/* Menu Cards Thumbnails Grid */}
        {menuImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {menuImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-3/4 shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt={`Menu page ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                  Page {idx + 1}
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
                      toast.info(`Removed menu page ${idx + 1}`);
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
            placeholder="Paste menu image URL (https://...)"
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
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
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

      {/* 2. Store & Ambience Photos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <Camera size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Store Ambience & Facility Photos</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-300 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Showcase seating, dining hall, entrance, interior lighting, and vibe
              </p>
            </div>
          </div>

          {photos.length === 0 && (
            <button
              type="button"
              onClick={() => {
                onPhotosChange(SAMPLE_PHOTO_PRESETS.map((p) => p.url));
                toast.success("Loaded 4 sample ambience photos!");
              }}
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <Sparkles size={11} />
              <span>Sample Photos</span>
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
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
          />
          <button
            type="button"
            onClick={handleAddPhotoUrl}
            disabled={!newPhotoUrl.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
          >
            Add URL
          </button>
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
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

      {/* 3. Store Amenities Checklist */}
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
        </div>

        {/* Amenities Selection Chips Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
          {PRESET_AMENITIES.map((amenity) => {
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
            placeholder="Add custom amenity (e.g. Jain Food, Craft Beer, EV Charger)..."
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

      {/* Lightbox Modal for Zooming Menu or Photo */}
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
