# 📱 PINAK Mobile App — Screen-to-API Master Blueprint & React Native Reference Guide

> **For Mobile Team Developers**: This document bridges the gap between the **Live Interactive Preview Screens** (`http://localhost:3000/customer-preview` or `/mobile`) and the **Postman API Collection** (`PINAK_Mobile_App_Automated_Tests.postman_collection.json`).
>
> Use this guide to know **exactly which API to call on each screen**, **what triggers it**, **what data to bind**, and **how to build sober, smooth, and interactive React Native screens without text clutter**.

---

## 🧭 High-Level Architecture & Flow Diagram

```
[Screen 01: Onboarding / Auth] ──▶ Phone + OTP + Setup
         │
         ▼
[Screen 02: Home & Discovery Feed] ──▶ Categories, Banners, Nearby Deals, Live Coins
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
[Screen 03: Store & Service Detail]      [Screen 09: Pocket / Wallet Drawer]
   (Offers, Menu, Amenities, Map)          (Live Coins, Stats, Tier)
         │
         ├───────────────────────────────┐
         ▼                               ▼
[Screen 04: Table Booking]       [Screen 05: Walk-In Pay Bill]
   (Dates, Slots, Party Size)       (Bill Input, Coin Discount, UPI)
         │                               │
         ▼                               ▼
[Screen 08: Customer Activity]    [Screen 06: Payment Success Receipt]
   (Live Pass, Host 4-Digit PIN)    (Coins Credited, Digital Invoice)
```

---

## 🎨 React Native UI/UX Guidelines (Clean, Sober & Interactive)

To ensure the mobile app feels like a top-tier modern consumer app (Cred, Zomato, Swiggy):
1. **Never use walls of text**: Users scan with their eyes. Replace paragraphs with **Chips**, **Badges**, **Tags**, and **Icons**.
2. **Spacing & 8-Point Grid**: Use consistent spacing (`8px`, `12px`, `16px`, `24px`). Generous padding around cards creates a clean, sober look.
3. **Smooth Micro-Transitions**:
   - Use `react-native-reanimated` (v3) for shared element transitions when clicking a store card into the detail screen.
   - Use `@gorhom/bottom-sheet` for drawers (Customer Wallet, Date Picker, Table Guest Selector).
4. **Skeleton Loaders instead of blocking Spinners**: Show a gentle shimmering placeholder while the API is loading.
5. **Color Palette**:
   - Background: `#F8F9FD` (Off-white / light slate)
   - Brand Primary: `#6D28D9` / `#7C3AED` (Royal Purple / Violet)
   - Rewards / Coins: `#F59E0B` / `#D97706` (Warm Golden Amber)
   - Savings / Success: `#059669` / `#10B981` (Fresh Emerald Green)
   - Dark Text: `#0F172A` (Slate 900)
   - Muted Subtext: `#64748B` (Slate 500)

---

## 📱 Screen-by-Screen Flow & Postman API Mapping

---

### 🟢 Screen 01: Onboarding, Phone Verification & Auth
**Visual Purpose**: Fast 2-step onboarding. No passwords. Phone number ➔ 6-digit OTP ➔ Ready.

| Step | Action / UI Trigger | Endpoint | Postman Folder & Request |
| :--- | :--- | :--- | :--- |
| **01A** | User enters 10-digit mobile number & taps "Continue" | `POST /api/v1/mobile/auth/check-mobile` | `Folder 01 -> 1. Check Mobile Status` |
| **01B** | Screen transitions to OTP input. Send SMS/WhatsApp OTP | `POST /api/v1/mobile/auth/send-otp` | `Folder 01 -> 2. Trigger 6-Digit OTP` |
| **01C** | User enters 6-digit OTP (Auto-reads SMS in React Native) | `POST /api/v1/mobile/auth/verify-otp` | `Folder 01 -> 4. Smart Verify OTP` |
| **01D** | First-time user enters name & optional referral code | `POST /api/v1/mobile/auth/complete-setup` | `Folder 01 -> 6. Complete Profile Setup` |

* **Storage**: Save `data.tokens.accessToken` to Encrypted Storage / Keychain as `mobileToken`.

---

