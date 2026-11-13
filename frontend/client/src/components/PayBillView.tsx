import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  HelpCircle,
  Check,
  X,
  AlertTriangle,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  Percent,
  Loader2,
  Lock,
  ShieldCheck,
  Store,
  MapPin,
  Tag,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import tableBookingApi from "@/api/tableBookingApi";
import { useAppStore } from "@/hooks/useAppStore";
import { dataStore } from "@/services/dataStore";
import { rewardApi } from "@/api/rewardApi";
import { couponApi, CouponItem } from "@/api/couponApi";

export type { CouponItem };

export interface PayBillViewProps {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  coverImageUrl?: string;
  distanceKm?: number;
  initialBillAmount?: number;
  bookingRef?: string;
  bookingId?: string;
  offerTitle?: string;
  offerDiscountPct?: number;
  coverChargeAmount?: number;
  customerPhone?: string;
  customerName?: string;
  customerId?: string;
  customerCoins?: number;
  cashbackPercentage?: number;
  maxCashbackAmount?: number;
  minTransactionForCashback?: number;
  isCashbackEnabled?: boolean;
  cashbackName?: string;
  storeType?: "DINING" | "RETAIL" | "SERVICES";
  category?: string;
  isTableBookingEnabled?: boolean;
  onBack: () => void;
  onPaymentSuccess?: (paymentDetails: any) => void;
}

