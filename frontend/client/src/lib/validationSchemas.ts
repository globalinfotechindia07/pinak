import { z } from "zod";

// Standard Indian Regex Patterns
export const INDIAN_PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Enterprise validation schema for Merchant Onboarding (Drawer & Registration).
 */
export const merchantOnboardingSchema = z
  .object({
    businessName: z
      .string()
      .min(2, "Brand / Business name must be at least 2 characters")
      .max(255, "Brand name must not exceed 255 characters")
      .regex(/^[a-zA-Z0-9\s&.,'\-_/()]+$/, "Brand name contains invalid characters"),
    legalEntityName: z
      .string()
      .max(255, "Legal entity name must not exceed 255 characters")
      .optional()
      .or(z.literal("")),
    categoryName: z.string().min(1, "Please select a primary category"),
    state: z.string().min(1, "Please select an Indian state").default("Maharashtra"),
    district: z.string().min(1, "Please select an administrative district").default("Nagpur"),
    city: z.string().min(2, "City name must be at least 2 characters"),
    ownerName: z
      .string()
      .min(2, "Owner name must be at least 2 characters")
      .max(100, "Owner name must not exceed 100 characters"),
    ownerEmail: z
      .string()
      .min(1, "Owner work email is required")
      .email("Please enter a valid work email address"),
    ownerPhone: z
      .string()
      .min(1, "Contact phone is required")
      .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit Indian phone number"),
    gstin: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || GSTIN_REGEX.test(val.trim().toUpperCase()), {
        message: "Invalid GSTIN format (e.g. 27AABCU9603R1ZM)",
      }),
    pan: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || PAN_REGEX.test(val.trim().toUpperCase()), {
        message: "Invalid PAN format (e.g. AABCU9603R)",
      }),
    bankUpiId: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || UPI_VPA_REGEX.test(val.trim()), {
        message: "Invalid UPI VPA format (e.g. brand@icici)",
      }),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    confirmBankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    commissionRate: z
      .number({ message: "Platform take-rate must be a number" })
      .min(0, "Take-rate cannot be negative")
      .max(100, "Take-rate cannot exceed 100%"),
    provisionBranch: z.boolean().default(true),
    branchName: z.string().optional(),
    branchAddress: z.string().optional(),
    branchState: z.string().optional(),
    branchDistrict: z.string().optional(),
    branchCity: z.string().optional(),
    branchPincode: z.string().optional(),
    operatingHours: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provisionBranch) {
      if (!data.branchName || data.branchName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchName"],
          message: "Branch name must be at least 2 characters",
        });
      }
      if (!data.branchAddress || data.branchAddress.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchAddress"],
          message: "Street address must be at least 5 characters",
        });
      }
      if (!data.branchState || data.branchState.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchState"],
          message: "Please select store branch state",
        });
      }
      if (!data.branchDistrict || data.branchDistrict.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchDistrict"],
          message: "Please select store branch district",
        });
      }
      if (!data.branchCity || data.branchCity.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchCity"],
          message: "Please select or enter store branch city",
        });
      }
      if (!data.branchPincode || !INDIAN_PINCODE_REGEX.test(data.branchPincode.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchPincode"],
          message: "Please enter a valid 6-digit Indian PIN code",
        });
      }
    }
  });

export type MerchantOnboardingFormValues = z.infer<typeof merchantOnboardingSchema>;

/**
 * Enterprise validation schema for Store Branch Creation (Slide-over drawer).
 */
export const storeBranchSchema = z.object({
  merchantId: z.string().min(1, "Please select parent merchant brand"),
  branchName: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(255, "Branch name must not exceed 255 characters"),
  address: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(512, "Address cannot exceed 512 characters"),
  state: z.string().min(2, "Please select state"),
  district: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City name must be at least 2 characters"),
  pincode: z
    .string()
    .regex(INDIAN_PINCODE_REGEX, "Please enter a valid 6-digit Indian PIN code"),
  latitude: z
    .number({ message: "Latitude must be a valid number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ message: "Longitude must be a valid number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || INDIAN_PHONE_REGEX.test(val.trim()), {
      message: "Please enter a valid 10-digit Indian phone number",
    }),
  operatingHours: z.string().optional(),
});

export type StoreBranchFormValues = z.infer<typeof storeBranchSchema>;

/**
 * Enterprise validation schema for Offer Campaign Creation & Governance.
 */
export const offerCampaignSchema = z
  .object({
    title: z
      .string()
      .min(3, "Offer title must be at least 3 characters")
      .max(255, "Title must not exceed 255 characters"),
    tagline: z.string().max(255, "Tagline cannot exceed 255 characters").optional(),
    type: z.enum(["FLAT_INR", "FLAT_PCT", "CASHBACK", "FLAT_AMT", "BOGO"], {
      message: "Please select an offer discount type",
    }),
    value: z
      .number({ message: "Discount value must be a number" })
      .positive("Discount value must be greater than zero"),
    maxDiscount: z
      .number({ message: "Max cap must be a number" })
      .min(0, "Max cap cannot be negative")
      .optional(),
    minBillAmount: z
      .number({ message: "Min bill amount must be a number" })
      .min(0, "Minimum bill amount cannot be negative"),
    perUserLimit: z
      .number({ message: "Per-user limit must be a number" })
      .min(1, "Per-user redemption limit must be at least 1")
      .optional()
      .nullable(),
    maxTotalRedemptions: z
      .number({ message: "Total redemptions cap must be a number" })
      .min(1, "Campaign usage limit must be at least 1")
      .optional()
      .nullable(),
    storeScope: z.enum(["ALL", "SPECIFIC"]).default("ALL"),
    applicableStoreIds: z.array(z.string()).optional(),
    validFrom: z.string().optional(),
    validTo: z.string().min(1, "Please select campaign end date"),
    activeDays: z.array(z.string()).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    redemptionMethod: z.enum(["AUTO_APPLIED", "PROMO_CODE"]).default("AUTO_APPLIED"),
    promoCode: z.string().optional(),
    imageUrl: z.string().optional(),
    terms: z.string().max(2000, "Terms cannot exceed 2000 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "FLAT_PCT") {
      if (data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Percentage discount cannot exceed 100%",
        });
      }
      if (!data.maxDiscount || data.maxDiscount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxDiscount"],
          message: "Maximum discount cap (₹) is mandatory for percentage deals",
        });
      }
    }
    if (data.redemptionMethod === "PROMO_CODE" && (!data.promoCode || data.promoCode.trim().length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoCode"],
        message: "Promo code is required (min 3 characters, e.g. PINAK50)",
      });
    }
    if (data.validFrom && data.validTo && new Date(data.validTo) < new Date(data.validFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validTo"],
        message: "End date must be on or after start date",
      });
    }
  });

export type OfferCampaignFormValues = z.infer<typeof offerCampaignSchema>;