### 🟢 Screen 02: Home Dashboard & Discovery Feed (`CustomerHomeScreen`)
**UI Reference**: `frontend/client/src/pages/CustomerHomePreviewPage.tsx` & `features/mobile/MobileHomeScreen.tsx`  
**Visual Layout**:
- **Header**: Active Location pill (`Indiranagar ▾ 15km`), Live PINAK Coins Badge (`🪙 500`), Member Avatar (`RV`).
- **Search Bar**: Debounced search input + Quick QR Scanner trigger icon.
- **Hero Promotional Carousel**: Auto-sliding visual deal banners with badge pills (`Weekend Special`, `Flat 50% OFF`).
- **Category Chips (Horizontal Scroll)**: `All`, `Dining 🍔`, `Cafes ☕`, `Supermarket 🛒`, `Fashion 👕`.
- **Top Service Offers Near You**: Vertical / horizontal cards featuring restaurant photo, discount badge (`50% OFF`), distance (`0.4 km`), time left (`45m left`), and coin cashback teaser (`+20% Coins`).

| Trigger | Endpoint | Method | Postman Request | Key Data Bound to UI |
| :--- | :--- | :--- | :--- | :--- |
| **Screen Mount** / Pull-to-Refresh | `/api/v1/mobile/home/feed?lat={lat}&lng={lng}` | `GET` | `Folder 03 -> 11. Fetch Home Feed Payload` | Banners list, categories list, flash deals, trending outlets |
| **Screen Mount** (Coins Balance) | `/api/v1/admin/rewards/{customerId}` | `GET` | `Folder 10 -> Profile / Reward Balance` | Header coin badge: `data.pointsBalance` (e.g. `500 Coins`) |
| **Category Pill Tap** | `/api/v1/mobile/offers/nearby?category={category}&lat={lat}&lng={lng}` | `GET` | `Folder 05 -> 21. Store Discovery Listing Feed` | Filtered outlet cards |
| **Search Input** (Debounced 300ms) | `/api/v1/mobile/search?q={query}&lat={lat}&lng={lng}` | `GET` | `Folder 04 -> 14. Global Search` | Live search autosuggestions |

---

### 🟢 Screen 03: Store & Service Detail Screen (`StoreDetailScreen`)
**UI Reference**: `frontend/client/src/components/ServiceDetailPreviewView.tsx`  
**Visual Layout**:
- **Header Mosaic**: Cover image + photo count pill (`1/4 Photos`). Back button & Heart bookmark icon.
- **Store Info Card**: Store title, Verified tick, Cuisine tags, Price for two (`₹1,200 for two`), Distance text, Rating badge (`4.8 ★`).
- **PINAK Perk Banner**: Golden card: `🪙 Earn 20% PINAK Coins on your bill • AUTO-APPLIED`.
- **Segmented Navigation**: Sticky tabs: `Offers` | `Menu` | `Photos` | `Amenities` | `Location`.
- **Sticky Bottom Action Bar**:
  - Secondary Button: `Book Table` (Opens Screen 04).
  - Primary Gradient Button: `Pay bill now • 50% OFF` (Opens Screen 05).

| Trigger | Endpoint | Method | Postman Request | Key Data Bound to UI |
| :--- | :--- | :--- | :--- | :--- |
| **Screen Mount** (via Store Card Tap) | `/api/v1/mobile/services/detail?storeId={storeId}&lat={lat}&lng={lng}` | `GET` | `Folder 05 -> 22b. Fetch Service / Store Detail` | `data.heroPhotos`, `data.cuisines`, `data.offersSection`, `data.menuSection`, `data.locationSection` |
| **Bookmark Tap** | `/api/v1/mobile/stores/{storeId}/bookmark` | `POST` | `Folder 05 -> 24. Toggle Store Bookmark` | Toggles heart fill status |

---

### 🟢 Screen 04: Table Booking & Reservations (`TableBookingScreen`)
**UI Reference**: `frontend/client/src/components/TableBookingView.tsx`  
**Visual Layout**:
- **Date Selector**: Horizontal calendar date cards (`Fri 20 Nov`, `Sat 21 Nov`) with offer badge (`50% OFF`).
- **Party Size Stepper**: Clean circular counter: `- 2 Guests +` (Limits: 1 to 8 guests).
- **Time Slots Grid**: Grouped into `Lunch Slots` (12:30 PM, 01:00 PM) and `Dinner Slots` (08:00 PM, 08:30 PM). Active slot highlights with purple border.
- **Exclusive Offer Card**: Selected discount (`Flat 50% OFF on Total Bill`) with cover charge info (`₹25 per guest`).
- **VIP Add-on Card**: Optional toggle: `+₹1 VIP Seating & 5% Extra Coins`.
- **Primary CTA**: Sticky button: `Confirm Table • Pay ₹101`.

