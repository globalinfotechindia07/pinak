# 📱 PINAK Mobile Application — Complete API Documentation (Screens 05 to 15)

This master documentation provides an exhaustive, screen-by-screen breakdown of all mobile API endpoints implemented for the PINAK Application (Screens 05 through 15).

---

## 🌐 Base Server URLs

- **Local Development**: `http://localhost:8080`
- **Render Cloud Production**: `https://pinak-server.onrender.com`

---

## 🔒 Namespace & Authentication Rules

1. All mobile endpoints are isolated under the dedicated `/api/v1/mobile/...` URL namespace.
2. Public Onboarding Endpoints (`/api/v1/mobile/auth/**`, discovery GET feeds) require **no authorization header**.
3. Profile Setup (`/complete-setup`) requires `Authorization: Bearer {{onboardingToken}}` received from OTP verification.
4. Authenticated Customer Endpoints require `Authorization: Bearer {{mobileToken}}` received upon completing setup or logging in as a returning member.

---

# 📱 Screen 05 — Member Login & Phone Verification

### 1. Check Mobile Number Status
Checks if a phone number belongs to an existing member or a new user. Supports both `POST` (JSON body) and `GET` (query parameter).

- **Method**: `POST` / `GET`
- **URL**: `/api/v1/mobile/auth/check-mobile`
- **Headers**: `Content-Type: application/json`

#### Request Body (POST):
```json
{
  "phone": "+919875554321"
}
```

#### Query Param (GET):
`GET /api/v1/mobile/auth/check-mobile?phone=%2B919875554321`

#### Response Body (200 OK — New User):
```json
{
  "success": true,
  "message": "Phone status evaluated successfully",
  "data": {
    "phone": "+919875554321",
    "isReturningMember": false,
    "unclaimedRewardsStatus": "NONE",
    "welcomeBonusCoins": 100,
    "nextStep": "TRIGGER_OTP"
  }
}
```

---

# 📱 Screen 06 — Phone Verification & Referral Validation

### 2. Trigger 6-Digit Mobile OTP
Generates a mock 6-digit OTP and session ID for SMS/WhatsApp verification.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/auth/send-otp`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "phone": "+919875554321",
  "channel": "SMS",
  "whatsappAlertsEnabled": true,
  "soundboxStaySignedIn": true
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "sessionId": "otp_sess_a81d4e2b09c1",
    "phone": "+919875554321",
    "channel": "SMS",
    "resendAvailableInSeconds": 60,
    "simBindingVerified": true,
    "otp": "481920"
  },
  "requestId": "a81d4e2b-09c1-4ef5-8321-9502c427e392"
}
```

> **Note on OTP**: For smooth development and testing, the API directly returns the active 6-digit **`otp`** in the response `data.otp`. Postman automatically captures this into `{{otpCode}}` for 1-click verification! (It is also recorded in PostgreSQL table `mobile_otps`).

---

### 3. Validate Optional Referral Code
Validates a friend's referral code (e.g. `FRIEND100`) before completing signup.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/auth/validate-referral?phone=+919875554321`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "referralCode": "FRIEND100"
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Referral code validated successfully",
  "data": {
    "valid": true,
    "referralCode": "FRIEND100",
    "bonusCoins": 100,
    "message": "Referral code applied! You will get 100 bonus PINAK Coins after setup."
  }
}
```

---

# 📱 Screen 07 — Smart OTP Verification & Welcome Bonus Router

### 4. Smart Verify OTP
Verifies the 6-digit code.
- **New User**: Returns `isNewUser: true`, `nextScreen: "PROFILE_SETUP_SCREEN_08"`, and `onboardingToken`.
- **Returning User**: Bypasses setup, returns `isNewUser: false`, `nextScreen: "HOME_DASHBOARD"`, and full JWT `token`.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/auth/verify-otp`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "phone": "+919875554321",
  "otp": "482915",
  "sessionId": "SES-88AABBCC"
}
```

#### Response Body (200 OK — New User):
```json
{
  "success": true,
  "message": "OTP verified successfully. Proceed to compulsory profile setup.",
  "data": {
    "isNewUser": true,
    "onboardingToken": "eyJhbGciOiJIUzI1NiJ9.onboardingTokenSample",
    "token": null,
    "nextScreen": "PROFILE_SETUP_SCREEN_08",
    "welcomeBonus": {
      "coinsEarned": 100,
      "message": "Welcome Bonus Unlocked! Complete setup to credit 100 PINAK Coins."
    }
  }
}
```

---

# 📱 Screen 08 — Compulsory Profile Setup (with Optional Referral Code)

# 📱 Screen 08 — Compulsory Profile Setup (with Optional Referral Code)

### 5. Fetch Backend Categories for Preferences (Screen 08)
Returns active platform categories configured in the backend so customers can select shopping preference chips.
- **Method**: `GET`
- **URL**: `/api/v1/mobile/categories`
- **Headers**: `Accept: application/json`
- **Response**: List of active categories with `id`, `name`, `slug`, `icon`, `displayOrder`.

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111101",
      "name": "Food & Dining",
      "slug": "food-and-dining",
      "description": "Restaurants, Cafes & Food Outlets",
      "icon": "food-icon",
      "displayOrder": 1,
      "status": "ACTIVE"
    },
    {
      "id": "11111111-1111-1111-1111-111111111104",
      "name": "Retail & Shopping",
      "slug": "retail-and-shopping",
      "description": "Clothing, Electronics & Stores",
      "icon": "shopping-bag",
      "displayOrder": 4,
      "status": "ACTIVE"
    }
  ]
}
```

---

