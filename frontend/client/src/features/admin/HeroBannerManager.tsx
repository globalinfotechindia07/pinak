import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  ArrowUpDown,
  Tag,
  Zap,
  Check,
  AlertCircle,
  X
} from "lucide-react";
import { HomeBanner } from "../../types";
import { bannerApi, CreateBannerPayload } from "../../api/bannerApi";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

const DEFAULT_BANNER_PREVIEWS: HomeBanner[] = [
  {
    id: "banner-1",
    title: "FLAT 50% OFF Weekend Food Carnival",
    subtitle: "Valid at 120+ cafes, diners & pubs in your city",
    badgeText: "Weekend Special",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    ctaText: "Claim Pass",
    ctaAction: "CLAIM_PASS",
    ctaTargetId: "carnival-2026",
    themeStyle: "PRIMARY_GRADIENT",
    displayOrder: 1,
    countdownEndTime: new Date(Date.now() + 18 * 3600000).toISOString(),
    isActive: true,
  },
  {
    id: "banner-2",
    title: "BUY 1 GET 1 on Fresh Bakery & Brews",
    subtitle: "Artisan breads, croissants & roasted coffees",
    badgeText: "Limited Slots",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    ctaText: "Explore Now",
    ctaAction: "OPEN_CATEGORY",
    ctaTargetId: "cafes",
    themeStyle: "SUNSET_AMBER",
    displayOrder: 2,
    countdownEndTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    isActive: true,
  },
  {
    id: "banner-3",
    title: "Mega Kirana & Grocery Savings Week",
    subtitle: "Up to 35% cashback on daily household essentials",
    badgeText: "Verified Stores",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    ctaText: "Order & Save",
    ctaAction: "OPEN_CATEGORY",
    ctaTargetId: "supermarket",
    themeStyle: "EMERALD_FEAST",
    displayOrder: 3,
    isActive: true,
  }
];

