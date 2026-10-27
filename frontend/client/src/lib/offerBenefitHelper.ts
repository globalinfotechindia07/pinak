import { Offer } from "../types";

export interface OfferBenefitInfo {
  typeKey: "FLAT_PCT" | "FLAT_AMT" | "BOGO" | "CASHBACK";
  structureName: string;
  shortLabel: string;
  dealBadge: string;
  capLabel: string;
  badgeClass: string;
  iconName: "Tag" | "Coins" | "Sparkles" | "Zap";
  description: string;
}

export function getOfferBenefitInfo(offer: Partial<Offer> | any): OfferBenefitInfo {
  const rawType = String(offer?.type || offer?.offerType || "").toUpperCase();
  const val = Number(offer?.value) || 0;
  const maxCap =
    offer?.maxDiscount != null
      ? Number(offer.maxDiscount)
      : offer?.maxDiscountAmount != null
      ? Number(offer.maxDiscountAmount)
      : null;
  const buyQty = Number(offer?.buyQuantity) || 1;
  const getQty = Number(offer?.getQuantity) || 1;

  if (rawType === "FLAT_PCT" || rawType === "PERCENTAGE" || rawType === "PERCENTAGE_DISCOUNT") {
    return {
      typeKey: "FLAT_PCT",
      structureName: "Percentage OFF",
      shortLabel: "% Discount",
      dealBadge: `${val}% OFF`,
      capLabel: maxCap && maxCap > 0 ? `Max Cap ₹${maxCap}` : "No Max Cap",
      badgeClass:
        "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/70 dark:border-pink-900/40",
      iconName: "Tag",
      description: `${val}% discount on total bill (Max Cap: ₹${maxCap || "None"})`,
    };
  }

  if (rawType === "FLAT_AMT" || rawType === "FIXED" || rawType === "FIXED_DISCOUNT") {
    return {
      typeKey: "FLAT_AMT",
      structureName: "Flat Rupee (₹)",
      shortLabel: "Flat Rupee",
      dealBadge: `Flat ₹${val} OFF`,
      capLabel: "Flat Cash Deduction",
      badgeClass:
        "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/40",
      iconName: "Coins",
      description: `Instant flat ₹${val} deducted from your bill`,
    };
  }

  if (rawType === "BOGO" || rawType === "BUY_X_GET_Y" || rawType === "BUY_ONE_GET_ONE") {
    return {
      typeKey: "BOGO",
      structureName: "Buy X Get Y Free",
      shortLabel: "BOGO Deal",
      dealBadge: `Buy ${buyQty} Get ${getQty} Free`,
      capLabel: `${getQty} Free Item${getQty > 1 ? "s" : ""}`,
      badgeClass:
        "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/40",
      iconName: "Sparkles",
      description: `Buy ${buyQty} item${buyQty > 1 ? "s" : ""} and get ${getQty} item${getQty > 1 ? "s" : ""} completely free`,
    };
  }

  // CASHBACK
  return {
    typeKey: "CASHBACK",
    structureName: "Wallet Cashback",
    shortLabel: "Cashback",
    dealBadge: `${val}% Cashback`,
    capLabel: maxCap && maxCap > 0 ? `Max ₹${maxCap} Cap` : "+Reward Coins",
    badgeClass:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-900/40",
    iconName: "Zap",
    description: `${val}% cashback credited to PINAK wallet in reward coins (Max: ₹${maxCap || 150})`,
  };
}