### 6. Complete Compulsory Profile Setup
Saves customer profile fields (`fullName`, `email`, `city`, `state`, `gender`, `address`, `birthday`, `categoryPreferences`) and optional `referralCode`. Unlocks the ₹100 welcome bonus (`WELCOME100`) and issues permanent customer JWT tokens.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/auth/complete-setup` *(alias: `/api/v1/mobile/profile/complete-setup`)*
- **Headers**:
  ```http
  Authorization: Bearer {{onboardingToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul.sharma@example.com",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "district": "Ahmedabad",
  "pincode": "380015",
  "gender": "MALE",
  "address": "101, Galaxy Heights, S.G. Highway",
  "birthday": "1998-05-15",
  "referralCode": "FRIEND100",
  "categoryPreferences": [
    "11111111-1111-1111-1111-111111111101",
    "11111111-1111-1111-1111-111111111104"
  ]
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Profile setup completed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "7f09c621-0a2b-4cd3-89ef-56789abcdef0",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "mobile": "+919876543210",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "district": "Ahmedabad",
      "pincode": "380015",
      "address": "101, Galaxy Heights, S.G. Highway",
      "gender": "MALE",
      "birthday": "1998-05-15",
      "referralCode": "PINAK8899",
      "role": "CUSTOMER",
      "profileCompleted": true
    },
    "welcomeBonusUnlocked": true,
    "rewardCoupon": {
      "code": "WELCOME100",
      "title": "Flat ₹100 Off First Order",
      "discountAmount": 100.0,
      "description": "Welcome to PINAK! ₹100 discount applied to your rewards wallet"
    },
    "nextScreen": "PERMISSIONS_CONSENT_SCREEN_09"
  }
}
```

---

### 6c. Instant Token Renewal (Refresh Access Token)
Used by mobile clients and Postman testing suites to rotate expired access tokens without re-requesting and verifying SMS OTP. Automatically returns a fresh 15-minute Bearer access token and rotates the refresh token.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/auth/refresh` *(aliases: `/api/v1/auth/refresh`, `/api/v1/mobile/auth/token/refresh`)*
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "refreshToken": "{{refreshToken}}"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshToken": "eyJhbGciOiJIUzM4NCJ9...",
    "user": {
      "id": "7f09c621-0a2b-4cd3-89ef-56789abcdef0",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "phone": "+919876543210",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": true
    }
  }
}
```
- **Postman Automation**: The collection test script automatically saves `jsonData.data.accessToken` to `{{accessToken}}` and `jsonData.data.refreshToken` to `{{refreshToken}}`. When an access token expires during testing, clicking **Send** on this request instantly restores access across the entire collection!

---

### 6b. Master India Location Endpoints (Address Cascading)

Directly mirrors the Admin and Web taxonomy from `indiaLocations.ts` and `IndiaAddressFields.tsx`:
`State ➔ District ➔ City ➔ Pincode ➔ Address`

#### 1. Get All States of India (`getAllStates`)
- **Method**: `GET`
- **URL**: `/api/v1/mobile/locations/states` (or `/api/v1/discovery/states`)
- **Auth**: None (Public)
- **Response Body**:
```json
{
  "success": true,
  "message": "States fetched successfully",
  "data": [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Delhi (NCT)",
    "Goa",
    "Gujarat",
    "Haryana",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
  ]
}
```

#### 2. Get Districts for State (`getDistrictsForState`)
- **Method**: `GET`
- **URL**: `/api/v1/mobile/locations/districts?state=Gujarat` (or `/api/v1/discovery/districts?state=Gujarat`)
- **Auth**: None (Public)
- **Response Body**:
```json
{
  "success": true,
  "message": "Districts fetched successfully",
  "data": [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udaipur",
    "Dahod",
    "Dang",
    "Devbhoomi Dwarka",
    "Gandhinagar",
    "Gir Somnath",
    "Jamnagar",
    "Junagadh",
    "Kheda",
    "Kutch",
    "Mahisagar",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Tapi",
    "Vadodara",
    "Valsad"
  ]
}
```

#### 3. Get Cities for District or State (`getCitiesForDistrictOrState`)
- **Method**: `GET`
- **URL**: `/api/v1/mobile/locations/cities/names?state=Gujarat&district=Ahmedabad` (or `/api/v1/discovery/cities/names`)
- **Auth**: None (Public)
- **Response Body**:
```json
{
  "success": true,
  "message": "Cities fetched successfully",
  "data": [
    "Ahmedabad",
    "Bavla",
    "Dhandhuka",
    "Dholera",
    "Dholka",
    "Mandal",
    "Sanand",
    "Viramgam"
  ]
}
```

#### 4. Lookup Location by 6-digit Pincode (`lookupPincode`)
- **Method**: `GET`
- **URL**: `/api/v1/mobile/locations/pincode/380015` *(or `/api/v1/mobile/locations/pincode?code=380015`)*
- **Auth**: None (Public)
- **Description**: Instant 0ms auto-fill lookup for any 6-digit Indian PIN code. Returns the resolved State, District, and City, plus the complete lists of `availableDistricts` and `availableCities` for instant dropdown population.
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Pincode details fetched successfully",
  "data": {
    "pincode": "380015",
    "state": "Gujarat",
    "district": "Ahmedabad",
    "city": "Ahmedabad",
    "availableDistricts": [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Surat",
      "Vadodara"
    ],
    "availableCities": [
      "Ahmedabad",
      "Bavla",
      "Dhandhuka",
      "Dholera",
      "Dholka",
      "Mandal",
      "Sanand",
      "Viramgam"
    ]
  }
}
```

---

# 📱 Screen 09 — Location & App Permissions Consent

### 7. Get Geo-Radar Preview
Returns nearby Soundbox merchant count and battery privacy shield before displaying permission dialogs.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/location/radar-preview?lat=12.9716&lng=77.6412`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Radar preview fetched successfully",
  "data": {
    "detectedZone": "Indiranagar, Bangalore",
    "nearbyMerchantCount": 38,
    "discountHighlight": "Up to 50% OFF live right now",
    "estimatedBatteryImpactPercentage": 5.0,
    "nearbyStores": [
      {
        "storeId": 201,
        "storeName": "Brew & Bites",
        "distanceText": "120m away",
        "hasSoundbox": true,
        "activeDiscountText": "30% OFF"
      },
      {
        "storeId": 202,
        "storeName": "Third Wave Coffee",
        "distanceText": "350m away",
        "hasSoundbox": true,
        "activeDiscountText": "BOGO DEAL"
      }
    ],
    "privacyShield": {
      "encryptsLocationData": true,
      "sharesWithThirdParties": false,
      "complianceNote": "NPCI & RBI compliance grade encryption"
    }
  }
}
```

---