| Trigger | Endpoint | Method | Postman Request | Payload / Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **Screen Mount** | `/api/v1/mobile/table-bookings/availability?storeId={storeId}&lat={lat}&lng={lng}` | `GET` | `Folder 12 -> 01. Get Table Booking Slot & Offer Availability` | `upcomingDates`, `lunchSlots`, `dinnerSlots`, `guestConfig`, `exclusiveOffers` |
| **Tap "Confirm Table"** | `/api/v1/mobile/table-bookings` | `POST` | `Folder 12 -> 02. Create Table Booking` | Body: `{ storeId, bookingDate, mealType, slotTime, guests, offerId, customerName, customerPhone, paymentMethod }` |

* **Output on Success**: Returns `data.bookingRef` (e.g. `PNK-TB-202611-382910`) and 4-digit host PIN (`verificationCode: "8492"`). Seamlessly navigates user to **Screen 08: Customer Activity Pass**.

---

### 🟢 Screen 05: Walk-In Dining Bill Payment & Coins Redemption (`PayBillScreen`)
**UI Reference**: `frontend/client/src/components/PayBillView.tsx`  
**Visual Layout**:
- **Store Summary**: Merchant name, branch address, and distance.
- **Bill Input**: Large clean numeric currency input: `₹ 2,500`.
- **Offer Auto-Applied Pill**: `50% OFF Applied • Saves ₹1,250`.
- **PINAK Coins Slider / Switch**:
  - `🪙 Use PINAK Coins (Balance: 500 🪙)`
  - Checkbox toggle: When enabled, deducts user's real balance (up to 10% of bill or total balance, 1 Coin = ₹1).
- **Cashback Coins Preview**: `You will earn +120 PINAK Coins on this payment`.
- **Tip Chips**: `No Tip`, `₹30`, `₹50`, `₹100`.
- **Bill Breakdown Card**:
  - Food Bill: `₹2,500.00`
  - Offer Discount: `-₹1,250.00`
  - PINAK Coins Redeemed: `-₹50.00`
  - Tip: `+₹50.00`
  - **Net Payable: `₹1,250.00`**
- **Payment Method Selector**: GPay, PhonePe, Paytm, or UPI QR.
- **CTA**: Sticky button `Pay ₹1,250 via Google Pay UPI`.

| Trigger | Endpoint | Method | Postman Request | Payload |
| :--- | :--- | :--- | :--- | :--- |
| **Tap "Pay Now"** | `/api/v1/mobile/table-bookings/pay-bill` | `POST` | `Folder 12 -> 05. Settle In-Store Dining Bill with Offer Applied` | Body: `{ storeId, billAmount, discountAmount, coinsRedeemed, coinsEarned, totalPaid, paymentMethod, customerName, customerPhone }` |

* **Backend Behavior**: Resolves customer by phone (`customerPhone`), applies the cashback reward rule, records the transaction ledger, and credits newly earned coins directly into `reward_accounts`.

---

### 🟢 Screen 06: Payment Success & Digital Receipt (`PaymentSuccessScreen`)
**UI Reference**: `frontend/client/src/components/PayBillView.tsx` (Success State)  
**Visual Layout**:
- **Celebration Card**: Animated emerald checkmark + subtle confetti burst.
- **Total Paid**: Bold `₹1,250.00` with subtext `Paid to Smokehouse Grill`.
- **Coins Credited Highlight**: Golden banner: `🎉 +120 PINAK Coins Credited to your Wallet!`.
- **Transaction Details**: Reference `#TXN-DIN-99182301`, Time, Payment Mode (`Google Pay UPI`).
- **Action Buttons**:
  - `View in My Orders` (Navigates to Screen 08).
  - `Done / Back to Home` (Returns to Screen 02).

* **API Call**: Rendered instantly using the response object returned by `POST /api/v1/mobile/table-bookings/pay-bill`. No second API call needed!

---

### 🟢 Screen 07: In-Store Product Retail Deal Checkout (`ProductOrderScreen`)
**UI Reference**: `frontend/client/src/components/ProductOrderView.tsx`  
**Visual Layout**:
- For retail stores (e.g. Fabindia apparel, organic stores, supermarkets).
- Product Hero Image, Title, Brand, Unit (`1 Piece`).
- Price Card: MRP `₹1,200` (strikethrough) ➔ Selling Price `₹600` (`50% OFF IN-STORE`).
- Quantity Stepper: `- 1 +`.
- Total Calculation with optional Coins redemption.
- CTA: `Pay ₹600 & Collect In-Store`.

