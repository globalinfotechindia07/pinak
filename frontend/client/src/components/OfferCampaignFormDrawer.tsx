import React, { useState } from "react";
import {
  TicketPercent,
  X,
  ShieldCheck,
  Calendar,
  Clock,
  Building2,
  Store as StoreIcon,
  Tag,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Coins,
  Lock,
  Check
} from "lucide-react";
import { Offer, Store, Merchant } from "../types";
import { offerCampaignSchema } from "../lib/validationSchemas";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export interface OfferCampaignFormDrawerProps {
  merchants?: Merchant[];
  stores?: Store[];
  merchantId?: string;
  merchantName?: string;
  onClose: () => void;
  onSave: (draft: Partial<Offer>) => void;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const OfferCampaignFormDrawer: React.FC<OfferCampaignFormDrawerProps> = ({
  merchants = [],
  stores = [],
  merchantId: propMerchantId = "",
  merchantName: propMerchantName = "",
  onClose,
  onSave
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState(
    propMerchantId || (merchants.length > 0 ? merchants[0].id : "")
  );

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);
  const merchantName = propMerchantName || selectedMerchant?.businessName || "Partner Brand";

  // Form Fields State
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO">("FLAT_PCT");
  const [value, setValue] = useState(20);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(200);
  const [minBillAmount, setMinBillAmount] = useState(500);
  const [perUserLimit, setPerUserLimit] = useState<number | undefined>(1);
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState<number | undefined>(500);
  
  // Store Scope
  const [storeScope, setStoreScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Dates & Schedule
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validTo, setValidTo] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [activeDays, setActiveDays] = useState<string[]>([
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  ]);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("22:00");
  const [enableHappyHours, setEnableHappyHours] = useState(false);

  // Redemption Method & Discovery
  const [redemptionMethod, setRedemptionMethod] = useState<"AUTO_APPLIED" | "PROMO_CODE">("AUTO_APPLIED");
  const [promoCode, setPromoCode] = useState("PINAK50");
  const [imageUrl, setImageUrl] = useState("");
  const [terms, setTerms] = useState("Valid on all dine-in and takeaway orders above minimum bill amount.");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Relevant Stores for chosen merchant
  const availableStores = stores.filter(
    (s) => !selectedMerchantId || s.merchantId === selectedMerchantId || selectedMerchantId === "m-1"
  );

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const toggleStore = (sId: string) => {
    if (selectedStoreIds.includes(sId)) {
      setSelectedStoreIds(selectedStoreIds.filter((id) => id !== sId));
    } else {
      setSelectedStoreIds([...selectedStoreIds, sId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = offerCampaignSchema.safeParse({
      title: title.trim(),
      tagline: tagline.trim(),
      type,
      value: Number(value),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minBillAmount: Number(minBillAmount),
      perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      maxTotalRedemptions: maxTotalRedemptions ? Number(maxTotalRedemptions) : undefined,
      storeScope,
      applicableStoreIds: storeScope === "SPECIFIC" ? selectedStoreIds : [],
      validFrom,
      validTo,
      activeDays,
      startTime: enableHappyHours ? startTime : undefined,
      endTime: enableHappyHours ? endTime : undefined,
      redemptionMethod,
      promoCode: redemptionMethod === "PROMO_CODE" ? promoCode.trim().toUpperCase() : undefined,
      imageUrl: imageUrl.trim(),
      terms: terms.trim(),
    });

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(parseResult.error.issues[0]?.message || "Please fix validation errors");
      return;
    }

    setErrors({});
    onSave({
      merchantId: selectedMerchantId || propMerchantId || "m-1",
      merchantName,
      storeId: storeScope === "ALL" ? "all" : selectedStoreIds[0] || "all",
      applicableStoreIds: storeScope === "SPECIFIC" ? selectedStoreIds : [],
      title: title.trim(),
      tagline: tagline.trim(),
      type,
      value: Number(value),
      maxDiscount: type === "FLAT_PCT" ? Number(maxDiscount) : undefined,
      minBillAmount: Number(minBillAmount),
      perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      maxTotalRedemptions: maxTotalRedemptions ? Number(maxTotalRedemptions) : undefined,
      validFrom,
      validTo,
      activeDays,
      startTime: enableHappyHours ? startTime : undefined,
      endTime: enableHappyHours ? endTime : undefined,
      redemptionMethod,
      promoCode: redemptionMethod === "PROMO_CODE" ? promoCode.trim().toUpperCase() : undefined,
      imageUrl: imageUrl.trim(),
      terms: terms.trim(),
      status: "PENDING_APPROVAL",
    });

    toast.success(`Campaign "${title}" created and submitted for approval!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <TicketPercent size={18} className="text-pink-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Campaign Offer</h3>
                <p className="text-[11px] text-slate-400">Configure financial caps, targeting & fraud protection</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Merchant Brand Selector if Admin */}
            {merchants.length > 0 && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Parent Merchant Brand *
                </label>
                <select
                  value={selectedMerchantId}
                  onChange={(e) => {
                    setSelectedMerchantId(e.target.value);
                    setSelectedStoreIds([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.businessName} ({m.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campaign Title & Teaser Tagline */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError("title");
                  }}
                  placeholder="e.g. 50% Off Weekend Feast"
                  className={cn(
                    "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden",
                    errors.title ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-pink-500"
                  )}
                />
                {errors.title && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Short Teaser Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Save up to ₹250 on fine dining delicacies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Discount Rules & Max Cap (Financial Protection) */}
            <div className="p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200/80 dark:border-pink-900/40 space-y-3">
              <label className="font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1.5 text-xs">
                <Coins size={14} className="text-pink-600" />
                <span>Financial Discount Rules & Caps (P0 Protection)</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="FLAT_PCT">Percentage Discount (%)</option>
                    <option value="FLAT_AMT">Flat Amount (₹ Off)</option>
                    <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      setValue(parseFloat(e.target.value) || 0);
                      clearError("value");
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold font-mono focus:outline-hidden",
                      errors.value ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700"
                    )}
                  />
                  {errors.value && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.value}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Max Discount Cap (₹) {type === "FLAT_PCT" && "*"}</span>
                    {type === "FLAT_PCT" && (
                      <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase">Mandatory</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={maxDiscount || ""}
                    onChange={(e) => {
                      setMaxDiscount(e.target.value ? parseFloat(e.target.value) : undefined);
                      clearError("maxDiscount");
                    }}
                    placeholder={type === "FLAT_PCT" ? "e.g. 200" : "Optional"}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold font-mono focus:outline-hidden",
                      errors.maxDiscount ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700"
                    )}
                  />
                  {errors.maxDiscount && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.maxDiscount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Spend Requirement (₹) *
                  </label>
                  <input
                    type="number"
                    value={minBillAmount}
                    onChange={(e) => setMinBillAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits & Fraud Prevention */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3">
              <label className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-xs">
                <ShieldCheck size={14} className="text-purple-600" />
                <span>Per-Customer & Campaign Budget Limits</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Per-Customer Limit
                  </label>
                  <select
                    value={perUserLimit || 0}
                    onChange={(e) => setPerUserLimit(parseInt(e.target.value, 10) || undefined)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value={1}>1 time per user (Welcome Deal)</option>
                    <option value={3}>3 times per user</option>
                    <option value={5}>5 times per user</option>
                    <option value={10}>10 times per user</option>
                    <option value={0}>Unlimited Redemptions</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Campaign Budget Cap
                  </label>
                  <input
                    type="number"
                    value={maxTotalRedemptions || ""}
                    onChange={(e) => setMaxTotalRedemptions(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="e.g. 500 customers max"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Outlet Applicability Scope */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Store / Branch Applicability Target *
              </label>

              <div className="flex gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer flex-1 text-xs font-semibold">
                  <input
                    type="radio"
                    name="storeScope"
                    checked={storeScope === "ALL"}
                    onChange={() => setStoreScope("ALL")}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>All Outlets (Brand-Wide)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer flex-1 text-xs font-semibold">
                  <input
                    type="radio"
                    name="storeScope"
                    checked={storeScope === "SPECIFIC"}
                    onChange={() => setStoreScope("SPECIFIC")}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Specific Outlets Only</span>
                </label>
              </div>

              {storeScope === "SPECIFIC" && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Select Participating Stores:
                  </span>
                  {availableStores.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No stores found for selected merchant.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableStores.map((st) => (
                        <label
                          key={st.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                            selectedStoreIds.includes(st.id)
                              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 text-purple-700 dark:text-purple-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStoreIds.includes(st.id)}
                            onChange={() => toggleStore(st.id)}
                            className="rounded border-slate-300 text-purple-600"
                          />
                          <span className="truncate">{st.branchName} ({st.city})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Scheduling & Active Days */}
            <div className="space-y-3 pt-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                <Calendar size={14} className="text-indigo-500" />
                <span>Campaign Launch Schedule & Active Days</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Valid From (Start Date) *
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Valid To (Expiry Date) *
                  </label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => {
                      setValidTo(e.target.value);
                      clearError("validTo");
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-hidden",
                      errors.validTo ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700"
                    )}
                  />
                  {errors.validTo && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.validTo}
                    </p>
                  )}
                </div>
              </div>

              {/* Day-of-Week Active Checkboxes */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Active Days of the Week:
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {ALL_DAYS.map((day) => {
                    const active = activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "py-1.5 rounded-lg text-center font-bold text-[11px] transition-all border",
                          active
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Happy Hours Slot Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Time-of-day Slot (Happy Hours)</span>
                  <input
                    type="checkbox"
                    checked={enableHappyHours}
                    onChange={(e) => setEnableHappyHours(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600"
                  />
                </div>
                {enableHappyHours && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Start Slot</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">End Slot</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redemption Method & Customer Experience */}
            <div className="space-y-3 pt-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                <Sparkles size={14} className="text-pink-500" />
                <span>Redemption Method & Banner Image</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Redemption Mode *
                  </label>
                  <select
                    value={redemptionMethod}
                    onChange={(e) => setRedemptionMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="AUTO_APPLIED">Auto-Applied on Bill Scan</option>
                    <option value="PROMO_CODE">Promo Code Requirement</option>
                  </select>
                </div>

                {redemptionMethod === "PROMO_CODE" && (
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Promo Code String *
                    </label>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        clearError("promoCode");
                      }}
                      placeholder="e.g. PINAK50"
                      className={cn(
                        "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-extrabold uppercase focus:outline-hidden",
                        errors.promoCode ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700"
                      )}
                    />
                    {errors.promoCode && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.promoCode}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Campaign Banner Poster Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95"
            >
              Submit Campaign Offer
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