### 8. Update Location & Flash Alert Permissions Consent
Saves precise location and flash alert soundbox permissions consent.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/location/update-permissions`
- **Headers**:
  ```http
  Authorization: Bearer {{mobileToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "preciseLocationGranted": true,
  "flashAlertsGranted": true,
  "latitude": 12.9716,
  "longitude": 77.6412
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Permissions updated successfully",
  "data": {
    "onboardingComplete": true,
    "userZone": "Indiranagar, Bangalore",
    "activeOffersCount": 38,
    "nextScreen": "HOME_DASHBOARD"
  }
}
```

---

# 📱 Screen 10 — Home Dashboard & Daily Streak Check-in

### 9. Fetch Home Feed Dashboard Payload
Returns header metadata, search bar placeholder, 9 UI section widgets, and 50 PINAK Coins check-in widget.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/home-feed?lat=12.9716&lng=77.6412`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Home feed fetched successfully",
  "data": {
    "header": {
      "locality": "Indiranagar Core",
      "city": "Bangalore",
      "pinakCoinsBalance": 1480,
      "unreadNotificationsCount": 3,
      "userAvatarLetter": "P"
    },
    "searchBar": {
      "placeholder": "Search cafes, salons, gyms, store",
      "voiceEnabled": true,
      "filterEnabled": true
    },
    "liveSavings": {
      "totalSavedAmount": 4250.0,
      "cashbackCoinsEarned": 1480,
      "subtitle": "Saved across 18 visits this month"
    },
    "dailyStreak": {
      "currentStreakDays": 3,
      "checkInRewardCoins": 50,
      "canCheckInToday": true,
      "weeklyProgress": [
        { "dayLabel": "Mon", "coinsReward": 50, "isCompleted": true, "isToday": false },
        { "dayLabel": "Tue", "coinsReward": 50, "isCompleted": true, "isToday": false },
        { "dayLabel": "Wed", "coinsReward": 50, "isCompleted": true, "isToday": true },
        { "dayLabel": "Thu", "coinsReward": 50, "isCompleted": false, "isToday": false },
        { "dayLabel": "Fri", "coinsReward": 100, "isCompleted": false, "isToday": false },
        { "dayLabel": "Sat", "coinsReward": 100, "isCompleted": false, "isToday": false },
        { "dayLabel": "Sun", "coinsReward": 250, "isCompleted": false, "isToday": false }
      ]
    }
  }
}
```

---

### 10. Claim Daily Streak Check-in Reward (50 PINAK Coins)
Claims today's daily streak check-in reward.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/profile/rewards/check-in`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Daily streak reward claimed successfully",
  "data": {
    "claimed": true,
    "coinsEarned": 50,
    "currentStreakDays": 4,
    "newBalance": 1530,
    "message": "Streak Day 4 completed! 50 PINAK Coins credited to your wallet."
  }
}
```

---

# 📱 Screen 11 — Merchant Discovery Feed & Interactive Map Radar View

### 11. Fetch Store Discovery Listing Feed
Returns location header, search bar, category chips, merchant listing cards (*Brew & Bites*, *Smokehouse Grill*, *Third Wave Roasters*, *Cult.Fit*, *Toscano*), and radius expansion notice. Supports search query `q`.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/stores/listing?q=cafe&lat=12.9716&lng=77.6412&radius=5000&viewMode=LIST&sort=nearest`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Store listing fetched successfully",
  "data": {
    "viewMode": "LIST",
    "totalStoresFound": 5,
    "summaryCountText": "5 places",
    "header": {
      "avatarLetter": "P",
      "isVerified": true,
      "coinsBalance": 1480,
      "locationText": "Indiranagar • Within 5 km",
      "activeDealsText": "42 Deals Live"
    },
    "searchBar": {
      "placeholder": "cafe",
      "voiceSearchEnabled": true,
      "filterEnabled": true
    },
    "categoryChips": [
      { "id": "cat-all", "name": "All", "isSelected": true },
      { "id": "cat-dining", "name": "Dining", "discountBadge": "40% OFF", "isSelected": false },
      { "id": "cat-cafes", "name": "Cafes", "discountBadge": "BOGO", "isSelected": false }
    ],
    "stores": [
      {
        "id": "store-101",
        "storeName": "Brew & Bites Cafe",
        "categorySubtext": "Specialty Coffee • Artisanal Bakery",
        "rating": 4.8,
        "ratingCountText": "(840)",
        "distanceText": "0.6 km",
        "statusText": "Open till 11:30 PM",
        "isVerified": true,
        "offerPills": ["Flat 30% OFF up to ₹400", "2X Coins Boost"],
        "paymentBadge": "PINAK Pay Accepted",
        "ctaText": "Claim & Pay",
        "imageUrl": "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
        "isBookmarked": false
      }
    ],
    "reachEndNotice": {
      "noticeText": "You've reached all nearby spots! Expand your search radius or change filters to discover more partner stores.",
      "buttonText": "Expand to 10 km",
      "targetRadiusMeters": 10000.0
    }
  }
}
```

---

### 12. Fetch Interactive Map Radar Pins
Returns GeoJSON map markers for the **Map Radar View** tab.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/stores/radar-map?lat=12.9716&lng=77.6412`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Radar map pins fetched successfully",
  "data": [
    {
      "storeId": "store-101",
      "storeName": "Brew & Bites Cafe",
      "latitude": 12.9736,
      "longitude": 77.6442,
      "categoryName": "Specialty Coffee",
      "discountBadge": "FLAT 30%",
      "ctaText": "Claim & Pay"
    }
  ]
}
```

---

### 13. Claim Offer / Book Session from Card CTA
Handles instant voucher reservation when tapping card CTAs (*Claim & Pay*, *Claim Offer*, *Book Session*).

- **Method**: `POST`
- **URL**: `/api/v1/mobile/stores/00000000-0000-0000-0000-000000000101/claim-offer`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Store offer claimed successfully",
  "data": {
    "success": true,
    "claimId": "CLM-A8B9C1D2",
    "storeId": "00000000-0000-0000-0000-000000000101",
    "storeName": "Brew & Bites Cafe",
    "offerTitle": "Flat 30% OFF up to ₹400",
    "voucherCode": "PINAK-BREW30",
    "coinsEarned": 50,
    "ctaAction": "PAY_AT_STORE"
  }
}
```

---

### 14. Toggle Store Bookmark / Favorite
Toggles bookmark state for a merchant store card.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/stores/00000000-0000-0000-0000-000000000101/bookmark`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Store bookmark toggled successfully",
  "data": {
    "storeId": "00000000-0000-0000-0000-000000000101",
    "storeName": "Store",
    "isBookmarked": true,
    "message": "Merchant saved to your bookmarks"
  }
}
```

---


# 🍽️ Screen 11 — Service & Store Detail View (The Smokehouse Grill)

### 14b. Fetch Store & Service Detail View (Production & Testing)
Returns the comprehensive store detail view payload when user clicks on a service card from the mobile home or discovery feed.
Includes Hero with 19 photos, 2X Coin incentive banner, sticky tabs, active pre-booking and walk-in offers, flash sale deals, 5 menu highlights with veg/non-veg indicator, 7-page menu scans, photo mosaic, verified amenities, GPS location, concierge support, similar places, and sticky bottom bar.

> **Automatic Fallback Dummy Data**: If the requested `storeId` is not found in the database (or when using `smokehouseStoreId` `e1000000-0000-0000-0000-000000000001`), the server automatically provides the full canonical dummy response for **The Smokehouse Grill** so testing in Postman or offline environments always succeeds with `200 OK`.

- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/v1/mobile/stores/{{smokehouseStoreId}}/detail?lat=12.9716&lng=77.6412`
- **Aliases**: `/api/v1/mobile/services/{storeId}/detail`, `/api/v1/discovery/stores/{storeId}/detail`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Query Parameters**:
  - `lat` (optional): Customer device latitude (e.g. `12.9716`)
  - `lng` (optional): Customer device longitude (e.g. `77.6412`)

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Store service detail fetched successfully",
  "data": {
    "id": "e1000000-0000-0000-0000-000000000001",
    "storeName": "The Smokehouse Grill",
    "merchantName": "The Smokehouse Grill Hospitality",
    "isVerified": true,
    "coverImageUrl": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    "heroPhotos": [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
    ],
    "totalPhotosCount": 19,
    "photoCounterText": "1/19",
    "distanceMeters": 4600.0,
    "distanceText": "4.6 km • Indiranagar",
    "cuisines": "North Indian, Italian, BBQ",
    "priceForTwoText": "₹1700 for two • Moderate",
    "cuisineAndPriceText": "North Indian, Italian, BBQ • ₹1700 for two • Moderate",
    "rating": 4.8,
    "ratingCountText": "1.2K ratings",
    "isOpenNow": true,
    "openStatusText": "Open till 00:30",
    "openingTime": "12:00",
    "closingTime": "00:30",
    "phone": "+919880011234",
    "latitude": 12.9715987,
    "longitude": 77.6411543,
    "address": "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
    "googleMapsUrl": "https://maps.google.com/?q=12.9715987,77.6411543",
    "coinPerkBanner": {
      "multiplier": "2X",
      "title": "Earn 5.00% PINAK Cashback Coins",
      "tag": "AUTO-APPLY",
      "badgeText": "2X BOOST"
    },
    "coinsPerkBanner": {
      "multiplier": "2X",
      "title": "Earn 5.00% PINAK Cashback Coins",
      "tag": "AUTO-APPLY",
      "badgeText": "2X BOOST"
    },
    "availableTabs": ["Offers", "Menu", "Photos", "Amenities", "Location"],
    "offersSection": {
      "activeOffersCountText": "4 Available",
      "primaryOffer": {
        "id": "e3000000-0000-0000-0000-000000000001",
        "title": "Flat 50% off on Pre-Booking & Dining",
        "subtitle": "Valid on minimum bill ₹1,000.00",
        "discountType": "PERCENTAGE_DISCOUNT",
        "discountValue": 50.00,
        "maxDiscountAmount": 500.00,
        "minimumOrderAmount": 1000.00,
        "badges": ["PINAK EXCLUSIVE", "Instant Confirm", "Special Deal"],
        "termsAndConditions": "Valid for pre-booked tables only. Maximum discount ₹500 on total food & soft beverages.",
        "redemptionType": "PRE_BOOK",
        "minAdvanceHours": 2,
        "ctaText": "Book & Pay",
        "isAutoApplied": true,
        "bonusCoins": 100,
        "minPartySize": 2,
        "maxPartySize": 8,
        "gracePeriodMinutes": 15,
        "slotTimes": "["12:30 PM","01:00 PM","01:30 PM","07:00 PM","07:30 PM","08:00 PM","08:30 PM"]",
        "isTableBookingEnabled": true
      },
      "preBookingOffers": [
        {
          "id": "e3000000-0000-0000-0000-000000000001",
          "title": "Flat 50% off on Pre-Booking & Dining",
          "discountValue": 50.00
        }
      ],
      "preBookOffers": [
        {
          "id": "e3000000-0000-0000-0000-000000000001",
          "title": "Flat 50% off on Pre-Booking & Dining",
          "discountValue": 50.00
        }
      ],
      "walkInOffers": [
        {
          "id": "e3000000-0000-0000-0000-000000000003",
          "title": "Flat 20% off Instant Bill Pass",
          "discountValue": 20.00
        }
      ],
      "greenPerkHighlight": "Unlock extra 100 PINAK Coins on bill payments above ₹1,000"
    },
    "menuHighlights": [
      {
        "name": "Wood-Fired Truffle Pizza",
        "price": 549.00,
        "isVeg": true,
        "category": "Italian Specialties"
      }
    ],
    "menuScans": [
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
    ],
    "amenities": [
      { "label": "Full Bar & Cocktails", "icon": "martini-glass" },
      { "label": "Valet Parking", "icon": "square-parking" },
      { "label": "Table Reservation", "icon": "calendar-check" },
      { "label": "PINAK UPI Instant Pay", "icon": "qrcode" },
      { "label": "Air Conditioned", "icon": "snowflake" },
      { "label": "Free High-Speed Wi-Fi", "icon": "wifi" }
    ],
    "similarPlaces": [
      {
        "id": "e1000000-0000-0000-0000-000000000002",
        "name": "Tipsy Turk - Rooftop",
        "rating": 4.3,
        "offerBadge": "Flat 40% off"
      }
    ],
    "bottomBar": {
      "rewardTeaser": {
        "icon": "🪙",
        "text": "Earn Coins on bill payment & table bookings",
        "badge": "MAX REWARD"
      },
      "isTableBookingEnabled": true,
      "primaryAction": {
        "type": "PAY_BILL",
        "label": "Pay Bill Now",
        "discountBadge": "50% OFF",
        "enabled": true
      },
      "secondaryAction": {
        "type": "BOOK_TABLE",
        "label": "Book a Table",
        "enabled": true
      }
    }
  }
}
```

---

### 14c. Fetch Product Detail View (Wood-Fired Truffle Pizza & Catalog Products)
Returns the rich product detail view payload when user taps on any culinary item or product card in the mobile application.
Includes:
- **Product Identity**: Unique UUID, Title, Brand, Quantity/Unit ("12-inch Hand-Stretched Crust • Serves 2-3"), and descriptions.
- **Gallery**: High-res product imagery and multi-photo carousel with photo count.
- **Pricing & Discounts**: MRP (`₹699.00`), Selling Price (`₹489.00`), Discount Percentage (`30%`), and Savings Amount (`₹210.00`).
- **Inventory & Dietary**: In-stock indicator, stock quantity, dietary tags (`VEG` / `NON_VEG`), and delivery ETA badge (`25-35 mins`).
- **2X Boost Coins Perk Banner**: Cashback percentage, earned PINAK gold coins calculation, and animated badge text.
- **Originating Merchant Store**: Verified seller badge, rating, live distance calculation (from GPS `lat`/`lng`), full address, and call concierge.
- **Key Culinary Highlights**: Bulleted chef craftsmanship facts and preparation standards.
- **Nutritional Facts**: Per-serving Calories, Carbs, Protein, and Fat.
- **Delivery & Pickup Options**: Instant express delivery threshold, free delivery minimum, and 15-min takeaway pickup status.
- **Customer Ratings & Reviews**: Comprehensive star distribution breakdown (5-star down to 1-star) and verified customer testimonials.
- **Cross-Selling & Recommendations**: "Frequently Bought Together" bundles (focaccia, cold brew) and "Similar Products" carousel (formaggi, margherita).
- **Sticky Bottom Buy Bar**: Quantity selector (min 1, max 10), Add to Cart primary action with live total price, and instant Buy Now checkout trigger.

> **Automatic Fallback Dummy Data**: If the database contains no matching product or when calling canonical test ID `f1000000-0000-0000-0000-000000000001`, the backend automatically renders the full canonical response for **Wood-Fired Truffle & Wild Mushroom Pizza**, ensuring zero downtime and 100% test reliability in Postman.

- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/v1/mobile/products/{{productId}}/detail?lat=12.9716&lng=77.6412`
- **Aliases**:
  - `{{baseUrl}}/api/v1/mobile/products/detail` (Auto-routes to canonical Wood-Fired Truffle Pizza)
  - `{{baseUrl}}/api/v1/products/{{productId}}/detail`
  - `{{baseUrl}}/api/v1/discovery/products/{{productId}}/detail`
- **Headers**:
  ```http
  Accept: application/json
  Authorization: Bearer {{mobileToken}}  (Optional: also works for unauthenticated guests)
  ```
- **Query Parameters**:
  - `lat` (optional): Customer device latitude (e.g. `12.9716`)
  - `lng` (optional): Customer device longitude (e.g. `77.6412`)

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Product detail fetched successfully",
  "data": {
    "id": "f1000000-0000-0000-0000-000000000001",
    "name": "Wood-Fired Truffle & Wild Mushroom Pizza",
    "brand": "The Smokehouse Kitchen",
    "unit": "12-inch Hand-Stretched Crust • Serves 2-3",
    "shortDescription": "Hand-stretched Neapolitan sourdough crust with San Marzano tomatoes, fresh buffalo mozzarella, sautéed forest porcini mushrooms, and drizzled with black truffle oil.",
    "longDescription": "Crafted using 48-hour fermented Italian 00 flour dough, baked at 450°C in our traditional oak wood-fired oven. Topped with imported Italian fior di latte, aged Parmigiano Reggiano, hand-picked wild porcini and shiitake mushrooms, finished with aromatic Umbrian black summer truffle oil and fresh basil.",
    "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "galleryImages": [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
    ],
    "totalPhotosCount": 5,
    "mrp": 699.00,
    "sellingPrice": 489.00,
    "discountPercent": 30,
    "savingsAmount": 210.00,
    "discountText": "Flat 30% OFF • Save ₹210",
    "currency": "INR",
    "currencySymbol": "₹",
    "inStock": true,
    "stockQuantity": 25,
    "stockStatusText": "In Stock • Delivered in 25-35 mins",
    "isVeg": true,
    "dietaryType": "VEG",
    "category": {
      "id": "c1000000-0000-0000-0000-000000000001",
      "name": "Gourmet Wood-Fired Pizzas",
      "slug": "gourmet-wood-fired-pizzas"
    },
    "tags": [
      "PINAK EXCLUSIVE",
      "BESTSELLER",
      "WOOD-FIRED",
      "ORGANIC INGREDIENTS"
    ],
    "rating": 4.8,
    "ratingCountText": "856+ reviews",
    "coinsPerkBanner": {
      "multiplier": "2X",
      "title": "Earn 5.00% PINAK Cashback Coins",
      "badgeText": "2X BOOST",
      "earnedCoinsText": "Earn 24 PINAK Gold Coins on this purchase"
    },
    "coinPerkBanner": {
      "multiplier": "2X",
      "title": "Earn 5.00% PINAK Cashback Coins",
      "badgeText": "2X BOOST",
      "earnedCoinsText": "Earn 24 PINAK Gold Coins on this purchase"
    },
    "storeInfo": {
      "id": "e1000000-0000-0000-0000-000000000001",
      "name": "The Smokehouse Grill",
      "isVerified": true,
      "rating": 4.8,
      "distanceText": "1.2 km away • Indiranagar",
      "address": "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
      "phone": "+919880011234",
      "isOpenNow": true
    },
    "keyHighlights": [
      "Baked in 450°C Italian Oak Wood-Fired Oven",
      "48-Hour Cold-Fermented Sourdough Base",
      "Imported Italian Buffalo Mozzarella & Umbrian Truffle Oil",
      "100% Vegetarian & No Artificial Preservatives"
    ],
    "nutritionFacts": {
      "Calories": "285 kcal",
      "Carbohydrates": "34g",
      "Protein": "12g",
      "Fat": "11g",
      "Serving Size": "1 Slice (approx 125g)"
    },
    "deliveryOptions": {
      "instantDeliveryAvailable": true,
      "deliveryTimeText": "Delivered in 25-35 mins",
      "freeDeliveryThresholdText": "Free delivery on orders above ₹499",
      "storePickupAvailable": true,
      "storePickupText": "Ready for takeaway in 15 mins"
    },
    "reviewsSummary": {
      "averageRating": 4.8,
      "totalReviews": 856,
      "breakdown": {
        "5_star": 720,
        "4_star": 102,
        "3_star": 24,
        "2_star": 6,
        "1_star": 4
      },
      "featuredReviews": [
        {
          "userName": "Ananya Roy",
          "userAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          "rating": 5,
          "date": "2 days ago",
          "comment": "Hands down the most authentic truffle pizza in Bengaluru! Crust was airy and charred to perfection.",
          "isVerifiedPurchase": true
        },
        {
          "userName": "Vikram Sethi",
          "userAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          "rating": 5,
          "date": "1 week ago",
          "comment": "The aroma of truffle oil when you open the box is incredible. Worth every penny with the 30% discount!",
          "isVerifiedPurchase": true
        }
      ]
    },
    "frequentlyBoughtTogether": [
      {
        "id": "f1000000-0000-0000-0000-000000000002",
        "name": "Artisanal Rosemary & Garlic Herb Focaccia",
        "price": 189.00,
        "mrp": 249.00,
        "rating": 4.7,
        "imageUrl": "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "f1000000-0000-0000-0000-000000000003",
        "name": "Single-Origin Nitro Cold Brew (330ml)",
        "price": 169.00,
        "mrp": 219.00,
        "rating": 4.8,
        "imageUrl": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80"
      }
    ],
    "similarProducts": [
      {
        "id": "f1000000-0000-0000-0000-000000000004",
        "name": "Four Cheese Quattro Formaggi Pizza",
        "price": 529.00,
        "mrp": 699.00,
        "rating": 4.7,
        "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "f1000000-0000-0000-0000-000000000005",
        "name": "Classic Neapolitan Margherita",
        "price": 399.00,
        "mrp": 499.00,
        "rating": 4.9,
        "imageUrl": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80"
      }
    ],
    "bottomBar": {
      "sellingPrice": 489.00,
      "mrp": 699.00,
      "savingsText": "Save ₹210.00",
      "minQuantity": 1,
      "maxQuantity": 10,
      "isCustomizable": true,
      "customizationText": "Customizable options available",
      "primaryAction": {
        "type": "ADD_TO_CART",
        "label": "Add to Cart • ₹489.00",
        "enabled": true
      },
      "secondaryAction": {
        "type": "BUY_NOW",
        "label": "Buy Now",
        "enabled": true
      }
    }
  },
  "requestId": "1b876eaa-b83b-4e09-88df-ee60b7148280"
}
```

---

# 📱 Screen 12 — Deal Details & Live Bill Calculator

