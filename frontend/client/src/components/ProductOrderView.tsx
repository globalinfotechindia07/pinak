import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Check,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  Percent,
  ShoppingBag,
  Store,
  Phone,
  MapPin,
  Share2,
  Plus,
  Minus,
  Star,
  Heart,
  ShieldCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { couponApi } from "@/api/couponApi";

export interface ProductItemData {
  id: string;
  name: string;
  title?: string;
  brand?: string;
  unit?: string;
  sellingPrice: number | string;
  dealPrice?: number | string;
  mrp?: number | string;
  originalMrp?: number | string;
  discountBadge?: string;
  imageUrl?: string;
  inStock?: boolean;
  description?: string;
}

export interface ProductCouponItem {
  id: string;
  code: string;
  badgeText: string;
  headline: string;
  description: string;
  discountPct?: number;
  flatDiscount?: number;
  maxDiscount?: number;
  minBill?: number;
  terms: string[];
}

export interface ProductOrderViewProps {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  coverImageUrl?: string;
  distanceKm?: number;
  product?: ProductItemData;
  initialQuantity?: number;
  customerCoins?: number;
  onBack: () => void;
  onOrderConfirmed?: (orderDetails: any) => void;
}

export const ProductOrderView: React.FC<ProductOrderViewProps> = ({
  storeId,
  storeName = "Store Outlet",
  storeAddress = "Store Location",
  coverImageUrl,
  distanceKm = 0.5,
  product = {
    id: "prod_store_item",
    name: "Store Product",
    brand: "In-Store Deal",
    unit: "1 Unit",
    sellingPrice: 100,
    mrp: 120,
    discountBadge: "SPECIAL OFFER",
    inStock: true,
    description: "Available in-store with exclusive discount offer."
  },
  initialQuantity = 1,
  customerCoins,
  onBack,
  onOrderConfirmed
}) => {
  // Navigation Steps: "product_detail" -> "checkout" -> "apply_coupon" -> "confirmed"
  type ProductOrderStep = "product_detail" | "checkout" | "apply_coupon" | "confirmed";
  const [orderStep, setOrderStep] = useState<ProductOrderStep>("product_detail");
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  // In-Store Quantity Selection (Default to 1)
  const [quantity, setQuantity] = useState<number>(initialQuantity > 0 ? initialQuantity : 1);

  // Available In-Store Product Coupons
  const productCoupons: ProductCouponItem[] = [
    {
      id: "coup_prod_welcome",
      code: "WELCOME",
      badgeText: "10% OFF",
      headline: "Extra 10% OFF on In-Store Deal",
      description: "Get Extra 10% OFF up to ₹150 on your in-store shelf bill.",
      discountPct: 10,
      maxDiscount: 150,
      minBill: 100,
      terms: [
        "Extra 10% OFF up to ₹150 on in-store shelf purchases",
        "Applicable on all products and in-store retail goods",
        "Instantly auto-applied on mobile checkout",
        "Valid for all in-store walk-in shoppers"
      ]
    },
    {
      id: "coup_prod_flat",
      code: "PINAKSTORE",
      badgeText: "FLAT ₹50",
      headline: "Flat ₹50 OFF on Bills above ₹300",
      description: "Special PINAK store voucher for in-store shelf purchase.",
      flatDiscount: 50,
      minBill: 300,
      terms: [
        "Instant ₹50 deduction on store bill over ₹300",
        "Valid when picking products directly from store",
        "Directly settled with merchant"
      ]
    },
    {
      id: "coup_prod_upi",
      code: "UPIPAY20",
      badgeText: "FLAT ₹20",
      headline: "Save ₹20 with Direct UPI Pay",
      description: "Instant discount for in-store UPI mobile payment.",
      flatDiscount: 20,
      minBill: 100,
      terms: [
        "Flat ₹20 off when paying via Google Pay, PhonePe or PINAK UPI",
        "Applied immediately at checkout"
      ]
    }
  ];

  // Applied Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<ProductCouponItem | null>(productCoupons[0]);
  const [couponCodeInput, setCouponCodeInput] = useState<string>("");
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [celebrationDetails, setCelebrationDetails] = useState<{ code: string; saved: number }>({
    code: "",
    saved: 0
  });
  const [expandedTermsId, setExpandedTermsId] = useState<string | null>(null);

  // Coins State
  const [useCoins, setUseCoins] = useState<boolean>(false);

  // Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Google Pay");

  // Confirmed Order Details
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [paymentTime, setPaymentTime] = useState<string>("");

  // Product Pricing
  const unitPrice = useMemo(() => {
    const raw = product.dealPrice || product.sellingPrice;
    return typeof raw === "string" ? parseFloat(raw) || 100 : raw || 100;
  }, [product]);

  const unitMrp = useMemo(() => {
    const raw = product.originalMrp || product.mrp;
    return typeof raw === "string" ? parseFloat(raw) || unitPrice * 1.2 : raw || unitPrice * 1.2;
  }, [product, unitPrice]);

  const itemTotal = unitPrice * quantity;
  const originalTotal = unitMrp * quantity;
  const mrpSavings = Math.max(0, originalTotal - itemTotal);

  // Coupon Calculation
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || itemTotal <= 0) return 0;
    if (appliedCoupon.minBill && itemTotal < appliedCoupon.minBill) return 0;
    if (appliedCoupon.flatDiscount) return appliedCoupon.flatDiscount;
    if (appliedCoupon.discountPct) {
      const calc = Math.round((itemTotal * appliedCoupon.discountPct) / 100);
      return appliedCoupon.maxDiscount ? Math.min(appliedCoupon.maxDiscount, calc) : calc;
    }
    return 0;
  }, [appliedCoupon, itemTotal]);

  const discountedItems = Math.max(0, itemTotal - couponDiscount);
  const coinsEarned = Math.round(discountedItems * 0.2); // 20% PINAK Coins
  const userCoinBalance = customerCoins != null ? customerCoins : 500;
  const maxProductCoinsAllowed = Math.min(userCoinBalance, Math.max(0, Math.round(discountedItems * 0.10)));
  const coinSavings = useCoins ? (maxProductCoinsAllowed > 0 ? maxProductCoinsAllowed : Math.min(userCoinBalance, 40)) : 0;

  // In-Store purchase: ZERO packaging fee (Customer picked items directly from shelf)
  const totalPayable = useMemo(() => {
    const sum = discountedItems - coinSavings;
    return Math.max(0, Math.round(sum));
  }, [discountedItems, coinSavings]);

  const totalSavings = mrpSavings + couponDiscount + coinSavings;

  const handleApplyCoupon = (coup: ProductCouponItem) => {
    if (coup.minBill && itemTotal < coup.minBill) {
      toast.error(`Minimum bill amount for ${coup.code} is ₹${coup.minBill}`);
      return;
    }
    let saved = 0;
    if (coup.flatDiscount) {
      saved = coup.flatDiscount;
    } else if (coup.discountPct) {
      const calc = Math.round((itemTotal * coup.discountPct) / 100);
      saved = coup.maxDiscount ? Math.min(coup.maxDiscount, calc) : calc;
    }
    setAppliedCoupon(coup);
    setCelebrationDetails({ code: coup.code, saved });
    setShowCelebrationModal(true);
    setOrderStep("checkout");
  };

  const handleApplyCustomCode = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await couponApi.validateCoupon({
        code,
        billAmount: itemTotal,
        storeId,
        paymentMethod: selectedPaymentMethod,
      });

      if (!res.valid) {
        toast.error(res.message || `Invalid coupon code ${code}`);
        return;
      }

      const validated: ProductCouponItem = {
        id: `coup_${code.toLowerCase()}`,
        code,
        badgeText: res.coupon?.badgeText || "VERIFIED",
        headline: res.coupon?.headline || `Saved ₹${res.discountAmount} with ${code}`,
        description: res.coupon?.description || res.message,
        flatDiscount: res.discountAmount,
        discountPct: res.coupon?.discountPct,
        maxDiscount: res.coupon?.maxDiscount,
        terms: res.coupon?.terms || ["Applicable on current in-store purchase"],
      };
      handleApplyCoupon(validated);
      toast.success(res.message || `Coupon ${code} applied!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to validate coupon");
    }
  };

  const handleConfirmInStorePayment = () => {
    const generatedTxnRef = `PNK-ORD-${Date.now().toString().slice(-8)}`;
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    setTransactionRef(generatedTxnRef);
    setPaymentTime(nowTime);
    setOrderStep("confirmed");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const orderData = {
      orderRef: generatedTxnRef,
      storeName,
      storeAddress,
      productTitle: product.name || product.title,
      quantity,
      itemTotal,
      couponDiscount,
      totalPaid: totalPayable,
      totalSavings,
      coinsEarned,
      paymentMethod: selectedPaymentMethod,
      timestamp: nowTime
    };

    if (onOrderConfirmed) {
      onOrderConfirmed(orderData);
    }
    toast.success(`Payment of ₹${totalPayable} Successful!`, {
      description: `Paid to ${storeName} with discount offer applied.`
    });
  };

  // Quick quantity buttons for in-store shelf selection
  const quickQuantities = [1, 2, 3, 5, 10];

  // =========================================================================
  // VIEW 4: PAYMENT SUCCESSFUL & DIGITAL RECEIPT
  // ("Humne product liya store se aur payment kiya offer laga ke done as simple as that")
  // =========================================================================
  if (orderStep === "confirmed") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-28 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs font-bold text-slate-500">Payment Receipt</span>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `PINAK Payment Receipt: ₹${totalPayable} at ${storeName}`,
                    text: `Paid ₹${totalPayable} for ${quantity}x ${product.name} at ${storeName}. Saved ₹${totalSavings} with PINAK offer!`
                  }).catch(() => {});
                } else {
                  toast.success("Receipt details copied to clipboard!");
                }
              }}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
              title="Share Receipt"
            >
              <Share2 size={16} />
            </button>
          </header>

          <div className="p-4 space-y-4">
            {/* Green / Emerald Pulsing Success Badge */}
            <div className="text-center pt-3 pb-1">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-150 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center relative shadow-lg shadow-emerald-500/30">
                  <Check size={32} className="stroke-[3.5]" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paid to <strong className="text-slate-800 dark:text-slate-200">{storeName}</strong>
              </p>

              {/* Big Amount Display */}
              <div className="mt-3">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{totalPayable.toLocaleString("en-IN")}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-black shadow-2xs">
                  <Percent size={12} className="stroke-[3]" />
                  <span>Offer Applied • You saved ₹{totalSavings}!</span>
                </div>
              )}
            </div>

            {/* Clean Digital Bill / Receipt Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider block">
                    STORE PURCHASE
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {storeName}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {storeAddress}
                  </p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  PAID ✓
                </span>
              </div>

              {/* Product Item Row */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-13 h-13 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quantity: <strong className="text-slate-800 dark:text-slate-200">{quantity} {quantity > 1 ? "units" : "unit"}</strong> ({product.unit || "Pack"})
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    ₹{itemTotal.toLocaleString("en-IN")}
                  </span>
                  {originalTotal > itemTotal && (
                    <span className="text-[10px] line-through text-slate-400 block">
                      ₹{originalTotal.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total MRP</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{originalTotal.toLocaleString("en-IN")}</span>
                </div>

                {mrpSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Store Offer Discount</span>
                    <span>-₹{mrpSavings.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {useCoins && coinSavings > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                    <span>PINAK Coins Redeemed</span>
                    <span>-₹{coinSavings}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>Convenience & Shelf Fee</span>
                  <span className="font-bold text-emerald-600">FREE ₹0</span>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                  <span>Amount Paid</span>
                  <span>₹{totalPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Meta: Payment Method, Txn ID, Time */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Payment Mode</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPaymentMethod}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Transaction Ref</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transactionRef || "PNK-ORD-88294102"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Today, {paymentTime || "Just now"}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Status</span>
                  <span className="font-black text-emerald-600">● Confirmed</span>
                </div>
              </div>
            </div>

            {/* Coins Earned Banner */}
            <div className="bg-gradient-to-r from-amber-50 via-purple-50 to-amber-50 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                  🪙
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    +{coinsEarned} PINAK Coins Earned!
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Credited to your wallet for future purchases.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                2X REWARD
              </span>
            </div>
          </div>
        </div>

        {/* Floating Center Done Button in PINAK Royal Purple Gradient */}
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 max-w-[430px] mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition cursor-pointer text-center"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: APPLY STORE COUPONS SCREEN
  // =========================================================================
  if (orderStep === "apply_coupon") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-12 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOrderStep("checkout")}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                APPLY STORE COUPON
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Store Item Bill: ₹{itemTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </header>

          <div className="p-4 space-y-5">
            {/* Enter Coupon Code Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2 pl-4 flex items-center justify-between shadow-xs">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal w-full uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCustomCode}
                disabled={!couponCodeInput.trim()}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer uppercase tracking-wider",
                  couponCodeInput.trim()
                    ? "bg-purple-700 text-white shadow-xs hover:bg-purple-800"
                    : "text-slate-400 cursor-not-allowed"
                )}
              >
                APPLY
              </button>
            </div>

            {/* More Offers Section */}
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white mb-3">
                Available In-Store Offers
              </h2>

              <div className="space-y-4">
                {productCoupons.map((coupon) => {
                  const isExpanded = expandedTermsId === coupon.id;
                  const isCurrentApplied = appliedCoupon?.code === coupon.code;

                  return (
                    <div
                      key={coupon.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col"
                    >
                      <div className="flex items-stretch min-h-[110px]">
                        {/* Perforated Vertical Coupon Left Strip */}
                        <div className="w-12 bg-gradient-to-b from-purple-700 to-indigo-800 text-white flex flex-col items-center justify-center relative shrink-0 border-r border-dashed border-white/40">
                          <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#fbfbff] dark:bg-slate-950" />
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#fbfbff] dark:bg-slate-950" />
                          <span className="text-[10px] font-black uppercase tracking-widest -rotate-90 whitespace-nowrap">
                            {coupon.badgeText}
                          </span>
                        </div>

                        {/* Coupon Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                                {coupon.code}
                              </h3>
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {coupon.headline}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(coupon)}
                              className={cn(
                                "text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md transition cursor-pointer",
                                isCurrentApplied
                                  ? "text-emerald-600 font-extrabold cursor-default"
                                  : "text-purple-700 hover:text-purple-800 dark:text-purple-400"
                              )}
                            >
                              {isCurrentApplied ? "APPLIED ✓" : "APPLY"}
                            </button>
                          </div>

                          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-2" />

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                            {coupon.description}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTermsId(isExpanded ? null : coupon.id)
                            }
                            className="mt-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                          >
                            <span>{isExpanded ? "HIDE DETAILS" : "+ MORE"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Terms & Conditions */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                          <p className="font-black text-slate-900 dark:text-white text-xs mb-1">
                            Terms and Conditions apply
                          </p>
                          {coupon.terms.map((term, tIdx) => (
                            <p key={tIdx} className="leading-relaxed flex items-start gap-1.5">
                              <span className="text-slate-400">•</span>
                              <span>{term}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PRODUCT IN-STORE DEAL DETAILS PAGE
  // =========================================================================
  if (orderStep === "product_detail") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-36 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="truncate px-2 text-center flex-1">
              <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider block">
                In-Store Deal • {storeName}
              </span>
              <h1 className="text-xs font-black text-slate-900 dark:text-white truncate">
                {product.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${product.name} at ${storeName}`,
                      text: `Get ${product.name} for ₹${unitPrice} (MRP ₹${unitMrp}) in-store at ${storeName} on PINAK!`
                    }).catch(() => {});
                  } else {
                    toast.success("Deal link copied to clipboard!");
                  }
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                aria-label="Share"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFavorited(!isFavorited);
                  toast.success(isFavorited ? "Removed from wishlist" : "Added to your wishlist!");
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-rose-500 flex items-center justify-center transition cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart size={16} className={isFavorited ? "fill-rose-500 text-rose-500" : "text-rose-500"} />
              </button>
            </div>
          </header>

          <div className="p-4 space-y-4">
            {/* Hero Product Image */}
            <div className="relative aspect-square w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm flex items-center justify-center group">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShoppingBag size={48} />
                </div>
              )}

              {/* Discount Tag */}
              {product.discountBadge && (
                <div className="absolute top-3 left-3 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wide">
                  {product.discountBadge}
                </div>
              )}

              {/* In-Store Shelf Badge */}
              <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-white/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>On Store Shelf • Instant Pick</span>
              </div>
            </div>

            {/* Title, Brand, Pack Size & Ratings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {product.brand || "Store Specialty"}
                </span>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-lg text-xs font-black">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span>4.9</span>
                  <span className="text-[10px] text-slate-400 font-normal">Rating</span>
                </div>
              </div>

              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pack Size: <span className="font-bold text-slate-800 dark:text-slate-200">{product.unit || "1 Pack"}</span>
              </p>

              {/* Price & Savings Row */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{unitPrice.toLocaleString("en-IN")}
                  </span>
                  {unitMrp > unitPrice && (
                    <span className="text-sm line-through text-slate-400 font-semibold">
                      ₹{unitMrp.toLocaleString("en-IN")}
                    </span>
                  )}
                  {unitMrp > unitPrice && (
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      Save ₹{Math.round(unitMrp - unitPrice)} ({Math.round(((unitMrp - unitPrice) / unitMrp) * 100)}% OFF)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In-Store Quantity Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Select Quantity
                  </h3>
                  <p className="text-xs text-slate-500">Pick from shelf & pay</p>
                </div>

                {/* Counter Stepper */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black flex items-center justify-center shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-black text-base text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                    className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black flex items-center justify-center shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Select Quantity Pills */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                {quickQuantities.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center border",
                      quantity === q
                        ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    )}
                  >
                    {q} {q > 1 ? "units" : "unit"}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Store Seamless Experience Explanation */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                <Store size={14} />
                <span>How In-Store Purchase Works</span>
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Take the product directly from the store shelf
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      No waiting in long cashier queues. Pick items right off the shelf.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Pay discounted bill right here on your phone
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      The in-store offer & coupons apply automatically. Pay directly via UPI.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                    ✓
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Done! Instant payment receipt & PINAK coins
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Your payment is settled directly with the store merchant.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Product Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Product & In-Store Availability
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {product.description ||
                  "Available in-store. Pick directly from shelf and pay via PINAK with active discount offers applied."}
              </p>
            </div>

            {/* Store Information */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {storeName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{storeAddress}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "tel:+918007462500";
                    }}
                    className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center transition border border-purple-200 shadow-2xs"
                    title="Call Store"
                  >
                    <Phone size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(storeName + " " + storeAddress)}`,
                        "_blank"
                      );
                    }}
                    className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center transition border border-purple-200 shadow-2xs"
                    title="Directions"
                  >
                    <MapPin size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar on Product Details Screen */}
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 shadow-2xl flex items-center justify-between gap-3">
          {/* Left: Total Bill for selected quantity */}
          <div className="pl-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              In-Store Bill ({quantity} {quantity > 1 ? "units" : "unit"})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                ₹{(unitPrice * quantity).toLocaleString("en-IN")}
              </span>
              {originalTotal > itemTotal && (
                <span className="text-xs line-through text-slate-400 font-semibold">
                  ₹{originalTotal.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {/* Right: Proceed to In-Store Bill Pay */}
          <button
            type="button"
            onClick={() => {
              setOrderStep("checkout");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex-1 max-w-[240px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/25 active:scale-98 transition cursor-pointer"
          >
            <span>Proceed to Bill Pay</span>
            <ChevronRight size={16} />
          </button>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: IN-STORE BILL CHECKOUT SCREEN
  // =========================================================================
  return (
    <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-36 animate-in fade-in duration-200">
      <div>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <button
              type="button"
              onClick={() => setOrderStep("product_detail")}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="truncate">
              <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">
                In-Store Bill: {storeName}
              </h1>
              <p className="text-[11px] text-slate-500 truncate">{storeAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              toast.info("PINAK 24/7 Helpline", {
                description: "Need help with your in-store bill pay? Call +91 800-PINAK-HELP"
              });
            }}
            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 hover:bg-slate-100 cursor-pointer"
          >
            <HelpCircle size={15} />
          </button>
        </header>

        <div className="p-3.5 space-y-3.5">
          {/* Dark Hero Container with Strikethrough & Savings Pill */}
          <div className="bg-gradient-to-b from-[#241a24] to-[#171217] text-white rounded-3xl p-5 text-center relative overflow-hidden shadow-md">
            <p className="text-xs font-semibold text-slate-300">Total in-store item bill</p>
            {couponDiscount > 0 ? (
              <div className="mt-1">
                <p className="text-base text-slate-400 line-through font-bold">
                  ₹{itemTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-4xl font-black text-[#5be3a3] tracking-tight">
                  ₹{discountedItems.toLocaleString("en-IN")}
                </p>
              </div>
            ) : (
              <p className="text-4xl font-black text-[#5be3a3] mt-1 tracking-tight">
                ₹{itemTotal.toLocaleString("en-IN")}
              </p>
            )}

            {couponDiscount > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#0e5c3e] border border-[#1cb379]/40 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-full shadow-inner animate-in zoom-in-95 duration-150">
                <Percent size={12} className="stroke-[3]" />
                <span>Woah! you're saving ₹{couponDiscount} extra!</span>
              </div>
            )}
          </div>

          {/* Selected Shelf Items Card with Quantity Adjuster */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-18 h-18 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-2xs"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <ShoppingBag size={28} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                  {product.brand || "In-Store Deal"}
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{product.unit || "Pack"}</p>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{unitPrice}
                  </span>
                  {unitMrp > unitPrice && (
                    <span className="text-xs line-through text-slate-400">
                      ₹{unitMrp}
                    </span>
                  )}
                  {product.discountBadge && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {product.discountBadge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Row */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Quantity: <strong className="text-purple-700 dark:text-purple-300">{quantity} {quantity > 1 ? "units" : "unit"}</strong>
                </p>
                <p className="text-[10px] text-slate-400">Selected from store shelf</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center font-black text-sm text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                  className="w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-black flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 2X PINAK Coins Card */}
          <div className="bg-[#fbf7f0] dark:bg-slate-900 rounded-3xl border border-amber-200/70 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                🪙
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider block">
                  2X PINAK COINS
                </span>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                  Enjoy 2X PINAK Coins benefits here
                </h3>
              </div>
            </div>

            {/* Subcard */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-amber-200/50 dark:border-slate-800 p-3 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  You will earn 20% PINAK Coins
                </span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">
                  ↑ ₹{coinsEarned}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Use PINAK Coins
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Balance: {userCoinBalance} 🪙)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (userCoinBalance <= 0) {
                        toast.error("Your coin balance is 0. Shop in-store to earn coins!");
                        return;
                      }
                      setUseCoins(!useCoins);
                    }}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5",
                      useCoins ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                        useCoins ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[36px] text-right font-mono">
                    {useCoins && coinSavings > 0 ? `-₹${coinSavings}` : "₹0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Coupons & Offers Card */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
              Store Offers & Coupons
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      `{appliedCoupon.code}` applied
                    </h4>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <span>✓ ₹{couponDiscount} extra coupon savings</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      toast.info("Coupon removed");
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setOrderStep("apply_coupon")}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-700 transition">
                      Apply store coupon & Bank Offers
                    </h4>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Save extra with WELCOME or PINAKSTORE
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              )}
            </div>
          </div>

          {/* In-Store Bill Breakdown Card */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
              Store Bill Breakdown
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Total MRP ({quantity} {quantity > 1 ? "units" : "unit"})</span>
                <span className="font-extrabold">₹{originalTotal.toLocaleString("en-IN")}</span>
              </div>

              {mrpSavings > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>In-Store Deal Discount</span>
                  <span className="font-extrabold">-₹{mrpSavings.toLocaleString("en-IN")}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-slate-100 dark:border-slate-800 pt-2">
                  <span>Coupon `{appliedCoupon?.code}`</span>
                  <span className="font-extrabold">-₹{couponDiscount}</span>
                </div>
              )}

              {useCoins && coinSavings > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span>PINAK Coins Redeemed</span>
                  <span>-₹{coinSavings}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>In-Store Shelf Fee / Packaging</span>
                <span className="font-bold text-emerald-600">FREE ₹0</span>
              </div>

              {/* To Pay Rounded Off Total */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    To Pay (Rounded off)
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    Total Savings: ₹{totalSavings}
                  </span>
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  ₹{totalPayable.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Modal on Coupon Apply */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#fffdfa] dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-amber-200/80 dark:border-slate-800 shadow-2xl text-center relative pt-8 animate-in zoom-in-95 duration-200">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 border-2 border-white dark:border-slate-900">
              <Percent size={24} className="stroke-[3.5]" />
            </div>

            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <Check size={16} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
              `{celebrationDetails.code}` applied
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-semibold">
              You saved ₹{celebrationDetails.saved} with this coupon!
            </p>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-purple-600/25 active:scale-95 transition cursor-pointer uppercase tracking-wider"
              >
                YAY!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar Matching PINAK Palette */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 shadow-2xl">
        <div className="mb-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <Store size={14} className="shrink-0 text-emerald-600" />
          <span className="font-bold truncate text-[11px]">
            In-Store shelf purchase at {storeName}.
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left: Payment Method Toggle */}
          <div
            onClick={() => {
              setSelectedPaymentMethod((prev) =>
                prev === "Google Pay" ? "PhonePe" : prev === "PhonePe" ? "PINAK UPI" : "Google Pay"
              );
            }}
            className="cursor-pointer select-none pl-1 flex flex-col justify-center"
          >
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
              <span>PAY USING ▲</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {selectedPaymentMethod}
              </span>
            </div>
          </div>

          {/* Right: Signature PINAK Purple Pay Button */}
          <button
            type="button"
            onClick={handleConfirmInStorePayment}
            className="flex-1 max-w-[210px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-purple-900/25 active:scale-98 transition cursor-pointer"
          >
            <span>Pay ₹{totalPayable.toLocaleString("en-IN")}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ProductOrderView;