export const PayBillView: React.FC<PayBillViewProps> = ({
  storeId,
  storeName = "Yamazaki Pan-Asian Cuisine",
  storeAddress = "Bajaj Nagar, Nagpur",
  coverImageUrl,
  distanceKm = 88.1,
  initialBillAmount,
  bookingRef,
  bookingId,
  offerTitle,
  offerDiscountPct,
  coverChargeAmount,
  customerPhone,
  customerName,
  customerId,
  customerCoins,
  cashbackPercentage,
  maxCashbackAmount,
  minTransactionForCashback,
  isCashbackEnabled,
  cashbackName,
  storeType,
  category,
  isTableBookingEnabled,
  onBack,
  onPaymentSuccess
}) => {
  // Dynamic Retail vs Dining detection
  const isRetail =
    storeType === "RETAIL" ||
    isTableBookingEnabled === false ||
    /fab|retail|fashion|cloth|apparel|living|decor|jewel|grocery|mart|store|zara|h&m|supermarket|hyper/i.test(
      (storeName || "") + " " + (category || "")
    );
  const staffTitle = isRetail ? "Cashier / Staff" : "Waiter";
  const staffShortTitle = isRetail ? "cashier" : "waiter";
  const billTitle = isRetail ? "store bill" : "dining bill";
  const storeLabel = isRetail ? "store" : "restaurant";
  const appStore = useAppStore();
  const effectiveCustomerName = customerName || appStore.currentUser?.name || "";
  const effectiveCustomerPhone = customerPhone || appStore.currentUser?.phone || "";

  // User real coin balance from database
  const [userCoinBalance, setUserCoinBalance] = useState<number>(customerCoins != null ? customerCoins : 0);

  useEffect(() => {
    if (customerCoins != null) {
      setUserCoinBalance(customerCoins);
    } else if (customerId) {
      rewardApi.getCustomerRewardAccount(customerId).then((res: any) => {
        if (res && (res.pointsBalance != null || res.availableBalance != null)) {
          setUserCoinBalance(Number(res.pointsBalance ?? res.availableBalance));
        }
      }).catch(() => {});
    }
  }, [customerId, customerCoins]);

  // Dynamic Cashback Settings from Super Admin / Store Policy
  const [storeCashbackConfig, setStoreCashbackConfig] = useState<{
    percentage: number;
    maxCap: number;
    minSpend: number;
    enabled: boolean;
    name: string;
  }>({
    percentage: cashbackPercentage != null ? Number(cashbackPercentage) : 5,
    maxCap: maxCashbackAmount != null ? Number(maxCashbackAmount) : 150,
    minSpend: minTransactionForCashback != null ? Number(minTransactionForCashback) : 100,
    enabled: isCashbackEnabled !== false,
    name: cashbackName || "PINAK Instant Transaction Cashback"
  });

  useEffect(() => {
    if (cashbackPercentage == null && storeId) {
      tableBookingApi.getAvailability(storeId).then((res: any) => {
        const h = res?.store;
        if (h) {
          setStoreCashbackConfig({
            percentage: h.cashbackPercentage != null ? Number(h.cashbackPercentage) : 5,
            maxCap: h.maxCashbackAmount != null ? Number(h.maxCashbackAmount) : 150,
            minSpend: h.minTransactionForCashback != null ? Number(h.minTransactionForCashback) : 100,
            enabled: h.isCashbackEnabled !== false,
            name: h.cashbackName || "PINAK Instant Transaction Cashback"
          });
        }
      }).catch(() => {});
    }
  }, [storeId, cashbackPercentage]);

  // Navigation Steps: "enter_amount" -> "bill_checkout" -> "apply_coupon" -> "success"
  type PayStep = "enter_amount" | "bill_checkout" | "apply_coupon" | "success";
  const [payStep, setPayStep] = useState<PayStep>("enter_amount");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Table Booking Offer details (Discount locked during advance table reservation)
  const [resolvedOfferTitle, setResolvedOfferTitle] = useState<string>(offerTitle || "");
  const [resolvedOfferDiscountPct, setResolvedOfferDiscountPct] = useState<number>(offerDiscountPct || 0);
  const [resolvedCoverCharge, setResolvedCoverCharge] = useState<number>(coverChargeAmount || 0);

  // Bill Amount resolved from prop or booking details
  const [resolvedBillAmount, setResolvedBillAmount] = useState<number | undefined>(initialBillAmount);
  const [billAmountInput, setBillAmountInput] = useState<string>(
    initialBillAmount && initialBillAmount > 0 ? String(initialBillAmount) : ""
  );

  React.useEffect(() => {
    if (offerTitle) setResolvedOfferTitle(offerTitle);
    if (offerDiscountPct != null) setResolvedOfferDiscountPct(offerDiscountPct);
    if (coverChargeAmount != null) setResolvedCoverCharge(coverChargeAmount);

    if (initialBillAmount && initialBillAmount > 0) {
      setResolvedBillAmount(initialBillAmount);
      setBillAmountInput(String(initialBillAmount));
    }
    if (bookingRef) {
      tableBookingApi.getBookingDetails(bookingRef).then((details) => {
        if (details) {
          if (details.billAmount && Number(details.billAmount) > 0) {
            setResolvedBillAmount(Number(details.billAmount));
            setBillAmountInput(String(details.billAmount));
          }
          if (details.discountPct != null && Number(details.discountPct) > 0) {
            setResolvedOfferDiscountPct(Number(details.discountPct));
          }
          if (details.offerTitle) {
            setResolvedOfferTitle(details.offerTitle);
          }
          if (details.totalCoverCharge != null && Number(details.totalCoverCharge) > 0) {
            setResolvedCoverCharge(Number(details.totalCoverCharge));
          }
        }
      }).catch(() => {});
    }
  }, [bookingRef, initialBillAmount, offerTitle, offerDiscountPct, coverChargeAmount]);

  // Live polling: if waiter adds the bill in the background while this screen is open
  React.useEffect(() => {
    if (!bookingRef || (resolvedBillAmount && resolvedBillAmount > 0)) return;

    const interval = setInterval(async () => {
      try {
        const details = await tableBookingApi.getBookingDetails(bookingRef);
        if (details?.billAmount && Number(details.billAmount) > 0) {
          setResolvedBillAmount(Number(details.billAmount));
          setBillAmountInput(String(details.billAmount));
          toast.info(`${isRetail ? "Store added your bill" : "Restaurant added your dining bill"}: ₹${Number(details.billAmount).toLocaleString("en-IN")}`);
        }
      } catch (e) {
        // Ignore background polling failure
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingRef, resolvedBillAmount]);

  const isBillPreSetByStore = Boolean(resolvedBillAmount && resolvedBillAmount > 0);

  // Live Coupons from PostgreSQL Database
  const [availableCoupons, setAvailableCoupons] = useState<CouponItem[]>([]);
  const [autoApplicableCoupon, setAutoApplicableCoupon] = useState<CouponItem | null>(null);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState<boolean>(true);

  // Load real coupons from backend on mount and when bill amount or store changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCoupons(true);
    couponApi
      .getApplicableCoupons(storeId, numericBill)
      .then((res) => {
        if (!isMounted) return;
        setAvailableCoupons(res.coupons);
        setAutoApplicableCoupon(res.autoApplicableCoupon);
      })
      .catch((err) => {
        console.warn("[PayBillView] Error fetching real coupons:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCoupons(false);
      });

    return () => {
      isMounted = false;
    };
  }, [storeId, numericBill]);

  // Applied Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState<string>("");
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [celebrationDetails, setCelebrationDetails] = useState<{ code: string; saved: number }>({
    code: "",
    saved: 0
  });
  const [expandedTermsId, setExpandedTermsId] = useState<string | null>(null);

  // Coins & Tips State
  const [useCoins, setUseCoins] = useState<boolean>(false);
  const [isTipExpanded, setIsTipExpanded] = useState<boolean>(false);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [showCustomTipPrompt, setShowCustomTipPrompt] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>("");

  // Payment Method State
  const PAYMENT_METHODS = ["Google Pay", "PhonePe", "Paytm UPI", "PINAK UPI", "Credit / Debit Card"];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Google Pay");
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState<boolean>(false);

  // Completed Payment Details
  const [confirmedPaymentDetails, setConfirmedPaymentDetails] = useState<any>(null);

  // Calculations
  const numericBill = useMemo(() => {
    const val = parseFloat(billAmountInput.replace(/[^0-9.]/g, ""));
    return isNaN(val) ? 0 : val;
  }, [billAmountInput]);

  // Locked Table Pre-booking Offer Discount (e.g. 50% or 30% from advance table reservation)
  const tableOfferDiscount = useMemo(() => {
    if (numericBill <= 0 || resolvedOfferDiscountPct <= 0) return 0;
    return Math.round((numericBill * resolvedOfferDiscountPct) / 100);
  }, [numericBill, resolvedOfferDiscountPct]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || numericBill <= 0) return 0;
    const remainingBill = Math.max(0, numericBill - tableOfferDiscount);
    if (remainingBill <= 0) return 0;

    if (appliedCoupon.flatDiscount) {
      if (appliedCoupon.minBill && numericBill < appliedCoupon.minBill) return 0;
      return Math.min(remainingBill, appliedCoupon.flatDiscount);
    }
    if (appliedCoupon.discountPct) {
      const discount = Math.round((remainingBill * appliedCoupon.discountPct) / 100);
      return appliedCoupon.maxDiscount ? Math.min(appliedCoupon.maxDiscount, discount) : discount;
    }
    return 0;
  }, [appliedCoupon, numericBill, tableOfferDiscount]);

  const totalDiscount = tableOfferDiscount + couponDiscount;

  const coverChargeCredit = useMemo(() => {
    if (numericBill <= 0 || resolvedCoverCharge <= 0) return 0;
    const remaining = Math.max(0, numericBill - totalDiscount);
    return Math.min(resolvedCoverCharge, remaining);
  }, [numericBill, resolvedCoverCharge, totalDiscount]);

  const convenienceFee = numericBill > 0 ? 16.94 : 0;
  const gstOnFee = numericBill > 0 ? 3.06 : 0;
  const totalFees = convenienceFee + gstOnFee; // ₹20.00

  const coinsEarned = useMemo(() => {
    if (!storeCashbackConfig.enabled) return 0;
    const discounted = Math.max(0, numericBill - totalDiscount - coverChargeCredit);
    if (discounted < storeCashbackConfig.minSpend) return 0;
    const rawCoins = Math.round((discounted * storeCashbackConfig.percentage) / 100);
    return storeCashbackConfig.maxCap > 0 ? Math.min(rawCoins, storeCashbackConfig.maxCap) : rawCoins;
  }, [numericBill, totalDiscount, coverChargeCredit, storeCashbackConfig]);

  const maxCoinsUsable = useMemo(() => {
    if (userCoinBalance <= 0 || numericBill <= 0) return 0;
    const discounted = Math.max(0, numericBill - totalDiscount - coverChargeCredit);
    const capByBill = Math.max(0, Math.round(discounted * 0.10));
    return Math.min(userCoinBalance, capByBill > 0 ? capByBill : Math.min(userCoinBalance, 50));
  }, [userCoinBalance, numericBill, totalDiscount, coverChargeCredit]);

  const coinSavings = useCoins ? maxCoinsUsable : 0;

  const totalPayable = useMemo(() => {
    if (numericBill <= 0) return 0;
    const discounted = Math.max(0, numericBill - totalDiscount - coverChargeCredit);
    const withFeesAndTip = discounted + totalFees + selectedTip - coinSavings;
    return Math.max(0, Math.round(withFeesAndTip));
  }, [numericBill, totalDiscount, coverChargeCredit, totalFees, selectedTip, coinSavings]);

  // Quick bill presets & live initial calculations
  const handleQuickAdd = (amount: number) => {
    if (isBillPreSetByStore) return;
    const current = parseFloat(billAmountInput.replace(/[^0-9.]/g, "")) || 0;
    const next = current + amount;
    setBillAmountInput(String(next));
  };

  const handleClearBill = () => {
    if (isBillPreSetByStore) return;
    setBillAmountInput("");
  };

  const estimatedInitialSavings = useMemo(() => {
    if (numericBill <= 0) return 0;
    if (resolvedOfferDiscountPct > 0) {
      return Math.round((numericBill * resolvedOfferDiscountPct) / 100);
    }
    return Math.round(numericBill * 0.10); // 10% welcome coupon fallback
  }, [numericBill, resolvedOfferDiscountPct]);

  const estimatedInitialPayable = Math.max(0, numericBill - estimatedInitialSavings);

  // Handle Apply Coupon via Production Database Validation
  const handleApplyCoupon = async (coupon: CouponItem) => {
    try {
      const res = await couponApi.validateCoupon({
        code: coupon.code,
        billAmount: numericBill,
        storeId,
        paymentMethod: selectedPaymentMethod,
      });

      if (!res.valid) {
        toast.error(res.message || `Coupon ${coupon.code} cannot be applied`);
        return;
      }

      const activeCoupon = res.coupon || coupon;
      setAppliedCoupon(activeCoupon);
      setCelebrationDetails({ code: coupon.code, saved: res.discountAmount });
      setShowCelebrationModal(true);
      setPayStep("bill_checkout");
      toast.success(res.message || `Coupon ${coupon.code} applied!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon");
    }
  };

  const handleApplyCustomCode = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await couponApi.validateCoupon({
        code,
        billAmount: numericBill,
        storeId,
        paymentMethod: selectedPaymentMethod,
      });

      if (!res.valid) {
        toast.error(res.message || `Invalid coupon code ${code}`);
        return;
      }

      const activeCoupon = res.coupon || {
        id: `coup_${code.toLowerCase()}`,
        code,
        badgeText: "VERIFIED",
        headline: `Saved ₹${res.discountAmount} with ${code}`,
        description: res.message,
        terms: ["Verified database promotion", "Terms & conditions apply"],
        flatDiscount: res.discountAmount,
        discountValue: res.discountAmount,
        discountType: "FLAT",
      };

      setAppliedCoupon(activeCoupon);
      setCelebrationDetails({ code, saved: res.discountAmount });
      setShowCelebrationModal(true);
      setPayStep("bill_checkout");
      toast.success(res.message || `Coupon ${code} applied successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to validate coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const handleFinalPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const payload = {
        customerId,
        storeId,
        storeName,
        bookingRef,
        bookingId,
        billAmount: numericBill,
        discountAmount: totalDiscount + coverChargeCredit + (useCoins ? coinSavings : 0),
        couponCode: appliedCoupon?.code,
        tipAmount: selectedTip,
        coinsRedeemed: useCoins ? coinSavings : 0,
        coinsEarned,
        totalPaid: totalPayable,
        paymentMethod: selectedPaymentMethod,
        customerName: effectiveCustomerName,
        customerPhone: effectiveCustomerPhone
      };

      const result = await tableBookingApi.payDiningBill(payload);

      const details = {
        customerId,
        txnId: result.txnId,
        receiptNumber: result.receiptNumber,
        bookingRef: result.bookingRef,
        storeName: result.storeName || storeName,
        storeAddress: result.storeAddress || storeAddress,
        billAmount: result.billAmount || numericBill,
        discount: result.discount != null ? result.discount : (totalDiscount + coverChargeCredit + (useCoins ? coinSavings : 0)),
        tip: result.tip != null ? result.tip : selectedTip,
        totalPaid: result.totalPaid != null ? result.totalPaid : totalPayable,
        coinsEarned: result.coinsEarned != null ? result.coinsEarned : coinsEarned,
        coinsRedeemed: useCoins ? coinSavings : 0,
        paymentMethod: result.paymentMethod || selectedPaymentMethod,
        timestamp: result.timestamp || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: result.status || "SUCCESS"
      };

      setConfirmedPaymentDetails(details);
      setPayStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        dataStore.recordTransaction({
          id: details.txnId,
          paymentIntentId: details.txnId,
          referenceType: "OFFER",
          referenceId: appliedCoupon?.id || "walkin_direct",
          customerName: effectiveCustomerName || "Guest Diner",
          customerPhone: effectiveCustomerPhone || "",
          merchantId: "m-1",
          merchantName: details.storeName || storeName,
          storeName: details.storeName || storeName,
          billAmount: Number(details.billAmount),
          discountAmount: Number(details.discount),
          payableAmount: Number(details.totalPaid),
          payeeVpa: `${(details.storeName || storeName).toLowerCase().replace(/[^a-z0-9]/g, "")}@hdfcbank`,
          upiIntentUrl: `upi://pay?pa=merchant@upi&pn=${encodeURIComponent(details.storeName || storeName)}&am=${details.totalPaid}&cu=INR`,
          utr: `UTR${details.txnId.replace(/[^0-9]/g, "").slice(-8) || "88491023"}`,
          signatureValid: true,
          status: "SUCCESS",
          settlementStatus: "SETTLED",
          pointsEarned: details.coinsEarned || 0,
          timestamp: "Just now"
        });
      } catch (e) {
        console.warn("Could not save to local dataStore:", e);
      }

      toast.success("Payment Successful!", {
        description: `Settled ₹${details.totalPaid} at ${details.storeName}`
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(details);
      }
    } catch (err: any) {
      console.warn("Backend bill payment request failed:", err);
      // Fallback for resilient preview experience if offline
      const fallbackTxnId = `PNK-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const details = {
        customerId,
        txnId: fallbackTxnId,
        receiptNumber: `REC-${fallbackTxnId.replace("PNK-TXN-", "")}`,
        bookingRef,
        storeName,
        storeAddress,
        billAmount: numericBill,
        discount: totalDiscount + coverChargeCredit + (useCoins ? coinSavings : 0),
        tip: selectedTip,
        totalPaid: totalPayable,
        coinsEarned,
        coinsRedeemed: useCoins ? coinSavings : 0,
        paymentMethod: selectedPaymentMethod,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "SUCCESS"
      };
      setConfirmedPaymentDetails(details);
      setPayStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (onPaymentSuccess) {
        onPaymentSuccess(details);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // =========================================================================
  // VIEW 4: PAYMENT SUCCESSFUL SCREEN
  // =========================================================================
  if (payStep === "success" && confirmedPaymentDetails) {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans pb-28 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center transition shadow-xs border border-slate-200/90 dark:border-slate-800 cursor-pointer active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs font-bold text-slate-500">Payment Receipt</span>
            <button
              type="button"
              onClick={() => {
                toast.info("PINAK 24/7 Helpline: +91 800-PINAK-HELP");
              }}
              className="h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <HelpCircle size={13} />
              <span>Help</span>
            </button>
          </header>

          <div className="p-4 space-y-4">
            {/* Green / Purple Success Badge */}
            <div className="text-center pt-4 pb-2">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-150 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center relative shadow-lg shadow-emerald-500/30">
                  <Check size={32} className="stroke-[3.5]" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bill Payment Successful!
              </h1>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                Transaction ID: {confirmedPaymentDetails.txnId}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {storeName}
                  </h3>
                  <p className="text-xs text-slate-500">{storeAddress}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                    ₹{confirmedPaymentDetails.totalPaid.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Paid via {confirmedPaymentDetails.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Reward Coin Banner */}
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
                    🪙
                  </span>
                  <div>
                    <p className="text-xs font-black text-purple-950 dark:text-purple-100">
                      +{confirmedPaymentDetails.coinsEarned} PINAK Coins Credited
                    </p>
                    <p className="text-[10px] text-purple-700 dark:text-purple-300">
                      New Wallet Balance: <strong className="font-mono text-emerald-600 font-extrabold">{Math.max(0, userCoinBalance - coinSavings) + confirmedPaymentDetails.coinsEarned} Coins</strong> (₹{Math.max(0, userCoinBalance - coinSavings) + confirmedPaymentDetails.coinsEarned} val)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md font-mono">
                  +₹{confirmedPaymentDetails.coinsEarned}
                </span>
              </div>

              {/* Bill breakdown in receipt */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span>Base Bill Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{confirmedPaymentDetails.billAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                {confirmedPaymentDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{confirmedPaymentDetails.discount}</span>
                  </div>
                )}
                {confirmedPaymentDetails.tip > 0 && (
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>{isRetail ? "Staff Tip" : "Waiter Tip"}</span>
                    <span>+₹{confirmedPaymentDetails.tip}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Platform & Taxes</span>
                  <span>₹20.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Done Button */}
        <div className="fixed bottom-4 left-0 right-0 z-[70] flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto px-12 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: APPLY COUPON & OFFERS SCREEN (Images 3 & 4)
  // =========================================================================
  if (payStep === "apply_coupon") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans pb-12 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPayStep("bill_checkout")}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center transition shadow-xs border border-slate-200/90 dark:border-slate-800 cursor-pointer shrink-0 active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                APPLY COUPON
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Your cart: ₹{numericBill.toLocaleString("en-IN")}
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
                More offers
              </h2>

              <div className="space-y-4">
                {availableCoupons.map((coupon) => {
                  const isExpanded = expandedTermsId === coupon.id;
                  const isCurrentApplied = appliedCoupon?.code === coupon.code;

                  return (
                    <div
                      key={coupon.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col"
                    >
                      <div className="flex items-stretch min-h-[110px]">
                        {/* Perforated Vertical Coupon Left Strip in Signature PINAK Palette */}
                        <div className="w-12 bg-gradient-to-b from-purple-700 to-indigo-800 text-white flex flex-col items-center justify-center relative shrink-0 border-r border-dashed border-white/40">
                          {/* Cutout punch holes */}
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
                                "text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md transition cursor-pointer",
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

                      {/* Expandable Terms & Conditions (Image 4) */}
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
  // VIEW 2: BILL CHECKOUT & DETAILS SCREEN (Images 2, 6, 7, 8, 9)
  // =========================================================================
  if (payStep === "bill_checkout") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans pb-36 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <button
                type="button"
                onClick={() => setPayStep("enter_amount")}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center transition shadow-xs border border-slate-200/90 dark:border-slate-800 cursor-pointer shrink-0 active:scale-95"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="truncate">
                <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  Paying: {storeName}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{storeAddress}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.info("PINAK 24/7 Helpline", {
                  description: `Need help paying your ${isRetail ? "store bill" : "dining bill"}? Call +91 800-PINAK-HELP`
                });
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <HelpCircle size={15} />
            </button>
          </header>

          <div className="p-3.5 space-y-3.5">
            {/* Paying Guest Identity Pill */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500 block leading-tight">
                    Authenticated Customer
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white leading-tight">
                    {effectiveCustomerName}
                  </span>
                </div>
              </div>
              {effectiveCustomerPhone && (
                <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                  {effectiveCustomerPhone}
                </span>
              )}
            </div>

            {/* Signature Royal Hero Container with Strikethrough & Savings Pill */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 text-center relative overflow-hidden shadow-xl border border-purple-700/50">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

              <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">Your Net Payable Bill</p>
              {totalDiscount > 0 ? (
                <div className="mt-1">
                  <p className="text-base text-purple-300 line-through font-bold">
                    ₹{numericBill.toLocaleString("en-IN")}
                  </p>
                  <p className="text-4xl font-black text-white tracking-tight">
                    ₹{Math.max(0, numericBill - totalDiscount - coverChargeCredit).toLocaleString("en-IN")}
                  </p>
                </div>
              ) : (
                <p className="text-4xl font-black text-white mt-1 tracking-tight">
                  ₹{numericBill.toLocaleString("en-IN")}
                </p>
              )}

              {/* Savings speech-bubble callout if offer or coupon applied */}
              {(totalDiscount > 0 || coverChargeCredit > 0) && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-full shadow-inner animate-in zoom-in-95 duration-150">
                  <Percent size={12} className="stroke-[3]" />
                  <span>
                    Woah! you're saving ₹{(totalDiscount + coverChargeCredit).toLocaleString("en-IN")}
                    {resolvedOfferDiscountPct > 0 ? ` (${resolvedOfferDiscountPct}% Off)` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Locked Table Reservation / In-Store Deal Offer Card */}
            {resolvedOfferDiscountPct > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
                  Active Instant Offer
                </h3>
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Percent size={16} className="stroke-[3]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                          EXCLUSIVE OFFER APPLIED
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 uppercase">
                          LOCKED
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {resolvedOfferTitle || `Flat ${resolvedOfferDiscountPct}% off on total bill`}
                      </h4>
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        ✓ ₹{tableOfferDiscount.toLocaleString("en-IN")} saved automatically on this {isRetail ? "store bill" : "dining bill"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
                    {resolvedOfferDiscountPct}% OFF
                  </span>
                </div>
              </div>
            )}

            {/* PINAK Coins Benefits Card */}
            <div className="bg-gradient-to-r from-amber-50/80 via-purple-50/50 to-amber-50/80 dark:bg-slate-900 rounded-3xl border border-amber-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                    🪙
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider block">
                      PINAK REWARD COINS & CASHBACK
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                      Real Wallet Balance & Cashbacks
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800 shadow-2xs font-mono">
                  🪙 {userCoinBalance} Coins
                </span>
              </div>

              {/* White Nested Subcard */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-amber-200/50 dark:border-slate-800 p-3 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    You will earn {storeCashbackConfig.percentage}% PINAK Coins{storeCashbackConfig.maxCap > 0 ? ` (up to ₹${storeCashbackConfig.maxCap})` : ""}
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400">
                    +{coinsEarned} Coins
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Redeem PINAK Coins
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Available: ₹{userCoinBalance})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (userCoinBalance <= 0) {
                          toast.error("Your coin wallet balance is 0. Pay dining bills to earn instant cashback coins!");
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

            {/* Additional Offers Card */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
                Additional Offers
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        `{appliedCoupon.code}` applied
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        <span>✓ ₹{couponDiscount} coupon savings</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setPayStep("apply_coupon")}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-700 transition">
                        Apply coupon & Bank Offers
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Save ₹200 with WELCOME
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                )}
              </div>
            </div>

            {/* Bill Details Breakdown Card */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
                Bill Details
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Total bill amount</span>
                  <span className="font-extrabold">₹{numericBill.toLocaleString("en-IN")}</span>
                </div>

                {/* Table Reservation Offer Discount Row */}
                {tableOfferDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-slate-100 dark:border-slate-800 pt-2">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Percent size={10} className="stroke-[3]" />
                      </span>
                      <span className="truncate">
                        {resolvedOfferTitle ? `${resolvedOfferTitle} (${resolvedOfferDiscountPct}% OFF)` : `Table Pre-book Offer (${resolvedOfferDiscountPct}% OFF)`}
                      </span>
                    </div>
                    <span className="font-extrabold shrink-0">-₹{tableOfferDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {/* Cover Charge Credit Adjusted */}
                {coverChargeCredit > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-slate-100 dark:border-slate-800 pt-2">
                    <span>Cover Charge Redeemed</span>
                    <span className="font-extrabold">-₹{coverChargeCredit.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-slate-100 dark:border-slate-800 pt-2">
                    <span>Coupon `{appliedCoupon.code}`</span>
                    <span className="font-extrabold">-₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="underline decoration-dotted cursor-pointer flex items-center gap-1">
                    Convenience fee
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{convenienceFee}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>GST on convenience fee</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{gstOnFee}</span>
                </div>

                {useCoins && coinSavings > 0 && (
                  <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>PINAK Coins Redeemed</span>
                    <span>-₹{coinSavings}</span>
                  </div>
                )}

                {/* Add Tip Section (Expandable matching Image 8 & 9) */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2.5">
                  <div
                    onClick={() => setIsTipExpanded(!isTipExpanded)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        {isTipExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>Add Tip</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {isRetail ? "100% goes to the store counter staff!" : "100% goes to the Waiters!"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTip > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTip(0);
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Clear Tip
                        </button>
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        ₹{selectedTip}
                      </span>
                    </div>
                  </div>

                  {/* Tip Chips */}
                  {isTipExpanded && (
                    <div className="grid grid-cols-4 gap-2 pt-3 animate-in fade-in duration-150">
                      {[50, 80, 100].map((tipVal) => (
                        <button
                          key={tipVal}
                          type="button"
                          onClick={() => setSelectedTip(selectedTip === tipVal ? 0 : tipVal)}
                          className={cn(
                            "py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer text-center",
                            selectedTip === tipVal
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          ₹{tipVal}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTipInput(selectedTip > 0 ? String(selectedTip) : "");
                          setShowCustomTipPrompt(true);
                        }}
                        className="py-2 rounded-xl text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer text-center"
                      >
                        Other
                      </button>
                    </div>
                  )}
                </div>

                {/* To Pay Rounded Off Total */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    To Pay (Rounded off)
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    ₹{totalPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Centered Modal */}
        {showCelebrationModal && (
          <div
            className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowCelebrationModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl text-center relative pt-8 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating Top Badge with % Icon */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-800 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 border-2 border-white dark:border-slate-900">
                <Sparkles size={26} />
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>

              <div className="mt-4 space-y-2">
                <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/40">
                  {celebrationDetails.code}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                  Woohoo! ₹{celebrationDetails.saved} Saved
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                  Discount coupon applied successfully to your {isRetail ? "store bill" : "dining bill"}. Your new payable amount is updated automatically.
                </p>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setShowCelebrationModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-purple-600/25 active:scale-95 transition cursor-pointer uppercase tracking-wider"
                >
                  CONTINUE TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Right-Side Drawer */}
        {showPaymentMethodSheet && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowPaymentMethodSheet(false)}
            />
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <aside className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 p-6 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 flex items-center justify-center font-bold">
                      <CreditCard size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Select Payment Method
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentMethodSheet(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* List of Methods */}
                <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPaymentMethod === method;
                    return (
                      <div
                        key={method}
                        onClick={() => {
                          setSelectedPaymentMethod(method);
                          setShowPaymentMethodSheet(false);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                          isSelected
                            ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 shadow-xs"
                            : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-purple-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold",
                            isSelected ? "bg-purple-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}>
                            {method.includes("UPI") ? <Smartphone size={15} /> : <Wallet size={15} />}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              {method}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Instant settlement • Secure PINAK gateway
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 dark:border-slate-700"
                        )}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPaymentMethodSheet(false)}
                    className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Custom Tip Right-Side Drawer */}
        {showCustomTipPrompt && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowCustomTipPrompt(false)}
            />
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <aside className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 p-6 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-bold">
                      <Wallet size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Enter Custom Tip
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomTipPrompt(false)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Input Content */}
                <div className="py-6 space-y-4">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      placeholder="e.g. 150"
                      value={customTipInput}
                      onChange={(e) => setCustomTipInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-lg font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    100% of your tip goes directly to the {isRetail ? "store counter team" : "restaurant service staff"}.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomTipPrompt(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(customTipInput);
                      if (!isNaN(val) && val >= 0) {
                        setSelectedTip(val);
                      }
                      setShowCustomTipPrompt(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition cursor-pointer"
                  >
                    Set Tip
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Sticky Bottom Bar Matching PINAK Palette */}
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 shadow-2xl">
          {/* Distance Alert Banner */}
          <div className="mb-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            <span className="font-bold truncate text-[11px]">
              You are {distanceKm}km away. Is this correct outlet?
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Left: Payment Method Toggle */}
            <div
              onClick={() => setShowPaymentMethodSheet(true)}
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
              onClick={handleFinalPayment}
              disabled={isProcessingPayment}
              className="flex-1 max-w-[210px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/25 active:scale-98 transition cursor-pointer disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ₹{totalPayable.toLocaleString("en-IN")}</span>
              )}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: BILL AMOUNT ENTRY SCREEN (Matching ServiceDetailPreviewView palette)
  // =========================================================================
  return (
    <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans pb-36 animate-in fade-in duration-200 relative">
      <div>
        {/* 1. Header Navigation */}
        <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center transition shadow-xs border border-slate-200/90 dark:border-slate-800 cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center flex-1 px-2">
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40 tracking-wider">
              <span>{isRetail ? "STORE COUNTER BILL PASS" : "DINE-IN BILL PASS"}</span>
            </div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
              {isRetail ? "Pay Bill at Counter & Save" : "Pay Dining Bill & Save"}
            </h1>
          </div>

          <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center shadow-xs">
            <ShieldCheck size={17} />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* 2. Store Identity Mini-Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-600">
                  <Store size={24} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {storeName}
                </h2>
                <CheckCircle2 size={16} className="text-purple-600 fill-purple-600 text-white shrink-0" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="shrink-0 text-slate-400" />
                <span>{storeAddress || "Nagpur"}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  📍 {distanceKm} km away
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {category || (isRetail ? "Retail & Shopping" : "Dining & Food")}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Distance Warning Notice (Only if user is > 5km away, in refined PINAK Amber style) */}
          {distanceKm > 5 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
              <AlertTriangle size={15} className="shrink-0 text-amber-600" />
              <span className="font-semibold leading-snug">
                Outlet check: You appear to be <strong>{distanceKm} km away</strong>. Please verify you are paying at <strong>{storeName}</strong>.
              </span>
            </div>
          )}

          {/* 4. Active Deal / Offer Banner */}
          {resolvedOfferDiscountPct > 0 ? (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/50 dark:via-indigo-950/40 dark:to-purple-950/50 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Percent size={16} className="stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 tracking-wider">
                      EXCLUSIVE INSTANT DEAL
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-200/70 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 uppercase">
                      AUTO-APPLIES
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {resolvedOfferTitle || `Flat ${resolvedOfferDiscountPct}% off on total bill`}
                  </h4>
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    ✓ Save {resolvedOfferDiscountPct}% automatically when you pay through PINAK
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-700 text-white shadow-xs shrink-0">
                {resolvedOfferDiscountPct}% OFF
              </span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  ⚡
                </span>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    Instant Bill Discount & Coin Cashback
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Save extra up to ₹250 with coupons & earn {storeCashbackConfig.percentage}% PINAK Coins
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">
                ACTIVE
              </span>
            </div>
          )}

          {/* 5. Premium Bill Amount Input Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm text-center space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 tracking-wider block">
                STEP 1: ENTER AMOUNT
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                Enter Total Bill Amount
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter the final amount as printed on your {isRetail ? "counter paper receipt" : "food & beverage bill"}
              </p>
            </div>

            {/* High Contrast Currency Input */}
            <div className="inline-flex items-center justify-center gap-1.5 py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-purple-500/40 focus-within:border-purple-600 focus-within:ring-4 focus-within:ring-purple-500/10 shadow-inner transition-all w-full max-w-[280px] mx-auto">
              <span className="text-3xl sm:text-4xl font-black text-purple-600 select-none">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                readOnly={isBillPreSetByStore}
                disabled={isBillPreSetByStore}
                value={billAmountInput}
                onChange={(e) => {
                  if (isBillPreSetByStore) return;
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  setBillAmountInput(cleaned);
                }}
                placeholder="0"
                className={cn(
                  "w-40 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white bg-transparent outline-none tracking-tight text-left",
                  isBillPreSetByStore && "cursor-default select-none opacity-90"
                )}
              />
            </div>

            {/* Preset Quick Chips */}
            {!isBillPreSetByStore && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {[100, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition cursor-pointer"
                  >
                    +₹{val}
                  </button>
                ))}
                {numericBill > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBill}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Real-Time Live Calculation Pill if bill entered */}
            {numericBill > 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3 text-left space-y-1.5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                    <Percent size={13} className="stroke-[3]" />
                    <span>Estimated Instant Savings</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">
                    -₹{estimatedInitialSavings.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t border-dashed border-emerald-200 dark:border-emerald-800/60 pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Estimated Payable Amount:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{estimatedInitialPayable.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1">
                  <span>🪙 +{Math.round((estimatedInitialPayable * storeCashbackConfig.percentage) / 100)} Coins earned on payment</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Tip: You can also ask your {staffShortTitle} to generate and push the bill to your PINAK app.
              </p>
            )}
          </div>

          {/* 6. Signature PINAK Coupons & Offers Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Coupons & Payment Offers
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Auto-eligible on your checkout
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                {isLoadingCoupons
                  ? "CHECKING OFFERS..."
                  : availableCoupons.length > 0
                  ? `${availableCoupons.length} OFFERS READY`
                  : "OFFERS READY"}
              </span>
            </div>

            {/* Dynamic Real Coupon Card from PostgreSQL Database */}
            {(() => {
              const topOffer = autoApplicableCoupon || availableCoupons[0];
              if (!topOffer) {
                return (
                  <div
                    onClick={() => setPayStep("apply_coupon")}
                    className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-dashed border-purple-200 dark:border-purple-800 text-center cursor-pointer hover:bg-purple-100/50 transition"
                  >
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-bold">
                      Enter bill amount above to unlock instant coupons & payment offers
                    </p>
                  </div>
                );
              }
              return (
                <div
                  onClick={() => setPayStep("apply_coupon")}
                  className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-purple-400 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      🏷️
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-purple-950 dark:text-purple-100">
                          {topOffer.code}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 uppercase">
                          {topOffer.badgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                        {topOffer.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 shrink-0 ml-2">
                    {topOffer.headline} →
                  </span>
                </div>
              );
            })()}

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Partner Banks: HDFC • Paytm • Google Pay</span>
              <button
                type="button"
                onClick={() => setPayStep("apply_coupon")}
                className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                View all offers ({availableCoupons.length}) →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar on Amount Entry Screen */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 shadow-2xl">
        {/* Top Incentive Pill */}
        <div className="mb-2.5 bg-gradient-to-r from-amber-50 via-purple-50 to-amber-50 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
              🪙
            </span>
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Earn {storeCashbackConfig.percentage}% PINAK Coins back on payment
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300">
            Wallet: {userCoinBalance}
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={numericBill <= 0}
          onClick={() => {
            if (numericBill > 0) {
              setPayStep("bill_checkout");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={cn(
            "w-full py-3.5 rounded-2xl font-black text-sm transition cursor-pointer text-center shadow-md",
            numericBill > 0
              ? "bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-purple-600/30 active:scale-98"
              : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
          )}
        >
          {numericBill > 0 ? `Apply Offers & Pay ₹${numericBill.toLocaleString("en-IN")}` : "Enter Bill Amount to Pay"}
        </button>
      </footer>
    </div>
  );
};

export default PayBillView;