### 15. Fetch Deal Details & Store Overview Feed
Returns hero store card (*Brew & Bites Artisan Cafe*), quick actions (*Directions*, *Call Store*, *View Menu*, *Share*), `2X PINAK BOOST ACTIVE` banner, exclusive deal vouchers, live calculator config, and store guarantees.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/deals/deal-30-off/details`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Deal details fetched successfully",
  "data": {
    "storeHeader": {
      "storeId": "store-101",
      "storeName": "Brew & Bites Artisan Cafe",
      "isVerified": true,
      "verifiedBadgeText": "Verified PINAK Partner",
      "categoryTags": ["TRENDING", "Artisanal Bakery", "Specialty Coffee"],
      "rating": 4.8,
      "ratingCountText": "(840+)",
      "distanceText": "0.6 km - Indiranagar",
      "operatingHoursText": "Open till 11:30 PM",
      "imageGalleryUrls": [
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24"
      ],
      "currentImageIndex": 1,
      "totalImages": 6
    },
    "quickActions": {
      "googleMapsUrl": "https://maps.google.com/?q=12.9716,77.6412",
      "phoneNumber": "+919876543210",
      "menuUrl": "https://cdn.pinakapp.com/menus/brew_bites_menu.pdf",
      "shareUrl": "https://pinak.app/deals/brew-bites-101"
    },
    "rewardBoostBanner": {
      "title": "2X PINAK BOOST ACTIVE",
      "description": "Earn 40 coins for every ₹100 settled via UPI",
      "boostMultiplier": 2.0
    },
    "exclusiveDeals": [
      {
        "id": "deal-30-off",
        "title": "30% OFF",
        "maxDiscountBadge": "Max ₹400",
        "subtitle": "Flat discount on entire dining bill",
        "minSpendText": "Min. spend ₹500",
        "rewardBadge": "+2X Coins",
        "isSelected": true
      }
    ],
    "liveCalculatorConfig": {
      "defaultBillAmount": 1200.0,
      "quickPresets": [850.0, 1200.0, 2400.0],
      "userCoinsBalance": 420,
      "coinsRedeemWorth": 50.0,
      "defaultCoinsChecked": true
    },
    "storeGuarantees": [
      {
        "id": "g1",
        "title": "Direct Merchant Settlement",
        "description": "No waiting for paper bill adjustments. Present your PINAK confirmation code directly at cashier desk."
      }
    ]
  }
}
```

---

### 16. Calculate Live Dynamic Bill Discount Breakdown
Dynamic live bill calculator: calculates instant flat discount (`-₹360`), coins redemption (`-₹50` for 100 coins), final payable amount (`₹790`), total savings (`Saving ₹410 today`), and 2X coins to earn (`316 Coins`).

- **Method**: `POST`
- **URL**: `/api/v1/mobile/deals/calculate-bill`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "storeId": "store-101",
  "dealId": "deal-30-off",
  "billAmount": 1200,
  "redeemCoins": true
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Bill calculation completed successfully",
  "data": {
    "storeId": "store-101",
    "selectedDealId": "deal-30-off",
    "appliedDealTitle": "Flat 30% OFF",
    "originalBillAmount": 1200.0,
    "dealDiscountAmount": 360.0,
    "coinsRedeemed": true,
    "coinsRedeemedCount": 100,
    "coinsDiscountAmount": 50.0,
    "userRemainingCoins": 320,
    "finalPayableAmount": 790.0,
    "totalSavingsToday": 410.0,
    "coinsToEarnOnPayment": 316,
    "boostBannerNotice": "2X PINAK BOOST ACTIVE — Earn 40 coins for every ₹100 settled via UPI",
    "checkoutButtonText": "Pay ₹790 via UPI",
    "savingsSummaryText": "Saving ₹410 today"
  }
}
```

---

### 17. Initiate UPI Payment Checkout
Generates UPI intent URL, transaction reference number, merchant VPA (`brewbites@pinakupi`), and QR payload when customer taps **`Pay ₹790 via UPI`**.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/deals/initiate-checkout`
- **Headers**:
  ```http
  Authorization: Bearer {{mobileToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "storeId": "store-101",
  "dealId": "deal-30-off",
  "billAmount": 1200,
  "redeemCoins": true,
  "paymentMethod": "UPI"
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "UPI checkout initiated successfully",
  "data": {
    "success": true,
    "checkoutId": "CHK-99AABBCC",
    "txnRefNumber": "TXN-1727710000000",
    "merchantName": "Brew & Bites Artisan Cafe",
    "merchantVpa": "brewbites@pinakupi",
    "amountPayable": 790.0,
    "totalSaved": 410.0,
    "coinsToEarn": 316,
    "upiIntentUrl": "upi://pay?pa=brewbites@pinakupi&pn=Brew%20&%20Bites%20Artisan%20Cafe&tr=TXN-1727710000000&am=790.0&cu=INR",
    "qrPayload": "upi://pay?pa=brewbites@pinakupi&pn=Brew%20&%20Bites%20Artisan%20Cafe&tr=TXN-1727710000000&am=790.0&cu=INR",
    "status": "PENDING_UPI_SETTLEMENT",
    "expiresAtText": "Valid for 15 minutes"
  }
}
```

---

# 📱 Screen 13 — Scan & Pay Merchant QR Checkout

### 18. Resolve Scanned Merchant QR Payload
Resolves scanned QR code string/VPA (`brewbites@okaxis` or `upi://pay?...`), returning detected merchant details (*Brew & Bites Cafe*), active saver perks (*Flat 30% OFF + 100 Coins*), default bill presets, supported UPI apps, and NPCI security badges.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/scan/resolve-qr`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "qrPayload": "upi://pay?pa=brewbites@okaxis&pn=Brew%20&%20Bites%20Cafe",
  "latitude": 12.9716,
  "longitude": 77.6412
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Merchant QR resolved successfully",
  "data": {
    "merchantHeader": {
      "storeId": "00000000-0000-0000-0000-000000000101",
      "merchantName": "Brew & Bites Cafe",
      "isVerified": true,
      "rating": 4.9,
      "localitySubtitle": "Indiranagar • Verified Pinak Partner",
      "merchantVpa": "brewbites@okaxis"
    },
    "activeSaverPerk": {
      "perkTag": "PINAK SAVER PERK",
      "statusTag": "Active Now",
      "offerHeadline": "Flat 30% OFF + 100 Coins",
      "description": "Applied automatically to this merchant bill.",
      "discountPercentage": 30.0,
      "bonusCoins": 100
    },
    "billCalculatorPresets": {
      "defaultAmount": 850.0,
      "quickAddChips": [500.0, 1000.0, 2000.0],
      "savingsPillText": "30% Saved at checkout"
    },
    "supportedUpiApps": ["GPAY", "PHONEPE", "PAYTM", "BHIM"],
    "securityGuarantee": {
      "title": "100% Direct Bank-to-Bank Transfer",
      "subtitle": "Zero convenience fee • 256-bit NPCI Certified Gateway"
    }
  }
}
```

