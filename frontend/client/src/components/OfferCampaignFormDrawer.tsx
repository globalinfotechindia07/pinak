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
  Check,
  Zap,
  ShoppingBag,
  Utensils,
  Percent,
  Scissors,
  Dumbbell,
  Car,
  Gamepad2,
  Stethoscope,
  Shirt,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  Copy,
  Users,
  Armchair,
  Plus,
  Calculator,
  Wand2,
  RefreshCw,
  Headphones,
  HeartPulse,
  Package
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
  initialData?: Offer | null;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (draft: Partial<Offer>) => void;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STANDARD_SLOTS = [
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
  "09:30 PM",
  "10:00 PM"
];

const SEATING_AREA_OPTIONS = [
  "Indoor AC Dining",
  "Outdoor / Rooftop",
  "Balcony / Courtyard",
  "Private Dining Room (PDR)",
  "Lounge / Bar Counter"
];

const CURATED_IMAGES_BY_CATEGORY: Record<string, { label: string; url: string }[]> = {
  DINING: [
    { label: "District Dining", url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80" },
    { label: "Rooftop Romantic", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" },
    { label: "Royal Buffet", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" },
    { label: "Cafe & Beverages", url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80" }
  ],
  SALON: [
    { label: "Hair Spa Salon", url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80" },
    { label: "Luxury Massage", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
    { label: "Gentleman Grooming", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80" }
  ],
  FITNESS: [
    { label: "CrossFit & Gym", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
    { label: "Yoga & Pilates", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80" }
  ],
  AUTO: [
    { label: "Foam Car Detailing", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80" },
    { label: "Ceramic Coating", url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80" }
  ],
  GAMING: [
    { label: "Bowling Alley", url: "https://images.unsplash.com/photo-1538388149542-5e24932d11a8?auto=format&fit=crop&w=800&q=80" },
    { label: "VR Gaming Arena", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80" }
  ],
  HEALTH: [
    { label: "Dental Studio", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" },
    { label: "Health Wellness", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80" }
  ],
  CLEANING: [
    { label: "Home Sanitization", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80" }
  ],
  RETAIL: [
    { label: "Grocery & Mart", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
    { label: "Daily Fresh Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80" },
    { label: "Farm Fresh Greens", url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80" },
    { label: "ANC Earbuds Tech", url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80" },
    { label: "Smartwatch AMOLED", url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80" },
    { label: "Heavyweight Cotton Tees", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
    { label: "Streetwear Sneakers", url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" },
    { label: "Whey Isolate Protein", url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80" },
    { label: "Granite Cookware Set", url: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80" },
    { label: "Korean Glass Skincare", url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80" },
    { label: "French Luxury Perfume", url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80" },
    { label: "Artisan Sourdough Bakery", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" }
  ]
};

type ServiceCategoryKey =
  | "DINING"
  | "SALON"
  | "FITNESS"
  | "AUTO"
  | "GAMING"
  | "HEALTH"
  | "CLEANING"
  | "RETAIL";

export type ProductCategoryKey =
  | "ALL"
  | "GROCERY"
  | "ELECTRONICS"
  | "FASHION"
  | "WELLNESS"
  | "HOME"
  | "BEAUTY"
  | "BAKERY";

export const PRODUCT_CATEGORIES: {
  key: ProductCategoryKey;
  name: string;
  icon: any;
  description: string;
}[] = [
  { key: "ALL", name: "All Products", icon: Package, description: "All retail bargains & flash sales" },
  { key: "GROCERY", name: "Grocery & Staples", icon: ShoppingBag, description: "Monthly ration combos, dairy, pulses & oils" },
  { key: "ELECTRONICS", name: "Electronics & Audio", icon: Headphones, description: "TWS earbuds, smartwatches, chargers & tech" },
  { key: "FASHION", name: "Fashion & Apparel", icon: Shirt, description: "Tees, sneakers, ethnic wear & BOGO deals" },
  { key: "WELLNESS", name: "Nutrition & Pharma", icon: HeartPulse, description: "Whey protein, daily vitamins & wellness kits" },
  { key: "HOME", name: "Home & Kitchen", icon: Package, description: "Cookware sets, appliances & cleaning liquids" },
  { key: "BEAUTY", name: "Beauty & Skincare", icon: Sparkles, description: "Korean skincare serums, sunscreens & perfumes" },
  { key: "BAKERY", name: "Bakery & Treats", icon: Utensils, description: "Fresh breads, cookies, cakes & chocolates" }
];

interface PrebuiltTemplate {
  id: string;
  category: ServiceCategoryKey;
  productCategory?: ProductCategoryKey;
  scopeType: "SERVICE" | "PRODUCT";
  label: string;
  badge: string;
  title: string;
  tagline: string;
  type: "FLAT_PCT" | "FLAT_AMT" | "BOGO";
  value: number;
  maxDiscount?: number;
  minBillAmount: number;
  originalPrice?: number;
  dealPrice?: number;
  isFlashDeal?: boolean;
  totalFlashUnits?: number;
  bonusCoins: number;
  ctaText: string;
  promoCode?: string;
  activeDays: string[];
  enableHappyHours?: boolean;
  startTime?: string;
  endTime?: string;
  imageUrl: string;
  terms: string;
  // District Table / Slot Booking Engine
  isTableBookingEnabled?: boolean;
  bookingType?: "TABLE_RESERVATION" | "APPOINTMENT_SLOT";
  slotTimes?: string[];
  minPartySize?: number;
  maxPartySize?: number;
  availableTablesPerSlot?: number;
  seatingAreas?: string[];
  coverChargeAmount?: number;
  gracePeriodMinutes?: number;
  instantConfirmation?: boolean;
}

const SERVICE_CATEGORIES: {
  key: ServiceCategoryKey;
  name: string;
  icon: any;
  color: string;
  description: string;
}[] = [
  {
    key: "DINING",
    name: "Dining & Cafes",
    icon: Utensils,
    color: "orange",
    description: "Restaurants, Bars, Buffets, Bakeries & Table Reservations"
  },
  {
    key: "SALON",
    name: "Salon & Spa",
    icon: Scissors,
    color: "pink",
    description: "Hair styling, Facial treatments, Body massage & Stylist Slots"
  },
  {
    key: "FITNESS",
    name: "Gym & Fitness",
    icon: Dumbbell,
    color: "emerald",
    description: "Gym memberships, Personal training, Yoga & Class Slots"
  },
  {
    key: "AUTO",
    name: "Auto & Car Care",
    icon: Car,
    color: "blue",
    description: "Foam car wash, Ceramic detailing, Oil change & Service Bays"
  },
  {
    key: "GAMING",
    name: "Gaming & Fun",
    icon: Gamepad2,
    color: "purple",
    description: "Arcade balance, Bowling lanes, Trampoline & Arena Bookings"
  },
  {
    key: "HEALTH",
    name: "Health & Dental",
    icon: Stethoscope,
    color: "rose",
    description: "Full body blood panels, Dental scaling & Clinic Slots"
  },
  {
    key: "CLEANING",
    name: "Cleaning & Care",
    icon: Shirt,
    color: "indigo",
    description: "Dry cleaning by kilo, Sofa extraction & Home Slots"
  },
  {
    key: "RETAIL",
    name: "Retail & Grocery",
    icon: ShoppingBag,
    color: "emerald",
    description: "Supermarket flash deals, Staples, Dairy & Packaged goods"
  }
];

const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  // 1. DINING
  {
    id: "dine-district-slot",
    category: "DINING",
    scopeType: "SERVICE",
    label: "District 50% Time-Slot Table",
    badge: "DISTRICT DINING",
    title: "Up to 50% OFF Table Reservation (District Special)",
    tagline: "Instant confirmed table reservation with time-slot bill discount",
    type: "FLAT_PCT",
    value: 50,
    maxDiscount: 350,
    minBillAmount: 800,
    bonusCoins: 200,
    ctaText: "Reserve Table",
    promoCode: "DISTRICT50",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enableHappyHours: true,
    startTime: "12:00",
    endTime: "23:00",
    imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
    terms: "Valid on confirmed table reservations. 15-minute grace period. Bill discount applies on food & soft beverages.",
    isTableBookingEnabled: true,
    bookingType: "TABLE_RESERVATION",
    slotTimes: ["12:30 PM", "01:30 PM", "07:00 PM", "08:30 PM", "09:30 PM"],
    minPartySize: 2,
    maxPartySize: 8,
    availableTablesPerSlot: 4,
    seatingAreas: ["Indoor AC Dining", "Outdoor / Rooftop"],
    coverChargeAmount: 0,
    gracePeriodMinutes: 15,
    instantConfirmation: true
  },
  {
    id: "dine-rooftop",
    category: "DINING",
    scopeType: "SERVICE",
    label: "Rooftop Candlelight Table",
    badge: "ROOFTOP RESERVED",
    title: "Rooftop Sunset Dining: Flat 25% OFF + Free Mocktails",
    tagline: "Panoramic skyline views with reserved romantic table setting",
    type: "FLAT_PCT",
    value: 25,
    maxDiscount: 500,
    minBillAmount: 1500,
    bonusCoins: 250,
    ctaText: "Reserve Rooftop Table",
    promoCode: "ROOFTOP25",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enableHappyHours: true,
    startTime: "18:30",
    endTime: "23:30",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    terms: "Includes reserved romantic table, 2 welcome drinks & 25% off food bill. ₹200 cover deposit adjusted in bill.",
    isTableBookingEnabled: true,
    bookingType: "TABLE_RESERVATION",
    slotTimes: ["06:30 PM", "07:30 PM", "08:30 PM", "09:30 PM", "10:30 PM"],
    minPartySize: 2,
    maxPartySize: 6,
    availableTablesPerSlot: 3,
    seatingAreas: ["Outdoor / Rooftop", "Balcony / Courtyard"],
    coverChargeAmount: 200,
    gracePeriodMinutes: 20,
    instantConfirmation: true
  },
  {
    id: "dine-buffet",
    category: "DINING",
    scopeType: "SERVICE",
    label: "Royal Grand Buffet",
    badge: "BUFFET SPECIAL",
    title: "Royal Grand Buffet @ Flat ₹300 OFF",
    tagline: "Unlimited multi-course starters, live grill & dessert counter",
    type: "FLAT_AMT",
    value: 300,
    minBillAmount: 899,
    bonusCoins: 200,
    ctaText: "Book Table",
    promoCode: "BUFFET300",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    enableHappyHours: true,
    startTime: "12:30",
    endTime: "16:00",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    terms: "Prior table reservation recommended. Valid for 1 person buffet coupon. Unlimited food.",
    isTableBookingEnabled: true,
    bookingType: "TABLE_RESERVATION",
    slotTimes: ["12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "07:30 PM", "08:30 PM"],
    minPartySize: 1,
    maxPartySize: 12,
    availableTablesPerSlot: 6,
    seatingAreas: ["Indoor AC Dining"],
    coverChargeAmount: 0,
    gracePeriodMinutes: 15,
    instantConfirmation: true
  },
  {
    id: "dine-bogo",
    category: "DINING",
    scopeType: "SERVICE",
    label: "1+1 Craft Beverages",
    badge: "1+1 HAPPY HOURS",
    title: "Buy 1 Get 1 FREE on All Specialty Beverages",
    tagline: "Order any mocktail, iced coffee or artisan cooler and get second free",
    type: "BOGO",
    value: 100,
    maxDiscount: 350,
    minBillAmount: 300,
    bonusCoins: 100,
    ctaText: "Claim BOGO",
    promoCode: "BOGOBREW",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    enableHappyHours: true,
    startTime: "16:00",
    endTime: "20:00",
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    terms: "Complimentary beverage must be of equal or lesser value. One BOGO per table transaction."
  },

  // 2. SALON
  {
    id: "salon-vip-slot",
    category: "SALON",
    scopeType: "SERVICE",
    label: "VIP Stylist Slot",
    badge: "VIP APPOINTMENT",
    title: "Zero-Wait VIP Salon Slot @ Flat 30% OFF",
    tagline: "Dedicated master stylist chair reservation with 0 wait time",
    type: "FLAT_PCT",
    value: 30,
    maxDiscount: 400,
    minBillAmount: 999,
    bonusCoins: 180,
    ctaText: "Reserve Slot",
    promoCode: "VIPSLOT",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80",
    terms: "Guaranteed chair availability within 5 minutes of slot arrival time.",
    isTableBookingEnabled: true,
    bookingType: "APPOINTMENT_SLOT",
    slotTimes: ["11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM"],
    minPartySize: 1,
    maxPartySize: 2,
    availableTablesPerSlot: 2,
    seatingAreas: ["VIP Private Styling Chair"],
    coverChargeAmount: 0,
    gracePeriodMinutes: 10,
    instantConfirmation: true
  },
  {
    id: "salon-grooming",
    category: "SALON",
    scopeType: "SERVICE",
    label: "Complete Grooming Package",
    badge: "GROOMING COMBO",
    title: "Head-to-Toe Grooming: Haircut + Beard + Facial",
    tagline: "Complete salon makeover package with premium organic products",
    type: "FLAT_PCT",
    value: 35,
    maxDiscount: 450,
    minBillAmount: 800,
    bonusCoins: 180,
    ctaText: "Book Slot",
    promoCode: "GROOM35",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    terms: "Valid on all days. Customer may choose therapist subject to store availability."
  },

  // 3. FITNESS
  {
    id: "fit-month",
    category: "FITNESS",
    scopeType: "SERVICE",
    label: "1-Month Unlimited Pass",
    badge: "NEW MEMBER PASS",
    title: "Flat 50% OFF on 1-Month Unlimited Gym Pass",
    tagline: "Full access to cardio, heavy weights, lockers & steam room",
    type: "FLAT_PCT",
    value: 50,
    maxDiscount: 1000,
    minBillAmount: 1999,
    bonusCoins: 300,
    ctaText: "Avail Membership",
    promoCode: "FIT50",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    terms: "Valid for new members only. Free gym bag included upon biometric onboarding."
  },

  // 4. AUTO
  {
    id: "auto-wash",
    category: "AUTO",
    scopeType: "SERVICE",
    label: "Eco Foam Wash & Vacuum",
    badge: "CAR CARE",
    title: "Complete Eco Foam Wash & Interior Sanitisation",
    tagline: "High-pressure underbody rinse, active snow foam & tyre dressing",
    type: "FLAT_AMT",
    value: 250,
    minBillAmount: 599,
    bonusCoins: 150,
    ctaText: "Book Service",
    promoCode: "CARWASH250",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
    terms: "Takes approximately 45 minutes. Applicable on Hatchbacks, Sedans & Compact SUVs.",
    isTableBookingEnabled: true,
    bookingType: "APPOINTMENT_SLOT",
    slotTimes: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"],
    availableTablesPerSlot: 3,
    instantConfirmation: true
  },

  // 5. GAMING
  {
    id: "game-bowling",
    category: "GAMING",
    scopeType: "SERVICE",
    label: "Bowling & Snack Duo",
    badge: "BOWLING COMBO",
    title: "2 Bowling Games + Loaded Nachos @ Flat 40% OFF",
    tagline: "Weekday glow-in-the-dark lane access & professional shoe rental",
    type: "FLAT_PCT",
    value: 40,
    maxDiscount: 350,
    minBillAmount: 600,
    bonusCoins: 150,
    ctaText: "Reserve Lane",
    promoCode: "BOWL40",
    activeDays: ["Mon", "Tue", "Wed", "Thu"],
    imageUrl: "https://images.unsplash.com/photo-1545803997-39b039403ecb?auto=format&fit=crop&w=800&q=80",
    terms: "Valid Monday through Thursday. Maximum 2 hours per session.",
    isTableBookingEnabled: true,
    bookingType: "TABLE_RESERVATION",
    slotTimes: ["04:00 PM", "06:00 PM", "08:00 PM", "10:00 PM"],
    minPartySize: 2,
    maxPartySize: 6,
    availableTablesPerSlot: 4,
    instantConfirmation: true
  },

  // 6. HEALTH
  {
    id: "health-dental",
    category: "HEALTH",
    scopeType: "SERVICE",
    label: "Dental Ultrasonic Scaling",
    badge: "DENTAL HYGIENE",
    title: "Flat ₹400 OFF on Ultrasonic Dental Scaling & Polish",
    tagline: "Complete plaque removal, stain polish & free digital intraoral exam",
    type: "FLAT_AMT",
    value: 400,
    minBillAmount: 999,
    bonusCoins: 200,
    ctaText: "Book Visit",
    promoCode: "SMILE400",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
    terms: "Valid on ultrasonic scaling & polishing. Caries restoration charged separately.",
    isTableBookingEnabled: true,
    bookingType: "APPOINTMENT_SLOT",
    slotTimes: ["10:30 AM", "12:00 PM", "04:30 PM", "06:00 PM"],
    availableTablesPerSlot: 1,
    instantConfirmation: true
  },

  // 7. CLEANING
  {
    id: "clean-laundry",
    category: "CLEANING",
    scopeType: "SERVICE",
    label: "Designer Garments Dry Clean",
    badge: "FABRIC CARE",
    title: "Flat 30% OFF on Designer Garments & Winterwear",
    tagline: "Gentle eco-solvent dry clean with free hanger packing & doorstep pickup",
    type: "FLAT_PCT",
    value: 30,
    maxDiscount: 300,
    minBillAmount: 600,
    bonusCoins: 120,
    ctaText: "Book Pickup",
    promoCode: "CLEAN30",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80",
    terms: "Minimum billing of ₹600. Delivered in 48 hours in dust-proof wardrobe bags."
  },

  // 8. RETAIL PRODUCTS (COMPREHENSIVE DEALS)
  // --- 8.1 GROCERY & STAPLES ---
  {
    id: "ret-ration-combo",
    category: "RETAIL",
    productCategory: "GROCERY",
    scopeType: "PRODUCT",
    label: "Monthly Ration Mega Saver",
    badge: "SUPER SAVER COMBO",
    title: "Aashirvaad Atta 10kg + Fortune Oil 5L + Basmati 5kg Combo",
    tagline: "Essential household monthly staples pack with direct price cut",
    type: "FLAT_AMT",
    value: 400,
    minBillAmount: 1799,
    originalPrice: 2199,
    dealPrice: 1799,
    bonusCoins: 200,
    ctaText: "Claim Ration Pack",
    promoCode: "RATION400",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    terms: "1 combo pack per mobile user. Available for store pickup and hyper-local doorstep delivery."
  },
  {
    id: "retail-milk",
    category: "RETAIL",
    productCategory: "GROCERY",
    scopeType: "PRODUCT",
    label: "Amul Taaza Milk 1L",
    badge: "⚡ FLASH DEAL",
    title: "Amul Taaza Fresh Toned Milk (1 Litre Tetra Pak)",
    tagline: "Daily Fresh Dairy Saver • Flash Deal at Supermarket Counter",
    type: "FLAT_PCT",
    value: 25,
    minBillAmount: 56,
    originalPrice: 75,
    dealPrice: 56,
    isFlashDeal: true,
    totalFlashUnits: 50,
    bonusCoins: 50,
    ctaText: "Add to Cart",
    promoCode: "MILK25",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
    terms: "Limit 3 units per mobile account. Pick up at designated express billing counter."
  },
  {
    id: "ret-fresh-basket",
    category: "RETAIL",
    productCategory: "GROCERY",
    scopeType: "PRODUCT",
    label: "Farm Fresh Veggie & Fruit Box",
    badge: "FARM TO FORK",
    title: "Organic Farm Fresh Veggies & Seasonal Fruits Basket (5kg Assorted)",
    tagline: "Crisp spinach, vine tomatoes, carrots, crisp apples & seasonal citrus",
    type: "FLAT_PCT",
    value: 35,
    minBillAmount: 300,
    originalPrice: 499,
    dealPrice: 324,
    bonusCoins: 80,
    ctaText: "Order Fresh Box",
    promoCode: "FRESH35",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
    terms: "Harvested same morning. Packed in biodegradable ventilated crate."
  },
  {
    id: "ret-dry-fruits",
    category: "RETAIL",
    productCategory: "GROCERY",
    scopeType: "PRODUCT",
    label: "California Almonds & Walnuts (1kg)",
    badge: "PREMIUM DRY FRUITS",
    title: "Jumbo California Almonds & Kashmir Walnuts Combo (1kg Vacuum Sealed)",
    tagline: "Grade-A nutrient-rich crunchy dry fruits for heart health and snacking",
    type: "FLAT_AMT",
    value: 250,
    minBillAmount: 900,
    originalPrice: 1199,
    dealPrice: 949,
    bonusCoins: 120,
    ctaText: "Buy Dry Fruits",
    promoCode: "NUTS250",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
    terms: "100% natural, unpolished and zero preservatives. Includes resealable pouch."
  },

  // --- 8.2 ELECTRONICS & SMART TECH ---
  {
    id: "ret-earbuds",
    category: "RETAIL",
    productCategory: "ELECTRONICS",
    scopeType: "PRODUCT",
    label: "ANC TWS Earbuds Pro",
    badge: "⚡ 57% FLASH BARGAIN",
    title: "AuraPods Active Noise-Cancelling Wireless Earbuds (40h Battery)",
    tagline: "Deep bass 13mm drivers, IPX5 water resistance & rapid 10-min charge",
    type: "FLAT_PCT",
    value: 57,
    minBillAmount: 1299,
    originalPrice: 2999,
    dealPrice: 1299,
    isFlashDeal: true,
    totalFlashUnits: 30,
    bonusCoins: 250,
    ctaText: "Grab Deal",
    promoCode: "AUDIO57",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    terms: "Includes 1-year brand replacement warranty. 1 unit per customer during flash window."
  },
  {
    id: "ret-smartwatch",
    category: "RETAIL",
    productCategory: "ELECTRONICS",
    scopeType: "PRODUCT",
    label: "AMOLED Calling Smartwatch",
    badge: "TECH STEAL",
    title: "Titan Ultra 1.96-inch AMOLED Bluetooth Calling Smartwatch",
    tagline: "Always-On display, continuous heart & SpO2 tracking, metallic unibody",
    type: "FLAT_PCT",
    value: 55,
    minBillAmount: 1999,
    originalPrice: 4499,
    dealPrice: 1999,
    isFlashDeal: true,
    totalFlashUnits: 25,
    bonusCoins: 350,
    ctaText: "Claim Smartwatch",
    promoCode: "WATCH55",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    terms: "Comes with magnetic charging dock and 2 interchangeable sport bands."
  },
  {
    id: "ret-charger-kit",
    category: "RETAIL",
    productCategory: "ELECTRONICS",
    scopeType: "PRODUCT",
    label: "65W GaN Fast Charger Combo",
    badge: "FAST CHARGE",
    title: "65W GaN Dual USB-C Fast Charger + 100W Braided Cable (2m)",
    tagline: "Ultra-compact wall charger charges laptops, iPhones & Galaxy phones at max speeds",
    type: "FLAT_AMT",
    value: 500,
    minBillAmount: 1200,
    originalPrice: 1799,
    dealPrice: 1299,
    bonusCoins: 150,
    ctaText: "Buy Charger",
    promoCode: "GAN500",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    terms: "Safe power delivery architecture with thermal guard protection."
  },

  // --- 8.3 FASHION & APPAREL ---
  {
    id: "ret-cotton-tees",
    category: "RETAIL",
    productCategory: "FASHION",
    scopeType: "PRODUCT",
    label: "Premium Heavyweight Cotton Tees",
    badge: "1+1 BOGO OFFER",
    title: "Buy 1 Get 1 FREE on Heavyweight Premium Cotton T-Shirts",
    tagline: "Breathable 220 GSM combed cotton crewnecks available in 8 vibrant summer colors",
    type: "BOGO",
    value: 100,
    minBillAmount: 999,
    originalPrice: 999,
    dealPrice: 499,
    bonusCoins: 150,
    ctaText: "Claim 1+1 Tees",
    promoCode: "BOGOTEES",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    terms: "Add 2 shirts to cart; discount auto-adjusts lower value item to zero."
  },
  {
    id: "ret-sneakers",
    category: "RETAIL",
    productCategory: "FASHION",
    scopeType: "PRODUCT",
    label: "Urban Chunky Sole Sneakers",
    badge: "CLEARANCE 45%",
    title: "Retro Streetwear Chunky Sole Cushion Sneakers",
    tagline: "Air-mesh breathable lining, shock-absorbing EVA sole for all-day city comfort",
    type: "FLAT_PCT",
    value: 45,
    minBillAmount: 1700,
    originalPrice: 3299,
    dealPrice: 1799,
    bonusCoins: 220,
    ctaText: "Shop Sneakers",
    promoCode: "KICKS45",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    terms: "Hassle-free 7-day size exchange at any branch outlet."
  },
  {
    id: "ret-festive-ethnic",
    category: "RETAIL",
    productCategory: "FASHION",
    scopeType: "PRODUCT",
    label: "Festive Designer Kurta Set",
    badge: "FESTIVE READY",
    title: "Pure Chanderi Silk Handcrafted Kurta & Trouser Set with Dupatta",
    tagline: "Intricate zari embroidery and handcrafted royal tailoring for special occasions",
    type: "FLAT_AMT",
    value: 700,
    minBillAmount: 2200,
    originalPrice: 2999,
    dealPrice: 2299,
    bonusCoins: 300,
    ctaText: "Claim Ethnic Deal",
    promoCode: "ETHNIC700",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    terms: "Dry clean only. Inclusive of all taxes and garment dust bag."
  },

  // --- 8.4 NUTRITION & PHARMACY ---
  {
    id: "ret-whey-protein",
    category: "RETAIL",
    productCategory: "WELLNESS",
    scopeType: "PRODUCT",
    label: "100% Whey Isolate (1kg)",
    badge: "FITNESS NUTRITION",
    title: "Pure Gold 100% Whey Isolate Protein (1kg Swiss Chocolate)",
    tagline: "27g pure protein per scoop, zero added sugar, instant mixability & 5.5g BCAAs",
    type: "FLAT_PCT",
    value: 35,
    minBillAmount: 2200,
    originalPrice: 3499,
    dealPrice: 2275,
    bonusCoins: 300,
    ctaText: "Buy Whey Protein",
    promoCode: "WHEY35",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
    terms: "Authenticity verified with scratch-code on lid. Shaker bottle included free."
  },
  {
    id: "ret-multivitamin-gummies",
    category: "RETAIL",
    productCategory: "WELLNESS",
    scopeType: "PRODUCT",
    label: "Daily Multivitamin Gummies (60s)",
    badge: "BUY 2 GET 1",
    title: "Immunity & Energy Multivitamin Gummies (60 Gummies Pack)",
    tagline: "Infused with Zinc, Vitamin C, D3, B12 & Biotin for daily stamina & hair strength",
    type: "BOGO",
    value: 100,
    minBillAmount: 599,
    originalPrice: 599,
    dealPrice: 399,
    bonusCoins: 80,
    ctaText: "Claim Gummies",
    promoCode: "GUMMIES21",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    terms: "100% vegetarian pectin based gummies. 2 bottles purchase qualifies for 3rd free."
  },

  // --- 8.5 HOME & KITCHEN ---
  {
    id: "ret-cookware-set",
    category: "RETAIL",
    productCategory: "HOME",
    scopeType: "PRODUCT",
    label: "Granite Tri-Ply Cookware (3 Pcs)",
    badge: "KITCHEN UPGRADE",
    title: "3-Piece Induction Granite Non-Stick Cookware Set (Pan, Kadai, Tawa)",
    tagline: "PFOA-free ceramic coating with cool-touch silicone handles and glass lids",
    type: "FLAT_PCT",
    value: 50,
    minBillAmount: 2499,
    originalPrice: 4999,
    dealPrice: 2499,
    bonusCoins: 350,
    ctaText: "Shop Cookware",
    promoCode: "COOK50",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
    terms: "Gas and induction compatible. Includes 24-month manufacturer replacement warranty."
  },
  {
    id: "ret-laundry-liquid",
    category: "RETAIL",
    productCategory: "HOME",
    scopeType: "PRODUCT",
    label: "Mega 5L Liquid Detergent",
    badge: "VALUE REFILL",
    title: "Ultra Clean Bio-Enzyme Liquid Detergent (5 Litres Economical Can)",
    tagline: "Tough on grease and stubborn stains with long-lasting European lavender fragrance",
    type: "FLAT_AMT",
    value: 250,
    minBillAmount: 549,
    originalPrice: 799,
    dealPrice: 549,
    bonusCoins: 75,
    ctaText: "Buy Detergent",
    promoCode: "WASH250",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80",
    terms: "Suitable for front load and top load washing machines. Child-safe cap."
  },

  // --- 8.6 BEAUTY & SKINCARE ---
  {
    id: "ret-korean-skincare",
    category: "RETAIL",
    productCategory: "BEAUTY",
    scopeType: "PRODUCT",
    label: "Korean Glass Skin Serum Duo",
    badge: "GLOW ESSENTIAL",
    title: "10% Niacinamide + Centella Soothing Sunscreen SPF 50 Duo",
    tagline: "Pore minimizing, barrier repair & ultra-lightweight zero white-cast sun protection",
    type: "FLAT_PCT",
    value: 38,
    minBillAmount: 1100,
    originalPrice: 1899,
    dealPrice: 1177,
    bonusCoins: 160,
    ctaText: "Get Glow Duo",
    promoCode: "GLOW38",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    terms: "Dermatologically tested for sensitive and acne-prone skin. Cruelty-free formula."
  },
  {
    id: "ret-perfume",
    category: "RETAIL",
    productCategory: "BEAUTY",
    scopeType: "PRODUCT",
    label: "French Eau De Parfum (100ml)",
    badge: "LUXURY SCENT",
    title: "Mystic Amber & Bergamot Luxury Eau De Parfum (100ml Long Lasting)",
    tagline: "Rich woody-citrus notes crafted by master French perfumers in Grasse",
    type: "FLAT_PCT",
    value: 40,
    minBillAmount: 1400,
    originalPrice: 2499,
    dealPrice: 1499,
    bonusCoins: 200,
    ctaText: "Shop Perfume",
    promoCode: "SCENT40",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    terms: "Lasts up to 12 hours on skin. Includes elegant magnetic cap presentation box."
  },

  // --- 8.7 BAKERY & GOURMET TREATS ---
  {
    id: "ret-artisan-bakery",
    category: "RETAIL",
    productCategory: "BAKERY",
    scopeType: "PRODUCT",
    label: "Gourmet Sourdough & Brownie Box",
    badge: "FRESH BAKED",
    title: "Artisan Sourdough Loaf + 4-Pack Belgian Chocolate Fudge Brownies",
    tagline: "Baked fresh daily with slow natural fermentation and 70% dark Belgian cocoa",
    type: "FLAT_PCT",
    value: 30,
    minBillAmount: 400,
    originalPrice: 650,
    dealPrice: 455,
    bonusCoins: 60,
    ctaText: "Treat Yourself",
    promoCode: "BAKE30",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    terms: "Consumable within 48 hours. Baked every morning at 07:00 AM."
  }
];

const TOP_QUICK_PRESETS = [
  { id: "dine-district-slot", icon: "🍽️", label: "District 50% Slot", desc: "Dining Table + 50% Off" },
  { id: "ret-earbuds", icon: "🎧", label: "ANC Earbuds 57%", desc: "MRP ₹2,999 ➔ ₹1,299" },
  { id: "ret-ration-combo", icon: "🛒", label: "Ration Pack ₹400", desc: "Atta + Oil + Rice Combo" },
  { id: "dine-rooftop", icon: "🌅", label: "Rooftop Romantic", desc: "Sunset Table 25% Off" },
  { id: "ret-whey-protein", icon: "💪", label: "Whey Isolate 35%", desc: "1kg Protein + 300 Coins" },
  { id: "ret-cotton-tees", icon: "👕", label: "Cotton Tees BOGO", desc: "Buy 1 Get 1 FREE" },
  { id: "salon-vip-slot", icon: "💇", label: "VIP Salon Slot", desc: "Zero-Wait 30% Off" },
  { id: "ret-cookware-set", icon: "🍳", label: "Granite Cookware 50%", desc: "3-Piece Induction Set" }
];

export const OfferCampaignFormDrawer: React.FC<OfferCampaignFormDrawerProps> = ({
  merchants = [],
  stores = [],
  merchantId: propMerchantId = "",
  merchantName: propMerchantName = "",
  initialData = null,
  isEdit = false,
  onClose,
  onSave
}) => {
  // Stepper Wizard State (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected Service Category in Step 1
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryKey>("DINING");
  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategoryKey>("ALL");

  const [selectedMerchantId, setSelectedMerchantId] = useState(
    propMerchantId || (merchants.length > 0 ? merchants[0].id : "")
  );

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);
  const merchantName = propMerchantName || selectedMerchant?.businessName || "Partner Brand";

  // Offer Scope Type (Service vs Product Deal)
  const [scopeType, setScopeType] = useState<"SERVICE" | "PRODUCT">(
    initialData?.scopeType || "SERVICE"
  );

  // Form Fields State
  const [title, setTitle] = useState(initialData?.title || "");
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO">(initialData?.type || "FLAT_PCT");
  const [value, setValue] = useState(initialData?.value ?? 20);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(initialData?.maxDiscount ?? 200);
  const [minBillAmount, setMinBillAmount] = useState(initialData?.minBillAmount ?? 500);
  const [perUserLimit, setPerUserLimit] = useState<number | undefined>(initialData?.perUserLimit ?? 1);
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState<number | undefined>(initialData?.maxTotalRedemptions ?? 500);

  // Product Pricing (MRP & Deal Price for Screen 10 retail deals)
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(initialData?.originalPrice);
  const [dealPrice, setDealPrice] = useState<number | undefined>(initialData?.dealPrice);

  // Flash Deal & Countdown
  const [isFlashDeal, setIsFlashDeal] = useState<boolean>(initialData?.isFlashDeal || false);
  const [flashEndTime, setFlashEndTime] = useState<string>(
    initialData?.flashEndTime || new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [totalFlashUnits, setTotalFlashUnits] = useState<number | undefined>(initialData?.totalFlashUnits ?? 50);

  // Rewards & Presentation
  const [bonusCoins, setBonusCoins] = useState<number>(initialData?.bonusCoins ?? 100);
  const [badgeText, setBadgeText] = useState<string>(initialData?.badgeText || "");
  const [ctaText, setCtaText] = useState<string>(initialData?.ctaText || "Book & Pay");

  // Store Scope
  const [storeScope, setStoreScope] = useState<"ALL" | "SPECIFIC">(
    initialData?.applicableStoreIds && initialData.applicableStoreIds.length > 0 ? "SPECIFIC" : "ALL"
  );
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(
    initialData?.applicableStoreIds || (initialData?.storeId ? [initialData.storeId] : [])
  );

  // Dates & Schedule
  const [validFrom, setValidFrom] = useState(
    initialData?.validFrom ? initialData.validFrom.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [validTo, setValidTo] = useState(
    initialData?.validTo ? initialData.validTo.split("T")[0] : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [activeDays, setActiveDays] = useState<string[]>(
    initialData?.activeDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || "12:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "22:00");
  const [enableHappyHours, setEnableHappyHours] = useState(!!initialData?.startTime);

  // Redemption Method & Discovery
  const [redemptionMethod, setRedemptionMethod] = useState<"AUTO_APPLIED" | "PROMO_CODE">(
    initialData?.redemptionMethod || "AUTO_APPLIED"
  );
  const [promoCode, setPromoCode] = useState(initialData?.promoCode || "PINAK50");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [terms, setTerms] = useState(
    initialData?.terms || "Valid on all dine-in and takeaway orders above minimum bill amount."
  );

  // District-style Table & Slot Booking Engine State
  const [isTableBookingEnabled, setIsTableBookingEnabled] = useState<boolean>(
    initialData?.isTableBookingEnabled ?? true
  );
  const [bookingType, setBookingType] = useState<"TABLE_RESERVATION" | "APPOINTMENT_SLOT">(
    initialData?.bookingType || "TABLE_RESERVATION"
  );
  const [slotTimes, setSlotTimes] = useState<string[]>(
    initialData?.slotTimes || [
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM",
      "09:30 PM"
    ]
  );
  const [minPartySize, setMinPartySize] = useState<number>(initialData?.minPartySize ?? 2);
  const [maxPartySize, setMaxPartySize] = useState<number>(initialData?.maxPartySize ?? 8);
  const [availableTablesPerSlot, setAvailableTablesPerSlot] = useState<number>(
    initialData?.availableTablesPerSlot ?? 4
  );
  const [seatingAreas, setSeatingAreas] = useState<string[]>(
    initialData?.seatingAreas || ["Indoor AC Dining", "Outdoor / Rooftop"]
  );
  const [coverChargeAmount, setCoverChargeAmount] = useState<number>(
    initialData?.coverChargeAmount ?? 0
  );
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(
    initialData?.gracePeriodMinutes ?? 15
  );
  const [instantConfirmation, setInstantConfirmation] = useState<boolean>(
    initialData?.instantConfirmation ?? true
  );
  const [newSlotInput, setNewSlotInput] = useState<string>("");

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

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  const toggleSlot = (slot: string) => {
    setSlotTimes((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const addCustomSlot = () => {
    const val = newSlotInput.trim().toUpperCase();
    if (!val) return;
    if (!slotTimes.includes(val)) {
      setSlotTimes((prev) => [...prev, val]);
      setNewSlotInput("");
      toast.success(`Added slot: ${val}`);
    } else {
      toast.error("Slot already exists");
    }
  };

  const toggleSeatingArea = (area: string) => {
    setSeatingAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Auto-calculate discount percentage when original and deal prices are entered
  const computedDiscountPct =
    originalPrice && dealPrice && originalPrice > dealPrice
      ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
      : null;

  // Apply a template with 1-click
  const applyTemplate = (tpl: PrebuiltTemplate) => {
    if (!selectedMerchantId && merchants.length > 0) {
      setSelectedMerchantId(merchants[0].id);
    }

    setScopeType(tpl.scopeType);
    setTitle(tpl.title);
    setTagline(tpl.tagline);
    setType(tpl.type);
    setValue(tpl.value);
    setMaxDiscount(tpl.maxDiscount);
    setMinBillAmount(tpl.minBillAmount);
    setOriginalPrice(tpl.originalPrice);
    setDealPrice(tpl.dealPrice);
    setIsFlashDeal(tpl.isFlashDeal || false);
    if (tpl.totalFlashUnits) setTotalFlashUnits(tpl.totalFlashUnits);
    setBonusCoins(tpl.bonusCoins);
    setBadgeText(tpl.badge);
    setCtaText(tpl.ctaText);
    if (tpl.promoCode) setPromoCode(tpl.promoCode);
    setActiveDays(tpl.activeDays);
    setEnableHappyHours(tpl.enableHappyHours || false);
    if (tpl.startTime) setStartTime(tpl.startTime);
    if (tpl.endTime) setEndTime(tpl.endTime);
    setImageUrl(tpl.imageUrl);
    setTerms(tpl.terms);

    // Apply District Table Booking configurations if present
    if (tpl.scopeType === "PRODUCT") {
      setIsTableBookingEnabled(false);
      if (tpl.productCategory) {
        setSelectedProductCategory(tpl.productCategory);
      }
    } else if (tpl.isTableBookingEnabled !== undefined) {
      setIsTableBookingEnabled(tpl.isTableBookingEnabled);
    }
    if (tpl.bookingType) setBookingType(tpl.bookingType);
    if (tpl.slotTimes) setSlotTimes(tpl.slotTimes);
    if (tpl.minPartySize) setMinPartySize(tpl.minPartySize);
    if (tpl.maxPartySize) setMaxPartySize(tpl.maxPartySize);
    if (tpl.availableTablesPerSlot) setAvailableTablesPerSlot(tpl.availableTablesPerSlot);
    if (tpl.seatingAreas) setSeatingAreas(tpl.seatingAreas);
    if (tpl.coverChargeAmount !== undefined) setCoverChargeAmount(tpl.coverChargeAmount);
    if (tpl.gracePeriodMinutes) setGracePeriodMinutes(tpl.gracePeriodMinutes);
    if (tpl.instantConfirmation !== undefined) setInstantConfirmation(tpl.instantConfirmation);

    setErrors({});
    toast.success(`Applied template: "${tpl.title}"`, {
      description: tpl.isTableBookingEnabled
        ? "Configured with District-style table slots & dining rules!"
        : "All deal parameters & images auto-populated!"
    });
  };

  // Quick Auto-fill based on current scope
  const handleAutoFill = () => {
    const currentTemplates = PREBUILT_TEMPLATES.filter((t) => {
      if (scopeType === "PRODUCT") {
        if (t.category !== "RETAIL") return false;
        if (selectedProductCategory !== "ALL" && t.productCategory !== selectedProductCategory) return false;
        return true;
      }
      return t.category === selectedCategory;
    });
    const pick = currentTemplates[0] || PREBUILT_TEMPLATES[0];
    applyTemplate(pick);
  };

  // Generate random catchy promo code
  const generatePromoCode = () => {
    const prefixes =
      type === "BOGO"
        ? ["BOGO", "TWIN", "FREE"]
        : type === "FLAT_AMT"
        ? ["FLAT", "SAVE", "CASH"]
        : ["DEAL", "FEAST", "PINAK", "OFF"];
    const num = type === "FLAT_PCT" ? value : type === "FLAT_AMT" ? value : "50";
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const code = `${randomPrefix}${num}`.toUpperCase();
    setPromoCode(code);
    toast.success(`Generated Code: ${code}`);
  };

  // Generate Standard Terms & Conditions based on active deal parameters
  const generateStandardTerms = () => {
    const parts: string[] = [];
    if (isTableBookingEnabled) {
      parts.push(`Valid on confirmed table reservations for ${minPartySize} to ${maxPartySize} guests.`);
      parts.push(`Table held for up to ${gracePeriodMinutes} mins from slot arrival.`);
      if (coverChargeAmount > 0) {
        parts.push(`Cover deposit of ₹${coverChargeAmount} will be adjusted in the final bill.`);
      }
    }
    if (type === "FLAT_PCT") {
      parts.push(`Get ${value}% discount on food & beverages up to a maximum cap of ₹${maxDiscount || 500}.`);
    } else if (type === "FLAT_AMT") {
      parts.push(`Flat discount of ₹${value} applicable on bills of ₹${minBillAmount} and above.`);
    } else if (type === "BOGO") {
      parts.push(`Buy 1 Get 1 free applicable on item of equal or lesser value.`);
    }
    parts.push(`Minimum spend requirement: ₹${minBillAmount}.`);
    if (perUserLimit) {
      parts.push(`Offer valid for ${perUserLimit} redemption(s) per user.`);
    }
    parts.push(`Cannot be clubbed with other existing promotional vouchers or corporate discounts.`);
    const standardTnc = parts.join(" ");
    setTerms(standardTnc);
    toast.success("Standard Terms & Conditions generated!");
  };

  // Quick Slot Selectors
  const selectLunchSlots = () => {
    const lunch = ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM"];
    setSlotTimes(lunch);
    toast.success("Applied Lunch slots (12:00 PM - 02:00 PM)");
  };

  const selectDinnerSlots = () => {
    const dinner = ["07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM"];
    setSlotTimes(dinner);
    toast.success("Applied Dinner slots (07:00 PM - 09:30 PM)");
  };

  const selectAllSlots = () => {
    setSlotTimes(STANDARD_SLOTS);
    toast.success("Selected all standard dining & service slots");
  };

  // 1-Click Direct Publish from anywhere
  const handlePublishNow = () => {
    if (!title.trim() || !value) {
      handleAutoFill();
    }
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as any;
      handleSubmit(fakeEvent);
    }, 50);
  };

  // Validate step before advancing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedMerchantId && merchants.length > 0) {
        toast.error("Please select a partner merchant brand.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!value || Number(value) <= 0) {
        toast.error("Please enter a valid positive discount value.");
        return;
      }
      if (scopeType === "PRODUCT" && (!dealPrice || dealPrice <= 0)) {
        toast.error("Please enter a valid deal price for this retail item.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (storeScope === "SPECIFIC" && selectedStoreIds.length === 0) {
        toast.error("Please select at least one branch outlet or choose 'All Outlets'.");
        return;
      }
      if (!validFrom || !validTo) {
        toast.error("Please specify both campaign start and end dates.");
        return;
      }
      if (isTableBookingEnabled && slotTimes.length === 0) {
        toast.error("Please configure at least one time slot for table reservation.");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = offerCampaignSchema.safeParse({
      title: title.trim(),
      tagline: tagline.trim(),
      type,
      value: Number(value),
      maxDiscount: type === "FLAT_PCT" ? Number(maxDiscount) : undefined,
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
      scopeType,
      productCategory: scopeType === "PRODUCT" && selectedProductCategory !== "ALL" ? selectedProductCategory : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      dealPrice: dealPrice ? Number(dealPrice) : undefined,
      isFlashDeal,
      flashEndTime: isFlashDeal ? flashEndTime : undefined,
      totalFlashUnits: isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
      bonusCoins: Number(bonusCoins),
      badgeText: badgeText.trim() || undefined,
      ctaText: ctaText.trim() || undefined,
      // District Table Reservation
      isTableBookingEnabled,
      bookingType,
      slotTimes: isTableBookingEnabled ? slotTimes : undefined,
      minPartySize: isTableBookingEnabled ? Number(minPartySize) : undefined,
      maxPartySize: isTableBookingEnabled ? Number(maxPartySize) : undefined,
      availableTablesPerSlot: isTableBookingEnabled ? Number(availableTablesPerSlot) : undefined,
      seatingAreas: isTableBookingEnabled ? seatingAreas : undefined,
      coverChargeAmount: isTableBookingEnabled ? Number(coverChargeAmount) : undefined,
      gracePeriodMinutes: isTableBookingEnabled ? Number(gracePeriodMinutes) : undefined,
      instantConfirmation: isTableBookingEnabled ? instantConfirmation : undefined,
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
      scopeType,
      productCategory: scopeType === "PRODUCT" && selectedProductCategory !== "ALL" ? selectedProductCategory : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      dealPrice: dealPrice ? Number(dealPrice) : undefined,
      isFlashDeal,
      flashEndTime: isFlashDeal ? flashEndTime : undefined,
      totalFlashUnits: isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
      bonusCoins: Number(bonusCoins),
      badgeText: badgeText.trim() || undefined,
      ctaText: ctaText.trim() || (isTableBookingEnabled ? "Reserve Table" : scopeType === "PRODUCT" ? "Add to Cart" : "Book & Pay"),
      // District Table Reservation Fields
      isTableBookingEnabled,
      bookingType,
      slotTimes: isTableBookingEnabled ? slotTimes : undefined,
      minPartySize: isTableBookingEnabled ? Number(minPartySize) : undefined,
      maxPartySize: isTableBookingEnabled ? Number(maxPartySize) : undefined,
      availableTablesPerSlot: isTableBookingEnabled ? Number(availableTablesPerSlot) : undefined,
      seatingAreas: isTableBookingEnabled ? seatingAreas : undefined,
      coverChargeAmount: isTableBookingEnabled ? Number(coverChargeAmount) : undefined,
      gracePeriodMinutes: isTableBookingEnabled ? Number(gracePeriodMinutes) : undefined,
      instantConfirmation: isTableBookingEnabled ? instantConfirmation : undefined,
    });

    toast.success(`Campaign "${title}" published successfully!`, {
      description: isTableBookingEnabled
        ? "District-style table & slot booking active for consumers"
        : undefined
    });
  };

  // Filter templates matching current category or scope
  const activeCategoryTemplates = PREBUILT_TEMPLATES.filter((t) => {
    if (scopeType === "PRODUCT") {
      if (t.category !== "RETAIL") return false;
      if (selectedProductCategory !== "ALL" && t.productCategory !== selectedProductCategory) return false;
      return true;
    }
    return t.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-slate-800">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                <TicketPercent size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isEdit ? "Edit Campaign Offer" : "Create Deal & Table Booking"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {merchantName} • Step-by-Step District App Style Deal Builder
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                title="Auto Fill Demo Details for Current Category"
              >
                <Sparkles size={14} className="text-pink-600 dark:text-pink-400" />
                <span>Auto Fill</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, title: "Category & Templates" },
                { step: 2, title: "Deal & Rules" },
                { step: 3, title: "Slots & Outlets" },
                { step: 4, title: "Preview & Publish" }
              ].map(({ step, title: sTitle }) => {
                const isActive = currentStep === step;
                const isPassed = currentStep > step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800"
                        : isPassed
                        ? "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        : "opacity-60 text-slate-400"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-pink-600 text-white"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {isPassed ? <Check size={11} /> : step}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-bold truncate hidden sm:inline",
                        isActive
                          ? "text-pink-600 dark:text-pink-400"
                          : isPassed
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-slate-400"
                      )}
                    >
                      {sTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content / Wizard Steps */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
            {/* STEP 1: CATEGORY & TEMPLATES */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1-Tap Quick Launch Presets Strip */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200/80 dark:border-pink-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Sparkles size={13} className="text-pink-600 animate-pulse" />
                      <span>1-Tap Instant Launch Presets (District & Retail)</span>
                    </span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-100 dark:bg-pink-950 px-2 py-0.5 rounded-md">
                      Auto-Fills Everything
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TOP_QUICK_PRESETS.map((qp) => {
                      const matchedTpl = PREBUILT_TEMPLATES.find((t) => t.id === qp.id);
                      if (!matchedTpl) return null;
                      return (
                        <button
                          key={qp.id}
                          type="button"
                          onClick={() => applyTemplate(matchedTpl)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-pink-400 dark:hover:border-pink-600 text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{qp.icon}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate group-hover:text-pink-600">
                              {qp.label}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                            {qp.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Domain Selector (Service vs Product) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Choose Campaign Domain *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setScopeType("SERVICE");
                        if (selectedCategory === "RETAIL") setSelectedCategory("DINING");
                        if (ctaText === "Add to Cart") setCtaText(isTableBookingEnabled ? "Reserve Table" : "Book & Pay");
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                        scopeType === "SERVICE"
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Utensils size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">
                          Service / Dining Table Deal
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Table reservations, Salons, Gyms, Spas, Car bays, Arcades
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScopeType("PRODUCT");
                        setSelectedCategory("RETAIL");
                        setIsTableBookingEnabled(false);
                        if (ctaText === "Book & Pay" || ctaText === "Reserve Table") setCtaText("Add to Cart");
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                        scopeType === "PRODUCT"
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">
                          Retail Product Bargain
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Groceries, Kirana, Packaged goods with MRP vs Deal Price
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Service Categories Tabs (Only if SERVICE) */}
                {scopeType === "SERVICE" && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Select Service Industry / Vertical *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SERVICE_CATEGORIES.filter((c) => c.key !== "RETAIL").map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.key);
                              if (cat.key === "DINING") {
                                setBookingType("TABLE_RESERVATION");
                                setCtaText("Reserve Table");
                              } else {
                                setBookingType("APPOINTMENT_SLOT");
                                setCtaText("Book Slot");
                              }
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer",
                              isSelected
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 font-bold text-purple-700 dark:text-purple-300 shadow-2xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            )}
                          >
                            <Icon size={16} className={isSelected ? "text-purple-600" : "text-slate-400"} />
                            <span className="text-xs truncate">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product Departments Tabs (Only if PRODUCT) */}
                {scopeType === "PRODUCT" && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Select Retail Product Department *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRODUCT_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedProductCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setSelectedProductCategory(cat.key)}
                            className={cn(
                              "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer",
                              isSelected
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            )}
                          >
                            <Icon size={16} className={isSelected ? "text-emerald-600" : "text-slate-400"} />
                            <span className="text-xs truncate">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prebuilt Templates Carousel / Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">
                        {scopeType === "PRODUCT"
                          ? "Prebuilt Product Deals & Flash Bargains"
                          : "Prebuilt District-Style Templates"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {scopeType === "PRODUCT"
                          ? "Click any deal to auto-populate MRP, deal price, % cut & high-res product photo"
                          : "Click any template to auto-populate tables, time slots, rules & graphics"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-md">
                      {activeCategoryTemplates.length} Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCategoryTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-pink-300 dark:hover:border-pink-800 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                              {tpl.badge}
                            </span>
                            <span className="font-bold text-pink-600 font-mono text-xs">
                              {tpl.type === "FLAT_PCT"
                                ? `${tpl.value}% OFF`
                                : tpl.type === "FLAT_AMT"
                                ? `₹${tpl.value} FLAT`
                                : "BUY 1 GET 1"}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {tpl.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                            "{tpl.tagline}"
                          </p>
                          {tpl.isTableBookingEnabled && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              <Armchair size={11} /> Table / Slot Booking Enabled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <span className="text-slate-500">
                            Min: ₹{tpl.minBillAmount} • +{tpl.bonusCoins} Coins
                          </span>
                          <button
                            type="button"
                            onClick={() => applyTemplate(tpl)}
                            className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>Apply</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Merchant Selector (Super Admin context) */}
                {merchants.length > 0 && !propMerchantId && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <Building2 size={13} className="text-purple-600" />
                      <span>Partner Merchant Brand *</span>
                    </label>
                    <select
                      value={selectedMerchantId}
                      onChange={(e) => setSelectedMerchantId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      {merchants.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.businessName} ({m.city || "All Outlets"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DEAL RULES & PRICING */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Discount Mechanism Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Discount Structure *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "FLAT_PCT", label: "Percentage %", desc: "e.g. 50% OFF" },
                      { key: "FLAT_AMT", label: "Flat Amount ₹", desc: "e.g. ₹300 OFF" },
                      { key: "BOGO", label: "Buy 1 Get 1", desc: "BOGO on menu/pass" }
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setType(m.key as any)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                          type === m.key
                            ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        )}
                      >
                        <span className="block text-xs">{m.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Retail Product Pricing (If PRODUCT) */}
                {scopeType === "PRODUCT" && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
                      Retail Product Pricing & Stock
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] block">
                          Original MRP (₹)
                        </label>
                        <input
                          type="number"
                          value={originalPrice ?? ""}
                          onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 75"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] block">
                          Special Deal Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={dealPrice ?? ""}
                          onChange={(e) => setDealPrice(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 56"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                        />
                      </div>
                    </div>

                    {computedDiscountPct && (
                      <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Auto-Calculated Consumer Discount:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {computedDiscountPct}% Instant Cut
                        </span>
                      </div>
                    )}

                    {/* Flash Bargain Toggle */}
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          Enable Flash Deal Countdown
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Shows live countdown timer in mobile app feed
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isFlashDeal}
                        onChange={(e) => setIsFlashDeal(e.target.checked)}
                        className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Values & Limits Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      {type === "FLAT_PCT" ? "Discount Percentage (%) *" : "Discount Value (₹) *"}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        setValue(Number(e.target.value));
                        clearError("value");
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Minimum Spend Requirement (₹) *
                    </label>
                    <input
                      type="number"
                      value={minBillAmount}
                      onChange={(e) => {
                        setMinBillAmount(Number(e.target.value));
                        clearError("minBillAmount");
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold"
                    />
                  </div>
                </div>

                {type === "FLAT_PCT" && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Maximum Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      value={maxDiscount ?? ""}
                      onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 350 (Leave empty for no limit)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono"
                    />
                  </div>
                )}

                {/* Rewards & Redemption Safeguards */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Coins size={14} />
                    <span>Loyalty Rewards & Margin Safeguards</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Bonus Coins</span>
                      <input
                        type="number"
                        value={bonusCoins}
                        onChange={(e) => setBonusCoins(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Per User Limit</span>
                      <input
                        type="number"
                        value={perUserLimit ?? ""}
                        onChange={(e) => setPerUserLimit(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 2"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Claims Cap</span>
                      <input
                        type="number"
                        value={maxTotalRedemptions ?? ""}
                        onChange={(e) => setMaxTotalRedemptions(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 500"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Redemption Trigger (Auto-Applied vs Voucher Promo Code) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Redemption Trigger Mode *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRedemptionMethod("AUTO_APPLIED")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                        redemptionMethod === "AUTO_APPLIED"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      )}
                    >
                      <Zap size={14} className="mx-auto mb-1 text-pink-600" />
                      <span>Auto-Applied on Bill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedemptionMethod("PROMO_CODE")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                        redemptionMethod === "PROMO_CODE"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      )}
                    >
                      <Tag size={14} className="mx-auto mb-1 text-purple-600" />
                      <span>Requires Promo Code</span>
                    </button>
                  </div>
                  {redemptionMethod === "PROMO_CODE" && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g. DISTRICT50"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase flex-1"
                      />
                      <button
                        type="button"
                        onClick={generatePromoCode}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Wand2 size={12} />
                        <span>Generate</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Real-Time Economics & Margin Safeguard Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Calculator size={14} className="text-pink-600" />
                      <span>Real-Time Economics & Margin Safeguard</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Sample Order: ₹{Math.max(minBillAmount, 1000)}</span>
                  </div>

                  {(() => {
                    const sampleSpend = Math.max(minBillAmount, 1000);
                    let sampleDiscount = 0;
                    if (type === "FLAT_PCT") {
                      sampleDiscount = (sampleSpend * value) / 100;
                      if (maxDiscount) sampleDiscount = Math.min(sampleDiscount, maxDiscount);
                    } else if (type === "FLAT_AMT") {
                      sampleDiscount = value;
                    } else {
                      sampleDiscount = Math.min(sampleSpend * 0.5, maxDiscount || sampleSpend * 0.5);
                    }
                    const customerPays = Math.max(0, sampleSpend - sampleDiscount);
                    return (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Customer Saves</span>
                          <span className="text-sm font-extrabold text-emerald-600 font-mono">₹{sampleDiscount.toFixed(0)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Customer Pays</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">₹{customerPays.toFixed(0)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Loyalty Boost</span>
                          <span className="text-sm font-extrabold text-amber-500 font-mono">+{bonusCoins} Coins</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* STEP 3: OUTLETS, TIME SLOTS & DISTRICT TABLE BOOKING */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. DISTRICT TABLE & SLOT BOOKING ENGINE */}
                {scopeType === "SERVICE" && (
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-[#121626] border border-indigo-200 dark:border-indigo-900/60 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                          <Armchair size={17} />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                            District-Style Table Reservation & Slot Booking
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Allow consumers to reserve confirmed tables / service slots with deal discounts
                          </span>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTableBookingEnabled}
                          onChange={(e) => setIsTableBookingEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {isTableBookingEnabled && (
                      <div className="space-y-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                        {/* Booking Mode */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingType("TABLE_RESERVATION");
                              setCtaText("Reserve Table");
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                              bookingType === "TABLE_RESERVATION"
                                ? "border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-500"
                            )}
                          >
                            <Utensils size={14} />
                            <span>Dining Table Booking</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingType("APPOINTMENT_SLOT");
                              setCtaText("Book Slot");
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                              bookingType === "APPOINTMENT_SLOT"
                                ? "border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-500"
                            )}
                          >
                            <Clock size={14} />
                            <span>Service Appointment Slot</span>
                          </button>
                        </div>

                        {/* Available Time Slots with Quick Click Pills */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Clock size={12} className="text-indigo-600" />
                              <span>Select Live Time Slots Available to Consumers ({slotTimes.length})</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={selectLunchSlots}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                              >
                                ☀️ Lunch
                              </button>
                              <button
                                type="button"
                                onClick={selectDinnerSlots}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer"
                              >
                                🌙 Dinner
                              </button>
                              <button
                                type="button"
                                onClick={selectAllSlots}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                ⚡ All
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_SLOTS.map((slot) => {
                              const isSelected = slotTimes.includes(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => toggleSlot(slot)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-indigo-600 text-white font-bold shadow-2xs"
                                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                  )}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>

                          {/* Add Custom Slot */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={newSlotInput}
                              onChange={(e) => setNewSlotInput(e.target.value)}
                              placeholder="Add custom slot e.g. 03:00 PM"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={addCustomSlot}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {/* Party Size & Tables / Capacity */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Min Party Size
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={minPartySize}
                              onChange={(e) => setMinPartySize(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Max Party Size
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={maxPartySize}
                              onChange={(e) => setMaxPartySize(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Tables/Seats Per Slot
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={availableTablesPerSlot}
                              onChange={(e) => setAvailableTablesPerSlot(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>
                        </div>

                        {/* Seating Area Multi-select */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            Allowed Seating Sections:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {SEATING_AREA_OPTIONS.map((area) => {
                              const isSelected = seatingAreas.includes(area);
                              return (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => toggleSeatingArea(area)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                                    isSelected
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold"
                                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                                  )}
                                >
                                  {isSelected && <Check size={11} />}
                                  <span>{area}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Booking Policies (Cover Charge, Grace Period, Instant) */}
                        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cover / Reservation Fee</span>
                            <select
                              value={coverChargeAmount}
                              onChange={(e) => setCoverChargeAmount(Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value={0}>Free Booking (₹0)</option>
                              <option value={100}>₹100 (Adjustable in Bill)</option>
                              <option value={200}>₹200 (Adjustable in Bill)</option>
                              <option value={500}>₹500 (Cover Charge)</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 block">Holding Grace Period</span>
                            <select
                              value={gracePeriodMinutes}
                              onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value={10}>10 Minutes Grace</option>
                              <option value={15}>15 Minutes Grace (District Std)</option>
                              <option value={20}>20 Minutes Grace</option>
                              <option value={30}>30 Minutes Grace</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 block">Confirmation Mode</span>
                            <select
                              value={instantConfirmation ? "INSTANT" : "MANUAL"}
                              onChange={(e) => setInstantConfirmation(e.target.value === "INSTANT")}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value="INSTANT">Instant Auto-Confirmation</option>
                              <option value="MANUAL">Manager Approval Required</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Target Branch Scope Selection */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Target Branch Scope *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStoreScope("ALL")}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all cursor-pointer",
                        storeScope === "ALL"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <StoreIcon size={16} className="mx-auto mb-1" />
                      <span>All Brand Outlets ({availableStores.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreScope("SPECIFIC")}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all cursor-pointer",
                        storeScope === "SPECIFIC"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <Building2 size={16} className="mx-auto mb-1" />
                      <span>Select Specific Outlets ({selectedStoreIds.length})</span>
                    </button>
                  </div>
                </div>

                {storeScope === "SPECIFIC" && availableStores.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Choose Applicable Branches:
                    </span>
                    {availableStores.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-pink-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStoreIds.includes(s.id)}
                          onChange={() => toggleStore(s.id)}
                          className="w-4 h-4 accent-pink-600 rounded"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs">
                            {s.branchName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {s.city} • {s.address}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* 3. Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                      <Calendar size={13} className="text-pink-600" />
                      <span>Valid From *</span>
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                      <Calendar size={13} className="text-pink-600" />
                      <span>Valid To *</span>
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* 4. Days of Week */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Active Days of Week
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                          activeDays.includes(day)
                            ? "bg-pink-600 text-white shadow-2xs font-bold"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Happy Hours / Slot Timing */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                        Restrict to Operating Hours (Happy Hours)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Limit deal availability to specific hours (e.g. 12:00 - 22:00)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableHappyHours}
                      onChange={(e) => setEnableHappyHours(e.target.checked)}
                      className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                    />
                  </div>

                  {enableHappyHours && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200/60 dark:border-purple-900/60">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Start Time</span>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">End Time</span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: MERCHANDISING, LIVE PREVIEW & PUBLISH */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Titles & Taglines */}
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Public Campaign Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        clearError("title");
                      }}
                      placeholder="e.g. Flat 40% OFF on Weekend Family Dining"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold mt-1"
                    />
                    {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Catchy Subtitle / Mobile Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Savor multi-cuisine delicacies with instant bill discount"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Badge Text & Call To Action */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Deal Badge Text
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. DISTRICT SPECIAL"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-bold text-pink-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Mobile CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Reserve Table / Book Slot"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-bold"
                    />
                  </div>
                </div>

                {/* 1-Click Curated Photo Gallery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <ImageIcon size={13} className="text-pink-600" />
                      <span>Curated HD Photos (1-Click Select)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Royalty-Free High Res</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(CURATED_IMAGES_BY_CATEGORY[scopeType === "PRODUCT" ? "RETAIL" : selectedCategory] || CURATED_IMAGES_BY_CATEGORY.DINING).map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setImageUrl(img.url);
                          toast.success(`Selected banner: ${img.label}`);
                        }}
                        className={cn(
                          "relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer group",
                          imageUrl === img.url
                            ? "border-pink-600 ring-2 ring-pink-500/30 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 hover:border-pink-400"
                        )}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 truncate text-center">
                          {img.label}
                        </span>
                        {imageUrl === img.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Image URL */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block text-[11px]">
                    Or Enter Custom Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Terms and Conditions with 1-Click Generator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Terms & Fine Print
                    </label>
                    <button
                      type="button"
                      onClick={generateStandardTerms}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                    >
                      <Wand2 size={11} />
                      <span>Auto-Generate Standard T&C</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* LIVE CONSUMER MOBILE DISTRICT-STYLE PREVIEW */}
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Eye size={13} className="text-pink-600" />
                      <span>Live Consumer Mobile Card Preview (District Style)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Interactive Phone Screen</span>
                  </div>

                  <div className="max-w-sm mx-auto bg-white dark:bg-[#121626] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                    {/* Visual Card Image */}
                    <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      {badgeText && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-pink-600 text-white shadow-md">
                          {badgeText}
                        </span>
                      )}
                      {isTableBookingEnabled && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-emerald-600 text-white shadow-md flex items-center gap-1">
                          <Armchair size={10} className="fill-white" />
                          <span>Confirmed Table</span>
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                          {merchantName}
                        </span>
                        <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                          <Coins size={11} />
                          <span>+{bonusCoins} Coins</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {title || "Campaign Offer Title"}
                        </h4>
                        {tagline && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                            "{tagline}"
                          </p>
                        )}
                      </div>

                      {/* District Table Slots Preview Widget */}
                      {isTableBookingEnabled && slotTimes.length > 0 && (
                        <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                              <Clock size={11} className="text-indigo-600" />
                              <span>Select Time Slot ({type === "FLAT_PCT" ? `${value}% OFF` : `₹${value} OFF`})</span>
                            </span>
                            <span className="text-indigo-600 font-bold">{minPartySize}-{maxPartySize} Guests</span>
                          </div>

                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {slotTimes.slice(0, 4).map((slot, idx) => (
                              <span
                                key={slot}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0",
                                  idx === 0
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                )}
                              >
                                {slot}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-indigo-200/40">
                            <span>{seatingAreas[0] || "Indoor Dining"}</span>
                            <span>{gracePeriodMinutes}m grace period</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          {scopeType === "PRODUCT" && dealPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-emerald-600 font-mono">
                                ₹{dealPrice}
                              </span>
                              {originalPrice && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{originalPrice}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-base font-black text-pink-600 font-mono">
                              {type === "FLAT_AMT"
                                ? `₹${value} FLAT`
                                : type === "FLAT_PCT"
                                ? `${value}% OFF`
                                : "BOGO"}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block">
                            Min spend ₹{minBillAmount}
                          </span>
                        </div>

                        <span className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs transition-colors">
                          {ctaText || (isTableBookingEnabled ? "Reserve Table" : "Book & Pay")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Stepper Footer Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Step {currentStep} of 4
              </span>
              {currentStep < 4 ? (
                <>
                  <button
                    type="button"
                    onClick={handlePublishNow}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold text-xs hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors shadow-2xs cursor-pointer"
                    title="Skip remaining steps and publish immediately with current presets"
                  >
                    <Sparkles size={13} className="text-pink-600" />
                    <span>Publish Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn-gradient flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    <span>Continue</span>
                    <ChevronRight size={14} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-gradient flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Publish Campaign Deal</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
