import React, { useState, useEffect } from "react";
import {
  MapPin,
  Bell,
  Search,
  QrCode,
  Heart,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Home,
  Compass,
  CreditCard,
  Coins,
  User,
  Plus,
  Check,
  ArrowRight
} from "lucide-react";
import { HomeBanner, Offer, Store } from "../../types";
import { bannerApi } from "../../api/bannerApi";
import { offerApi } from "../../api/offerApi";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface MobileHomeScreenProps {
  onClose?: () => void;
  onOpenQRScanner?: () => void;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "🔥", bg: "bg-brand-700 text-white" },
  { id: "dining", label: "Dining", icon: "🍔", bg: "bg-orange-100 text-orange-600" },
  { id: "cafes", label: "Cafes", icon: "☕", bg: "bg-amber-100 text-amber-700" },
  { id: "supermarket", label: "Supermarket", icon: "🛒", bg: "bg-emerald-100 text-emerald-700" },
  { id: "kirana", label: "Kirana", icon: "🏪", bg: "bg-rose-100 text-rose-600" },
  { id: "fashion", label: "Fashion", icon: "👕", bg: "bg-indigo-100 text-indigo-600" },
  { id: "electronics", label: "Electronics", icon: "💻", bg: "bg-sky-100 text-sky-600" },
  { id: "salons", label: "Salons", icon: "✂️", bg: "bg-pink-100 text-pink-600" },
  { id: "gyms", label: "Gyms", icon: "🏋️", bg: "bg-teal-100 text-teal-700" },
];

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  onClose,
  onOpenQRScanner,
}) => {
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "scan" | "rewards" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 8 });

  // Dynamic Banners
  const [banners, setBanners] = useState<HomeBanner[]>([
    {
      id: "b-1",
      title: "FLAT 50% OFF Weekend Food Carnival",
      subtitle: "Valid at 120+ cafes & diners in your city",
      badgeText: "Weekend Special",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      ctaText: "Claim Pass",
      isActive: true,
    },
    {
      id: "b-2",
      title: "BUY 1 GET 1 on Fresh Bakery & Brews",
      subtitle: "Artisan breads, croissants & coffees",
      badgeText: "Limited Slots",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      ctaText: "Explore Now",
      isActive: true,
    }
  ]);

  useEffect(() => {
    // 1-second countdown ticker for Flash Deals
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);

    // Fetch live banners from backend
    bannerApi.getActiveBanners().then((data) => {
      if (data && data.length > 0) setBanners(data);
    });

    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id] ? "Saved to favorites" : "Removed from favorites");
      return next;
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Smartphone Shell Device Frame */}
      <div className="w-full max-w-[410px] h-[860px] bg-slate-50 dark:bg-slate-900 rounded-[44px] shadow-[0_25px_70px_rgba(0,0,0,0.5)] border-[8px] border-slate-800 flex flex-col overflow-hidden relative font-sans">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-1 flex justify-between items-center text-[11px] font-bold text-slate-800 dark:text-slate-200 select-none z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 rounded-xs border border-slate-700 p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 dark:bg-slate-200 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Top Header: Location, Coins, Notifications */}
        <header className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-30">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
              <MapPin size={14} className="fill-pink-500" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">Indiranagar</span>
                <span className="text-[10px] text-pink-600 font-bold">▾</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate max-w-[140px]">Bangalore • 560038</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Coin Balance Badge */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <span className="text-xs">🪙</span>
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-300">1,450</span>
            </div>

            {/* Notification Bell */}
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
          
          {/* Search & Scan Bar */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xs">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores, food, groceries, deals..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Scan & Pay QR Trigger */}
              <button
                onClick={onOpenQRScanner || (() => toast.info("Opening Camera QR Scanner for Counter Scan & Pay"))}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-transform"
                title="Scan Counter QR"
              >
                <QrCode size={18} />
              </button>
            </div>
          </div>

          {/* Section 03: Hero Promotional Banners Carousel */}
          <section className="px-4">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="w-[320px] shrink-0 h-36 rounded-2xl overflow-hidden relative shadow-md group border border-slate-200/40"
                >
                  <img
                    src={b.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 p-3.5 flex flex-col justify-between">
                    <span className="self-start bg-rose-600/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {b.badgeText || "Trending"}
                    </span>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight drop-shadow-sm line-clamp-1">
                        {b.title}
                      </h3>
                      <p className="text-[10px] text-slate-200 line-clamp-1 mt-0.5 opacity-90">
                        {b.subtitle}
                      </p>
                      <button className="mt-2 bg-white text-slate-900 font-black text-[10px] px-3 py-1 rounded-lg shadow-sm hover:bg-slate-100 transition-colors">
                        {b.ctaText || "Claim Pass"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 04: Explore Categories */}
          <section className="space-y-2">
            <div className="px-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Explore Categories</h3>
                <p className="text-[9px] text-slate-400">Shop verified stores & services near you</p>
              </div>
              <button className="text-[10px] font-bold text-pink-600 flex items-center">
                <span>View All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center gap-1 shrink-0 group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xs transition-transform group-active:scale-90",
                      selectedCategory === cat.id ? "ring-2 ring-pink-500 scale-105" : "",
                      cat.bg
                    )}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Section 05: Top Service Offers Near You */}
          <section className="space-y-2">
            <div className="px-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Top Service Offers Near You
                </h3>
                <p className="text-[9px] text-slate-400">Restaurants, salons, wellness & gyms</p>
              </div>
              <button className="text-[10px] font-bold text-pink-600 flex items-center">
                <span>View All (28)</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
              {/* Service Card 1 */}
              <div className="w-60 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-card flex flex-col justify-between">
                <div className="relative h-28">
                  <img
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
                    alt="Smokehouse Grill"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                    45m left
                  </span>
                  <button
                    onClick={(e) => toggleFavorite("s-1", e)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center"
                  >
                    <Heart size={12} className={favorites["s-1"] ? "fill-rose-500 text-rose-500" : ""} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">The Smokehouse Grill</h4>
                    <span className="text-blue-500 text-[10px]">✓</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-2">Indiranagar • 400m away</p>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 p-2 rounded-xl mb-2">
                    <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">FLAT 40% OFF</p>
                    <p className="text-[9px] text-emerald-800 dark:text-emerald-400">Up to ₹500 • On bills above ₹1,000</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-amber-600">🪙 +150 Coins</span>
                    <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-xs">
                      Book & Pay
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Card 2 */}
              <div className="w-60 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-card flex flex-col justify-between">
                <div className="relative h-28">
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
                    alt="Bodycraft Spa"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                    Instant
                  </span>
                  <button
                    onClick={(e) => toggleFavorite("s-2", e)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center"
                  >
                    <Heart size={12} className={favorites["s-2"] ? "fill-rose-500 text-rose-500" : ""} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Bodycraft Luxury Salon</h4>
                    <span className="text-blue-500 text-[10px]">✓</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mb-2">100 Feet Rd • 800m away</p>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 p-2 rounded-xl mb-2">
                    <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">FLAT ₹300 OFF</p>
                    <p className="text-[9px] text-emerald-800 dark:text-emerald-400">Hair Spa & Facials above ₹999</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-amber-600">🪙 +200 Coins</span>
                    <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-xs">
                      Claim Offer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 06: Top Product Deals (MRP vs Deal Price) */}
          <section className="space-y-2">
            <div className="px-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Top Product Deals Near You
                </h3>
                <p className="text-[9px] text-slate-400">Daily groceries & retail bargains</p>
              </div>
              <button className="text-[10px] font-bold text-pink-600 flex items-center">
                <span>View All (56)</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
              {/* Product 1 */}
              <div className="w-36 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2.5 shadow-2xs relative flex flex-col justify-between">
                <span className="absolute top-2 left-2 bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded z-10">
                  20% OFF
                </span>
                <div className="h-20 w-full flex items-center justify-center p-1 mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80"
                    alt="Amul Milk"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Amul Fresh Milk</h5>
                  <p className="text-[9px] text-slate-400">1 Litre</p>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white">₹52</span>
                    <span className="text-[9px] text-slate-400 line-through">₹65</span>
                  </div>
                  <button className="w-full py-1 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                    <Plus size={10} /> Add to Cart
                  </button>
                </div>
              </div>

              {/* Product 2 */}
              <div className="w-36 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2.5 shadow-2xs relative flex flex-col justify-between">
                <span className="absolute top-2 left-2 bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded z-10">
                  10% OFF
                </span>
                <div className="h-20 w-full flex items-center justify-center p-1 mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80"
                    alt="Basmati Rice"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">India Gate Rice</h5>
                  <p className="text-[9px] text-slate-400">5 kg Pack</p>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white">₹540</span>
                    <span className="text-[9px] text-slate-400 line-through">₹600</span>
                  </div>
                  <button className="w-full py-1 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                    <Plus size={10} /> Add to Cart
                  </button>
                </div>
              </div>

              {/* Product 3 */}
              <div className="w-36 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2.5 shadow-2xs relative flex flex-col justify-between">
                <span className="absolute top-2 left-2 bg-amber-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded z-10">
                  Buy 2 Get 1
                </span>
                <div className="h-20 w-full flex items-center justify-center p-1 mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=200&q=80"
                    alt="Noodles"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Maggi Noodles</h5>
                  <p className="text-[9px] text-slate-400">70 g Pack</p>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white">₹28</span>
                    <span className="text-[9px] text-slate-400 line-through">₹32</span>
                  </div>
                  <button className="w-full py-1 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                    <Plus size={10} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 07: Featured Stores for All Your Needs */}
          <section className="space-y-2">
            <div className="px-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Featured Stores</h3>
                <p className="text-[9px] text-slate-400">Top rated partner merchants in Indiranagar</p>
              </div>
              <button className="text-[10px] font-bold text-pink-600 flex items-center">
                <span>View All Stores</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
              {/* Store 1 */}
              <div className="w-48 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2.5 shadow-2xs">
                <div className="relative h-20 rounded-xl overflow-hidden mb-2">
                  <img
                    src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80"
                    alt="BigBasket Store"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                    10% OFF
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 font-black text-[9px] flex items-center justify-center">
                    bb
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">BigBasket Instant</h5>
                    <p className="text-[9px] text-slate-400">Supermarket</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1">
                  <span className="text-amber-500 font-bold">★ 4.6</span>
                  <span>• 800m away</span>
                </div>
                <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-md px-1.5 py-0.5">
                  🏷️ 10% off on all items
                </div>
              </div>

              {/* Store 2 */}
              <div className="w-48 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2.5 shadow-2xs">
                <div className="relative h-20 rounded-xl overflow-hidden mb-2">
                  <img
                    src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80"
                    alt="Third Wave Coffee"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                    Flat ₹150 Off
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black text-[9px] flex items-center justify-center">
                    ☕
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Third Wave Coffee</h5>
                    <p className="text-[9px] text-slate-400">Artisan Cafe</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1">
                  <span className="text-amber-500 font-bold">★ 4.8</span>
                  <span>• 300m away</span>
                </div>
                <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-md px-1.5 py-0.5">
                  🏷️ +2X Coins on UPI scan
                </div>
              </div>
            </div>
          </section>

          {/* Section 11: ⚡ Flash Deals Ending Soon Block */}
          <section className="px-4">
            <div className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-pink-900 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-amber-300 text-base">⚡</span>
                <h4 className="text-xs font-black tracking-tight">Flash Deals Ending Soon!</h4>
              </div>
              <p className="text-[9px] text-purple-200 mb-3">Grab verified bargains before the timer expires</p>

              {/* Countdown Clock */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 font-mono">
                  <div className="bg-black/40 rounded-lg px-2 py-1 text-center min-w-[32px]">
                    <span className="text-xs font-black block leading-none">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] text-purple-200">Hours</span>
                  </div>
                  <span className="font-bold text-xs">:</span>
                  <div className="bg-black/40 rounded-lg px-2 py-1 text-center min-w-[32px]">
                    <span className="text-xs font-black block leading-none">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] text-purple-200">Mins</span>
                  </div>
                  <span className="font-bold text-xs">:</span>
                  <div className="bg-black/40 rounded-lg px-2 py-1 text-center min-w-[32px]">
                    <span className="text-xs font-black block leading-none text-amber-300">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] text-purple-200">Secs</span>
                  </div>
                </div>

                <button className="bg-white text-purple-950 font-black text-[9px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-100">
                  View All Flash
                </button>
              </div>

              {/* Flash Deals Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "Rice 5kg", deal: "₹540", mrp: "₹990", off: "45%" },
                  { name: "boAt Pods", deal: "₹1,199", mrp: "₹1,999", off: "40%" },
                  { name: "Cookware", deal: "₹999", mrp: "₹1,999", off: "50%" },
                  { name: "Sneakers", deal: "₹1,299", mrp: "₹1,999", off: "35%" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-1.5 text-slate-800 text-center relative shadow-xs">
                    <span className="absolute -top-1.5 -left-1 bg-rose-600 text-white text-[7px] font-black px-1 rounded">
                      {item.off}
                    </span>
                    <div className="h-8 flex items-center justify-center text-lg mb-1">
                      {idx === 0 ? "🍚" : idx === 1 ? "🎧" : idx === 2 ? "🍳" : "👟"}
                    </div>
                    <p className="text-[8px] font-bold truncate">{item.name}</p>
                    <p className="text-[9px] font-black text-purple-900 leading-tight">
                      {item.deal} <span className="text-[7px] text-slate-400 line-through font-normal">{item.mrp}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 12: Why Shop on PINAK Trust Badges */}
          <section className="px-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs grid grid-cols-3 gap-2 text-center">
              <div className="p-1">
                <span className="text-base block mb-0.5">🛡️</span>
                <p className="text-[9px] font-black text-slate-800 dark:text-white">100% Verified</p>
                <p className="text-[8px] text-slate-400">Authentic Stores</p>
              </div>
              <div className="p-1 border-x border-slate-100 dark:border-slate-700">
                <span className="text-base block mb-0.5">⚡</span>
                <p className="text-[9px] font-black text-slate-800 dark:text-white">Instant Deals</p>
                <p className="text-[8px] text-slate-400">Scan & Save Direct</p>
              </div>
              <div className="p-1">
                <span className="text-base block mb-0.5">🪙</span>
                <p className="text-[9px] font-black text-slate-800 dark:text-white">Coin Cashback</p>
                <p className="text-[8px] text-slate-400">Every UPI Scan</p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-6 py-2 flex items-center justify-between z-40">
          <button
            onClick={() => setActiveTab("home")}
            className={cn("flex flex-col items-center gap-0.5", activeTab === "home" ? "text-pink-600 font-bold" : "text-slate-400")}
          >
            <Home size={18} />
            <span className="text-[9px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("explore")}
            className={cn("flex flex-col items-center gap-0.5", activeTab === "explore" ? "text-pink-600 font-bold" : "text-slate-400")}
          >
            <Compass size={18} />
            <span className="text-[9px]">Explore</span>
          </button>

          {/* Center Scan & Pay Button */}
          <button
            onClick={onOpenQRScanner || (() => toast.info("Opening Scan & Pay"))}
            className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-white dark:border-slate-900"
          >
            <QrCode size={22} />
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={cn("flex flex-col items-center gap-0.5", activeTab === "rewards" ? "text-pink-600 font-bold" : "text-slate-400")}
          >
            <Coins size={18} />
            <span className="text-[9px]">Rewards</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={cn("flex flex-col items-center gap-0.5", activeTab === "profile" ? "text-pink-600 font-bold" : "text-slate-400")}
          >
            <User size={18} />
            <span className="text-[9px]">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