---

### 19. Calculate In-Store Bill & Instant Savings
In-store calculation engine: takes merchant VPA & entered bill total (`₹850`), applies active perk (`30% OFF`), and returns final payable (`₹595`), savings (`₹255`), and coins to earn (`100 Coins`).

- **Method**: `POST`
- **URL**: `/api/v1/mobile/scan/calculate-pay`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "merchantVpa": "brewbites@okaxis",
  "storeId": "00000000-0000-0000-0000-000000000101",
  "billTotal": 850.0
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "In-store bill calculated successfully",
  "data": {
    "originalBillTotal": 850.0,
    "discountPercentage": 30.0,
    "discountAmount": 255.0,
    "finalPayableAmount": 595.0,
    "youSaveText": "You Save ₹255",
    "coinsToEarn": 100,
    "coinsEarnText": "+100 Pinak Coins",
    "payButtonText": "Pay ₹595 & Unlock Rewards"
  }
}
```

---

### 20. Initiate Multi-App Deep-Linked UPI Pay
Generates package-specific deep-linked UPI intent for selected app (`GPAY`, `PHONEPE`, `PAYTM`, `BHIM`), transaction reference, NPCI checksum, and expiration timer.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/scan/initiate-upi-pay`
- **Headers**:
  ```http
  Authorization: Bearer {{mobileToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "merchantVpa": "brewbites@okaxis",
  "storeId": "00000000-0000-0000-0000-000000000101",
  "billTotal": 850.0,
  "finalPayableAmount": 595.0,
  "selectedUpiApp": "GPAY"
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "UPI payment intent generated successfully",
  "data": {
    "transactionId": "TXN-SCAN-1727710000000",
    "txnRefNumber": "TR-1727710000000",
    "merchantVpa": "brewbites@okaxis",
    "merchantName": "Brew & Bites Cafe",
    "amountPayable": 595.0,
    "selectedUpiApp": "GPAY",
    "upiIntentUri": "upi://pay?pa=brewbites@okaxis&pn=Brew%20&%20Bites%20Cafe&tr=TR-1727710000000&am=595.0&cu=INR",
    "packageSpecificIntentUri": "intent://pay?pa=brewbites@okaxis&pn=Brew%20&%20Bites%20Cafe&tr=TR-1727710000000&am=595.0&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nfc.plugin.wallet.prod;end",
    "status": "INITIATED",
    "expiresInSeconds": 900
  }
}
```

---

# 📱 Screen 14 — Payment Success & Rewards

### 21. Fetch Payment Success Summary & Rewards Feed
Returns transaction receipt details (`₹595`), bank/UTR info (`UPI20260907994821`), unlocked savings (`₹255`), coins credited (`100`), scratch card status (`UNSCRATCHED`, up to `₹150`), and store rating state.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/payment/success/TXN-SCAN-1727710000000`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Payment success summary fetched successfully",
  "data": {
    "transactionId": "TXN-SCAN-1727710000000",
    "status": "SUCCESS",
    "statusTag": "VERIFIED INSTANT SETTLEMENT",
    "amountPaid": 595.0,
    "formattedAmount": "₹595",
    "merchantName": "Brew & Bites Artisan Cafe",
    "paymentSubtitle": "Paid via UPI to Brew & Bites Artisan Cafe",
    "savingsBanner": {
      "savedAmountText": "You Saved ₹255 on this bill!",
      "perkSubtext": "30% PINAK Saver Perk applied",
      "badgeText": "UNLOCKED",
      "totalSaved": 255.0
    },
    "transactionInfo": {
      "merchantReference": "Brew & Bites Artisan Cafe",
      "paymentMethodText": "🏦 HDFC Bank •••• 4092",
      "upiRefUtr": "UPI20260907994821",
      "dateTimeText": "07 Sep 2026, 8:45 PM",
      "autopayStatusTag": "UPI Autopay OK"
    },
    "coinsCredited": {
      "coinsCount": 100,
      "headlineText": "+100 PINAK COINS",
      "subtext": "Directly credited to your vault"
    },
    "mysteryScratchCard": {
      "scratchCardId": "SC-88776655",
      "title": "Mystery Merchant Cashback",
      "isExclusive": true,
      "status": "UNSCRATCHED",
      "bannerTitle": "Tap to Scratch & Reveal",
      "bannerSubtitle": "WIN UP TO ₹150 CASHBACK",
      "maxRewardAmount": 150.0,
      "revealedAmount": null
    },
    "merchantRating": {
      "storeId": "00000000-0000-0000-0000-000000000101",
      "storeName": "Brew & Bites Artisan Cafe",
      "localityText": "Koramangala 5th Block, Bengaluru",
      "rating": 4.8,
      "ratingCountText": "(4.8 / 1.2k)",
      "isOpen": true,
      "imageUrl": "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
      "userSubmittedRating": null
    },
    "quickActions": {
      "invoiceDownloadUrl": "/api/v1/mobile/payment/TXN-SCAN-1727710000000/invoice",
      "storeDetailsUrl": "/api/v1/mobile/stores/00000000-0000-0000-0000-000000000101"
    }
  }
}
```

---

### 22. Reveal Mystery Merchant Cashback Scratch Card
Unlocks scratch card, generates dynamic cashback reward (`₹45 Cashback`), credits user vault balance (`1630`), and returns revealed reward animation payload.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/payment/scratch-card/SC-88776655/reveal`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Scratch card revealed successfully",
  "data": {
    "scratchCardId": "SC-88776655",
    "status": "REVEALED",
    "rewardType": "CASHBACK",
    "rewardAmount": 45.0,
    "headline": "🎉 You Won ₹45 Cashback!",
    "subtext": "Credited directly to your linked HDFC Bank account",
    "updatedVaultBalance": 1630
  }
}
```

---