| Trigger | Endpoint | Method | Postman Request |
| :--- | :--- | :--- | :--- |
| **Screen Mount** | `/api/v1/mobile/products/detail?productId={id}&lat={lat}&lng={lng}` | `GET` | `Folder 11 -> 01. Fetch Retail Product Detail & In-Store Deal` |
| **Tap "Pay & Collect"** | `/api/v1/mobile/table-bookings/pay-bill` | `POST` | `Folder 11 -> 03. Process In-Store Product Bill Payment` |

---

### 🟢 Screen 08: Customer Activity & Table Booking Passes (`CustomerOrdersScreen`)
**UI Reference**: `frontend/client/src/components/CustomerOrdersView.tsx`  
**Visual Layout**:
- **Segmented Tabs**: `Active Passes (1)` | `Past Orders & Dining`.
- **Digital Booking Pass Card**:
  - Restaurant Name, Date (`20 Nov 2026`), Slot (`08:30 PM`), Guests (`4 Guests`).
  - **4-Digit Host Verification PIN**: `8492` (Large monospace pill for host check-in).
  - QR Code thumbnail (tap to expand for host camera scan).
  - `Pay Bill at Restaurant` button (launches Screen 05 prefilled with booking reference).
  - `Cancel Booking` text button (launches confirmation dialog for 100% refund).

| Trigger | Endpoint | Method | Postman Request |
| :--- | :--- | :--- | :--- |
| **Screen Mount** / Pull-to-Refresh | `/api/v1/mobile/table-bookings` | `GET` | `Folder 12 -> 04. List Customer Table Reservations` |
| **Cancel Pass Tap** | `/api/v1/mobile/table-bookings/{ref}/cancel` | `POST` | `Folder 12 -> 06. Cancel Table Booking & Process Cover Charge Refund` |

---

### 🟢 Screen 09: Customer Wallet & Rewards Drawer ("Pocket")
**UI Reference**: `CustomerHomePreviewPage.tsx` (Wallet Sheet)  
**Visual Layout**:
- Slide-up Bottom Sheet (triggered by tapping Header Coins, Avatar, or Bottom Tab `Pocket`).
- **Profile Header**: Avatar initials (`RV`), Customer Name (`Rahul Verma`), Phone (`+919876543210`), Tier (`GOLD`).
- **Balance Card**:
  - `500` 🪙 **PINAK Coins** (`Worth ₹500.00`).
  - Lifetime Stats: Earned `+750 🪙` | Redeemed `-250 🪙`.
  - `🔄 Refresh Balance` button (makes live API call).
- **Test Customer Switcher** (for development / QA): Allows switching active profile to test different coin balances (`Aarav Mehta`, `Ananya Verma`, etc.).

| Trigger | Endpoint | Method | Postman Request |
| :--- | :--- | :--- | :--- |
| **Sheet Open / Refresh Tap** | `/api/v1/admin/rewards/{customerId}` | `GET` | `Folder 10 -> Profile / Reward Balance` |
| **Customer Switcher** | `/api/v1/admin/rewards/accounts` | `GET` | Returns all active test customer accounts |

---

## 🛠️ Step-by-Step React Native Setup Guide for the Mobile Developer

1. **How to view the Live Interactive Reference**:
   - Start the web preview server on local: `npm run dev` in `frontend/client`.
   - Open in browser: `http://localhost:3000/customer-preview` or `http://localhost:3000/mobile`.
   - Press `F12` and switch to **Mobile Device Emulation** (iPhone 14 / Pixel 7).
   - Tap through the buttons: Table booking, Pay bill, Sliders, and Bottom tabs. Every transition, font size, and layout is interactive and ready to copy.

2. **How to import the Postman Collection**:
   - Open Postman ➔ Click **Import**.
   - Select `backend/PINAK_Mobile_App_Automated_Tests.postman_collection.json`.
   - The environment variables (`baseUrl`, `storeId`, `testPhone`, `userLat`, `userLng`) are preconfigured for local backend testing (`http://localhost:8080`).

3. **Recommended React Native Stack**:
   - **Framework**: React Native with Expo (SDK 51+) or Bare React Native.
   - **Navigation**: React Navigation Native Stack + Bottom Tabs.
   - **State & Query**: TanStack Query (`@tanstack/react-query`) for API caching and pull-to-refresh.
   - **Networking**: Axios or Fetch with baseUrl `http://localhost:8080` (or Android emulator IP `http://10.0.2.2:8080`).
   - **Bottom Sheets**: `@gorhom/bottom-sheet`.
   - **Icons**: `lucide-react-native` or `@expo/vector-icons`.