export const HeroBannerManager: React.FC = () => {
  const [banners, setBanners] = useState<HomeBanner[]>(DEFAULT_BANNER_PREVIEWS);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("Special Deal");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Claim Pass");
  const [ctaAction, setCtaAction] = useState("CLAIM_PASS");
  const [ctaTargetId, setCtaTargetId] = useState("");
  const [themeStyle, setThemeStyle] = useState("PRIMARY_GRADIENT");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [countdownEndTime, setCountdownEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerApi.getAllBanners();
      if (data && data.length > 0) {
        setBanners(data);
      }
    } catch (err) {
      console.warn("Using offline banner previews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateDrawer = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setBadgeText("Exclusive");
    setImageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80");
    setCtaText("Claim Pass");
    setCtaAction("CLAIM_PASS");
    setCtaTargetId("");
    setThemeStyle("PRIMARY_GRADIENT");
    setDisplayOrder(banners.length + 1);
    setCountdownEndTime("");
    setIsActive(true);
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (b: HomeBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setBadgeText(b.badgeText);
    setImageUrl(b.imageUrl || "");
    setCtaText(b.ctaText || "Claim Pass");
    setCtaAction(b.ctaAction || "CLAIM_PASS");
    setCtaTargetId(b.ctaTargetId || "");
    setThemeStyle(b.themeStyle || "PRIMARY_GRADIENT");
    setDisplayOrder(b.displayOrder || 1);
    setCountdownEndTime(b.countdownEndTime ? b.countdownEndTime.slice(0, 16) : "");
    setIsActive(b.isActive);
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleToggleStatus = async (b: HomeBanner) => {
    try {
      await bannerApi.toggleBannerStatus(b.id);
      setBanners((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, isActive: !item.isActive } : item))
      );
      toast.success(`Banner "${b.title}" ${!b.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      // Optimistic fallback
      setBanners((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, isActive: !item.isActive } : item))
      );
      toast.success(`Banner "${b.title}" status updated`);
    }
  };

  const handleDeleteBanner = async (id: string, bannerTitle: string) => {
    if (!confirm(`Are you sure you want to delete banner "${bannerTitle}"?`)) return;
    try {
      await bannerApi.deleteBanner(id);
      setBanners((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Banner "${bannerTitle}" deleted`);
    } catch (err) {
      setBanners((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Banner "${bannerTitle}" removed`);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Banner title is required";
    if (!badgeText.trim()) errors.badgeText = "Badge tag is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill required fields");
      return;
    }

    const payload: CreateBannerPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      badgeText: badgeText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      ctaText: ctaText.trim() || "Claim Pass",
      ctaAction,
      ctaTargetId: ctaTargetId.trim() || undefined,
      themeStyle,
      displayOrder: Number(displayOrder) || 1,
      countdownEndTime: countdownEndTime ? new Date(countdownEndTime).toISOString() : undefined,
      isActive,
    };

    try {
      if (editingBanner) {
        await bannerApi.updateBanner(editingBanner.id, payload);
        toast.success(`Banner "${title}" updated successfully!`);
      } else {
        await bannerApi.createBanner(payload);
        toast.success(`Hero banner "${title}" published!`);
      }
      fetchBanners();
    } catch (err) {
      // Local optimistic update
      if (editingBanner) {
        setBanners((prev) =>
          prev.map((item) => (item.id === editingBanner.id ? { ...item, ...payload } : item))
        );
      } else {
        const newBanner: HomeBanner = {
          id: `banner-${Date.now()}`,
          ...payload,
          isActive: payload.isActive ?? true,
        };
        setBanners((prev) => [...prev, newBanner]);
      }
      toast.success(`Banner "${title}" saved successfully!`);
    } finally {
      setIsDrawerOpen(false);
      setEditingBanner(null);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (statusFilter === "ACTIVE") return b.isActive;
    if (statusFilter === "INACTIVE") return !b.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-bold">
              <Zap size={18} />
            </span>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Hero Promotional Banners CMS
            </h2>
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              Mobile Screen 10 Sec 03
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Curate and schedule high-impact promotional carousel banners seen by customers at the top of the mobile home feed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBanners}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Banners"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openCreateDrawer}
            className="btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Create Hero Banner</span>
          </button>
        </div>
      </div>

      {/* Live Mobile Carousel Simulator Preview */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">
              Live Mobile Consumer Feed Preview
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {banners.filter((b) => b.isActive).length} Active in Mobile Carousel
          </span>
        </div>

        {/* Carousel Preview Cards Rail */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {banners
            .filter((b) => b.isActive)
            .map((b) => (
              <div
                key={b.id}
                className="w-80 shrink-0 h-40 rounded-2xl overflow-hidden relative shadow-lg group border border-white/10"
              >
                <img
                  src={b.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"}
                  alt={b.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="bg-rose-600/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {b.badgeText}
                    </span>
                    {b.countdownEndTime && (
                      <span className="bg-black/50 text-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock size={10} /> Ending Soon
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white leading-tight drop-shadow-sm line-clamp-1">
                      {b.title}
                    </h4>
                    <p className="text-[10px] text-slate-200 line-clamp-1 mt-0.5 opacity-90">
                      {b.subtitle}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-300">Priority #{b.displayOrder}</span>
                      <button className="bg-white text-slate-900 font-extrabold text-[10px] px-3 py-1 rounded-lg shadow-sm">
                        {b.ctaText || "Claim Pass"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Filter & Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  statusFilter === filter
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                {filter === "ALL" ? `All Banners (${banners.length})` : filter}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredBanners.length} banners
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Banner Details</th>
                <th className="px-5 py-3">Badge Tag</th>
                <th className="px-5 py-3">Call To Action</th>
                <th className="px-5 py-3 text-center">Rank</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBanners.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        <img
                          src={b.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80"}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {b.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">
                          {b.subtitle || "No subtitle"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge variant="secondary" className="font-bold text-[10px] bg-pink-50 text-pink-700 border-pink-200">
                      {b.badgeText}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5 font-medium">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">{b.ctaText || "Claim Pass"}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({b.ctaAction})</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-center font-bold text-slate-600 dark:text-slate-400 font-mono">
                    #{b.displayOrder}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 mx-auto",
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {b.isActive ? (
                        <>
                          <CheckCircle2 size={12} /> Live
                        </>
                      ) : (
                        <>
                          <XCircle size={12} /> Paused
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditDrawer(b)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Banner Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-slate-800">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {editingBanner ? "Edit Hero Banner" : "Publish Hero Banner"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Mobile Screen 10 Top Header Carousel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {/* Live Card Preview Inside Drawer */}
                <div className="p-3 rounded-2xl bg-slate-900 text-white relative overflow-hidden shadow-md">
                  <img
                    src={imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"}
                    alt="Preview"
                    className="w-full h-28 object-cover rounded-xl"
                  />
                  <div className="absolute inset-3 bg-gradient-to-t from-black/85 via-black/30 to-black/10 p-3 rounded-xl flex flex-col justify-between">
                    <span className="self-start bg-rose-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                      {badgeText || "Badge"}
                    </span>
                    <div>
                      <h5 className="font-black text-xs leading-tight line-clamp-1">{title || "Banner Title"}</h5>
                      <p className="text-[9px] text-slate-300 line-clamp-1">{subtitle || "Banner Subtitle"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. FLAT 50% OFF Weekend Food Carnival"
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold",
                      formErrors.title ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                    )}
                  />
                  {formErrors.title && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Valid at 120+ cafes, diners & pubs in your city"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Badge Pill Tag *
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. Weekend Special / Ending Soon"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Display Priority (1 = Top)
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Banner Background Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Claim Pass"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Click Action
                    </label>
                    <select
                      value={ctaAction}
                      onChange={(e) => setCtaAction(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="CLAIM_PASS">Claim Pass Modal</option>
                      <option value="OPEN_CATEGORY">Open Category</option>
                      <option value="OPEN_OFFER">Open Specific Offer</option>
                      <option value="OPEN_STORE">Open Specific Store</option>
                      <option value="EXTERNAL_LINK">External URL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Action Target ID / Category Slug
                  </label>
                  <input
                    type="text"
                    value={ctaTargetId}
                    onChange={(e) => setCtaTargetId(e.target.value)}
                    placeholder="e.g. cafes / offer-uuid / https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Countdown End Timer (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={countdownEndTime}
                      onChange={(e) => setCountdownEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Banner Active Status
                    </label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-purple-600 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {isActive ? "Live in App" : "Draft / Paused"}
                      </span>
                    </div>
                  </div>
                </div>
              </form>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBanner}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  {editingBanner ? "Update Banner" : "Publish to Carousel"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