### 23. Submit Merchant Visit Rating & Review
Submits customer 1-5 star rating and optional feedback for the store visit post-payment.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/payment/rate-merchant`
- **Headers**:
  ```http
  Authorization: Bearer {{mobileToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "storeId": "00000000-0000-0000-0000-000000000101",
  "transactionId": "TXN-SCAN-1727710000000",
  "rating": 5,
  "feedbackText": "Great ambience and excellent artisanal coffee!"
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Merchant rating submitted successfully",
  "data": {
    "ratingId": "RAT-99887766",
    "storeId": "00000000-0000-0000-0000-000000000101",
    "rating": 5,
    "message": "Thank you for rating your visit to Brew & Bites Artisan Cafe!"
  }
}
```

---

### 24. Download Digital PDF Tax Invoice
Generates digital PDF tax invoice receipt metadata, line-item breakdown, and CDN download URL.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/payment/TXN-SCAN-1727710000000/invoice`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Invoice receipt metadata fetched successfully",
  "data": {
    "invoiceNumber": "INV-2026-0907-8899",
    "transactionId": "TXN-SCAN-1727710000000",
    "storeName": "Brew & Bites Artisan Cafe",
    "merchantGstin": "29AAAAA0000A1Z5",
    "date": "07 Sep 2026, 8:45 PM",
    "originalBillAmount": 850.0,
    "pinakDiscount": 255.0,
    "netPaid": 595.0,
    "taxAmount": 28.33,
    "downloadPdfUrl": "https://cdn.pinakapp.com/invoices/INV-2026-0907-8899.pdf"
  }
}
```

---

# 📱 Screen 15 — Rewards Vault & Mystery Scratch Cards

### 25. Fetch Rewards Vault & Coin Stash Feed
Returns VIP tier info (`VIP MASTER TIER`), coin stash balance (`1,450 🪙 Pinak Coins`), cash value equivalent (`₹725.00`), monthly goal progress (`₹3,420 Saved`, `68% of Goal`), scratch vault card list (`2 Ready`), check-in streak tracker (`+50 Coins TODAY`), spin wheel status (`1 Free spin available`), voucher redemptions catalog (`Starbucks`, `PVR`, `Amazon`), and recent coin ledger transactions.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/rewards/vault`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Rewards vault feed fetched successfully",
  "data": {
    "userTier": {
      "tierName": "VIP MASTER TIER",
      "tierBadge": "VIP MASTER TIER",
      "rulesUrl": "/api/v1/mobile/rewards/vault-rules"
    },
    "coinStash": {
      "availableCoins": 1450,
      "formattedCoins": "1,450",
      "cashSavingsValue": 725.0,
      "formattedCashSavings": "₹725.00 cash savings",
      "eligibleSpotsCountText": "at 180+ spots"
    },
    "monthlySavingsGoal": {
      "savedThisMonth": 3420.0,
      "savedThisMonthText": "₹3,420 Saved This Month",
      "percentileRankText": "Top 5% Super-Savers in Bangalore",
      "goalProgressPercentage": 68.0,
      "progressText": "68% of Goal"
    },
    "scratchVault": {
      "readyCount": 2,
      "readyCountText": "2 Ready",
      "cards": [
        {
          "cardId": "VC-55443322",
          "title": "Earn Up To 500 Coins",
          "subtitle": "Partner: Blue Tokai Coffee Roasters",
          "partnerName": "Blue Tokai Coffee Roasters",
          "status": "TAP_TO_REVEAL",
          "maxCoins": 500,
          "ctaText": "Rub & Scratch Now"
        }
      ]
    },
    "checkInStreak": {
      "streakDays": 5,
      "title": "5-Day Check-In Streak!",
      "xpBonusText": "+500 XP",
      "subtitle": "Check in 2 more days to trigger Sunday Gold Box",
      "days": [
        { "dayLabel": "M", "coins": 20, "isCompleted": true, "isToday": false, "isLocked": false },
        { "dayLabel": "TODAY", "coins": 50, "isCompleted": true, "isToday": true, "isLocked": false },
        { "dayLabel": "SUN", "coins": 250, "isCompleted": false, "isToday": false, "isLocked": true, "rewardBadge": "🎁 ₹250" }
      ]
    },
    "spinWheelWidget": {
      "title": "Lucky Pinak Spin Wheel",
      "subtitle": "1 Free daily spin available",
      "isAvailable": true,
      "buttonText": "Spin Now"
    },
    "coinRedemptions": [
      {
        "voucherId": "vouch-starbucks-100",
        "title": "Flat ₹100 Off",
        "brandName": "Starbucks",
        "subtitle": "Valid on all handcrafted beverages",
        "requiredCoins": 200,
        "usabilityText": "Instantly usable",
        "badgeText": "Popular",
        "buttonText": "Redeem"
      }
    ],
    "recentLedger": [
      {
        "txnId": "TXN-9812",
        "title": "Brew & Bites Cafe (Payment)",
        "dateText": "Yesterday, 8:45 PM",
        "referenceText": "Bill #PK-9812",
        "coinsDelta": 120,
        "formattedCoinsDelta": "+120 Coins",
        "type": "CREDIT",
        "description": "Earned 10%"
      }
    ]
  }
}
```

---

### 26. Scratch Vault Card
Scratches card from the vault, rolls random coin reward (up to 500 coins), updates user vault balance (`1800`), and returns revealed reward animation payload.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/rewards/scratch-vault/VC-55443322/scratch`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Vault card scratched successfully",
  "data": {
    "cardId": "VC-55443322",
    "status": "CLAIMED",
    "coinsWon": 350,
    "headline": "🎉 You Won 350 Pinak Coins!",
    "partnerName": "Blue Tokai Coffee Roasters",
    "updatedCoinsBalance": 1800
  }
}
```

---

### 27. Spin Lucky Pinak Wheel
Executes daily free lucky spin, generates wheel reward (`100 PINAK Coins`), updates coin balance (`1550`), and returns spin animation outcome.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/rewards/spin-wheel`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Lucky wheel spin executed successfully",
  "data": {
    "spinId": "SPIN-99887766",
    "rewardType": "COINS",
    "coinsWon": 100,
    "rewardHeadline": "🎰 Lucky Spin! You won 100 PINAK Coins!",
    "updatedCoinsBalance": 1550
  }
}
```

---

### 28. Redeem Coin Voucher
Deducts required coins from vault balance (`200 Coins`), issues instant brand voucher code (`STARBUCKS-100-PK99`), and returns voucher metadata.

- **Method**: `POST`
- **URL**: `/api/v1/mobile/rewards/vouchers/redeem`
- **Headers**:
  ```http
  Authorization: Bearer {{mobileToken}}
  Content-Type: application/json
  ```

#### Request Body:
```json
{
  "voucherId": "vouch-starbucks-100"
}
```

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Coin voucher redeemed successfully",
  "data": {
    "redemptionId": "RED-11223344",
    "voucherId": "vouch-starbucks-100",
    "brandName": "Starbucks",
    "voucherCode": "STARBUCKS-100-PK99",
    "coinsDeducted": 200,
    "remainingCoins": 1250,
    "expiryDateText": "Valid for 30 days",
    "redemptionInstructions": "Show code at cashier desk before payment."
  }
}
```

---

### 29. Download Coin Transaction Statement
Returns PDF statement download link and coin ledger summary for user accounting.

- **Method**: `GET`
- **URL**: `/api/v1/mobile/rewards/statement/download`
- **Headers**: `Authorization: Bearer {{mobileToken}}`

#### Response Body (200 OK):
```json
{
  "success": true,
  "message": "Ledger statement metadata fetched successfully",
  "data": {
    "statementId": "STMT-2026-09",
    "userCoinsBalance": 1450,
    "totalEarnedCoins": 3200,
    "totalRedeemedCoins": 1750,
    "downloadPdfUrl": "https://cdn.pinakapp.com/statements/STMT-2026-09.pdf"
  }
}
```



