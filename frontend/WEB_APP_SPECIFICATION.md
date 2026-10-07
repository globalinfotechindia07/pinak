# TECHNICAL SPECIFICATION DOCUMENT: WEB APPLICATION
## Discount & Rewards Super-App — Merchant & Admin Portals
**Version:** 1.0 • September 2026  
**Stack:** React 19 + TypeScript • Vite • Tailwind / Radix UI • Nginx  
**Target Delivery:** 30 September 2026 (17-Day MVP)  
**Deployment:** Client Linux VPS (Docker + Nginx Reverse Proxy)

---

## 1. Executive Summary & Scope

The Web Application is a unified, role-based platform built with **React and TypeScript** serving two distinct operational portals from a single frontend codebase:

```
                            WEB APPLICATION
                         (React + TypeScript)
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   MERCHANT PORTAL                                   ADMIN PORTAL
   • Merchant Onboarding & KYC                       • Merchant Approval & KYC Review
   • Profile & Bank UPI VPA                          • Store Approval & Map Verification
   • Multi-Branch Store Management                   • Offer Governance & Moderation
   • Map Pinning & GPS Coordinates                   • Category & Subcategory Hierarchy
   • Offer Studio & Lifecycle Management             • Platform Transaction Monitoring
   • Counter QR Code Generation                      • Discovery Engine & Spatial Control
   • Live Billing & Transaction Feed                 • Audit Logs & Platform Settings
   • Loyalty & Merchant Dashboard                    • System Health & Analytics
```

### Primary Objectives
1. **Merchant Portal:** Enable businesses to register, manage multiple physical branches (stores) with precise geocoded coordinates, launch promotional discount offers, download counter QRs, and track real-time payments and customer redemptions.
2. **Admin Portal:** Empower the platform operations team to review and approve merchants, inspect and verify store locations, moderate offers, maintain taxonomy/categories, monitor financial transactions, and configure PostGIS spatial parameters.

---

## 2. Technology Stack & Architecture

### 2.1 Core Technologies
| Category | Technology | Details |
|---|---|---|
| **Framework** | React 19 | Fast component-based rendering |
| **Language** | TypeScript (Strict Mode) | Zero implicit `any`, typed API contracts |
| **Build Tool** | Vite | Instant HMR, optimized ES production bundles |
| **Routing** | Wouter / React Router | Lightweight, role-guarded client-side routing |
| **State & Caching** | React Context / RTK Query / TanStack Query | Server-state caching, loading states, cache invalidation |
| **Form Management** | React Hook Form | Performant uncontrolled inputs with validation |
| **Schema Validation** | Zod | Runtime validation for forms and API responses |
| **UI Components** | Radix UI Primitives | Accessible modals, popovers, dropdowns, tabs, dialogs |
| **Icons** | Lucide React | Consistent, scalable vector icons |
| **Charts & Analytics**| Recharts | Interactive SVG analytics dashboards |
| **Notifications** | Sonner | Clean toast alert system |
| **Styling** | Vanilla CSS + Design Tokens | Curated palettes, glassmorphism, responsive layouts |
| **Maps & Pinning** | Leaflet / Mapbox / Google Maps SDK | Interactive coordinate picker and branch geocoding |
| **Packaging** | Docker + Alpine Nginx | Multi-stage build for ultra-fast static file serving |

### 2.2 System Interaction Architecture
```
┌────────────────────────────────────────────────────────┐
│                   BROWSER CLIENT                       │
│    Merchant Portal (/merchant/*) | Admin Portal (/admin/*)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (Port 443)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   NGINX ON LINUX VPS                   │
│   • SSL Termination (Let's Encrypt TLS 1.3)            │
│   • Static SPA File Serving (try_files $uri /index.html) │
│   • Reverse Proxy: /api/v1/core/*    ──► Backend Core   │
│   • Reverse Proxy: /api/v1/tx/*      ──► Backend TX     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Security, Authentication & Role-Based Access Control (RBAC)

### 3.1 Authentication Flow
1. **Credentials/OTP Verification:** User logs in via `/login` with Phone Number + OTP or Email + Password.
2. **JWT Issuance:** Backend returns short-lived `accessToken` (15 min) and `refreshToken` (30 days) along with the user role (`MERCHANT` or `ADMIN`).
3. **Storage & Headers:**
   - `accessToken` is stored in browser memory/secure session state.
   - Sent on every request via `Authorization: Bearer <accessToken>`.
   - Automatic HTTP 401 interceptor triggers `/api/v1/auth/token/refresh`. If refresh fails, user is redirected to `/login`.
4. **Role Segregation:**
   - **`MERCHANT`:** Restricted strictly to `/merchant/*`. Accessing `/admin/*` redirects to `/merchant/dashboard`.
   - **`ADMIN`:** Platform operators with access to `/admin/*`. Access to audit logs, approvals, and platform metrics.
   - Unauthorized attempts display a dedicated 403 Forbidden state with return actions.

---

## 4. Merchant Portal Feature Specifications

### 4.1 Merchant Onboarding & KYC Profile
- **Registration Form:** Business Name, Registration Type (Proprietorship, LLP, Pvt Ltd), GSTIN (optional for micro-merchants), PAN, Primary Category.
- **Bank & UPI Details:** Merchant UPI VPA (e.g., `store@upi`), Account Holder Name, Bank Account Number & IFSC (used for direct bank-to-bank UPI routing).
- **KYC Document Upload:** Business license / Udyam registration / FSSAI certificate upload with live status tracker (`PENDING_SUBMISSION` → `UNDER_REVIEW` → `APPROVED` → `REJECTED`).

### 4.2 Multi-Branch Store Management
> **Domain Rule:** Merchant ≠ Store. A Merchant is the business entity; Stores are physical locations where customers redeem offers.

- **Store List View:** Overview of all operational branches, active status badge, address, city, and active offer count.
- **Store Creation / Edit Wizard:**
  - Branch Name (e.g., "Pinak Bistro - MG Road")
  - Contact number, operating hours (Opening/Closing time)
  - Full physical address: Street, City, State, Pincode
  - **Interactive Map Pinning:**
    - Live map interface allowing the merchant to drag-and-drop a map pin.
    - Reverse geocoding auto-fills latitude & longitude (`ST_MakePoint(lng, lat)` compatible).
    - Prevents discovery mismatches by ensuring coordinates match the real entrance.
- **Branch Operational Toggle:** Instant toggle between `OPEN` and `TEMPORARILY_CLOSED`.

### 4.3 Offer Studio & Lifecycle Management
- **Offer Types:**
  - `FLAT_PCT`: Percentage discount (e.g., 20% OFF up to ₹150)
  - `FLAT_AMT`: Flat rupee discount (e.g., ₹100 OFF on minimum bill ₹500)
  - `BOGO`: Buy One Get One Free promotion
- **Discount Rules:** Minimum Bill Amount, Maximum Discount Cap, Daily Usage Limit per Customer.
- **Store Association:** Single store, selected multiple stores, or all branch stores.
- **Validity Scheduling:** Date & time range (`valid_from` to `valid_to`).
- **Lifecycle Pipeline:**
  ```
  DRAFT ──► PENDING_APPROVAL ──► ACTIVE ──► EXPIRED / PAUSED
  ```

### 4.4 Counter QR Code Generator
- **Display & Export:** Generates high-resolution vector and printable static QR code for store checkout counters.
- **QR Payload:** Encodes the store ID and merchant UPI VPA.
- **Action Buttons:** Print Table Tent (PDF / SVG export) and Copy Direct Link.

### 4.5 Live Billing Feed & Transactions
- **Real-Time Feed:** Live table of customer redemptions showing:
  - Timestamp, Customer Phone (masked), Store Branch, Bill Amount, Discount Given, Net Payable, UPI Transaction Reference (UTR), Status (`SUCCESS`, `PENDING`, `FAILED`).
- **Date Range & Status Filters:** Quick filters for Today, Yesterday, This Week, Custom Date Range.
- **Export:** Instant CSV/Excel export for store accounting.

### 4.6 Merchant Analytics Dashboard
- **Key Performance Indicators:**
  - Total Revenue Today (₹)
  - Gross Redemptions & Bill Discounts
  - Average Order Value (AOV)
  - Total Footfall / Scans
- **Visual Charts:**
  - Daily Revenue & Redemptions Trend (Area Chart)
  - Branch Comparison Breakdown (Bar Chart)
  - Top Performing Offers (Progress Bars)

---

## 5. Admin Portal Feature Specifications

### 5.1 Platform Executive Dashboard
- **Platform Vital Stats:** Active Merchants, Operational Stores, Active Live Offers, 24h Transaction Volume (₹), System Health.
- **Actionable Queues:** Highlights pending approvals requiring immediate operator action.

### 5.2 Merchant Verification & KYC Moderation
- **Merchant Queue:** Filterable by `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`.
- **Review Drawer:** Side-by-side view of business legal details, PAN/GSTIN, uploaded KYC documents, and bank UPI VPA.
- **One-Click Actions:** `Approve Merchant`, `Reject with Reason`, `Request Document Re-upload`.

### 5.3 Store Location Verification & Geofence Inspection
- **Map Verification Tool:** Inspects store coordinates against official address to prevent fraudulent or misplaced pins.
- **Spatial Review:** View branch location on map alongside city boundaries and existing merchant density.
- **Branch Controls:** Suspend branch, mark as verified, or correct coordinates directly.

### 5.4 Offer Governance & Policy Moderation
- **Compliance Checks:** Ensures discount percentages comply with platform standards and predatory pricing rules.
- **Actions:** Approve for live discovery, Reject with merchant notification, Force expire active offers.

### 5.5 Category & Taxonomy Management
- **Hierarchy Tree:** Multi-level category structure:
  - Parent Categories (e.g., Food & Dining, Salon & Spa, Fitness, Retail)
  - Subcategories (e.g., Cafe, Fine Dining, Unisex Salon, Crossfit)
- **Metadata Management:** Icon selection, display order, active status, search keywords.

### 5.6 Real-Time Transaction Monitoring & Audit
- **Omni-Channel Stream:** Platform-wide transaction log covering all merchants and branches.
- **Fraud & Anomaly Detection:** Flags rapid repeated transactions from identical customer IDs or abnormal discount spikes.
- **Webhook Audit Logs:** Detailed inspection of PSP webhook signatures and callback response times.

### 5.7 Discovery Engine & Spatial Control
- **Spatial Configuration:** Adjust default discovery radius (e.g., 5000m), max search radius (25000m), geohash precision levels.
- **Cache Management:** Invalidate Redis nearby discovery cache upon new store activations.

### 5.8 Security & Audit Trail
- **Immutable Log:** Records every administrative action (who, what, timestamp, target entity, previous state, new state).

---

## 6. Route Architecture & Page Map

```
/login                                  ── Unified Login (Phone/Email + OTP/Password)
/404                                    ── Page Not Found

/merchant                               ── Redirects to /merchant/dashboard
/merchant/dashboard                     ── Business KPIs & live activity
/merchant/profile                       ── Business details, KYC & UPI VPA
/merchant/stores                        ── Multi-branch store list
/merchant/stores/new                    ── Add new branch with map coordinate pin
/merchant/stores/:id/edit               ── Edit branch details & coordinates
/merchant/offers                        ── Offer Studio & active campaigns
/merchant/offers/new                    ── Create promotion wizard
/merchant/qr                            ── Counter QR generator & print assets
/merchant/transactions                  ── Live billing feed & payment ledger
/merchant/loyalty                       ── Customer loyalty insights

/admin                                  ── Redirects to /admin/dashboard
/admin/dashboard                        ── Platform KPIs & pending review queues
/admin/merchants                        ── Merchant directory & KYC approvals
/admin/stores                           ── Store verification & spatial inspection
/admin/offers                           ── Offer governance & moderation queue
/admin/categories                       ── Category & subcategory manager
/admin/transactions                     ── Platform transaction monitoring & UTR check
/admin/discovery                        ── PostGIS radius & cache governance
/admin/audit-logs                       ── Immutable admin action logs
/admin/settings                         ── Platform workspace settings
```

---

## 7. Web API Integration Contracts

All endpoints are versioned under `/api/v1` and consumed via an authenticated client with standard envelope format.

### 7.1 Response Envelope Structure
```typescript
// Standard Success Envelope
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Standard Error Envelope
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 7.2 Web Endpoints Reference

#### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Email/password or phone authentication |
| `POST` | `/api/v1/auth/otp/request` | Request 6-digit OTP for phone number |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP; returns tokens and user roles |
| `POST` | `/api/v1/auth/token/refresh` | Exchange refresh token for fresh access token |
| `POST` | `/api/v1/auth/logout` | Invalidate current session tokens |

#### Merchant APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/merchant/profile` | Fetch authenticated merchant's business & KYC profile |
| `PUT` | `/api/v1/merchant/profile` | Update profile, bank account, and UPI VPA |
| `GET` | `/api/v1/merchant/stores` | List all branches belonging to merchant |
| `POST` | `/api/v1/merchant/stores` | Create a new branch with `latitude` & `longitude` |
| `PUT` | `/api/v1/merchant/stores/{id}` | Update branch details or location pin |
| `GET` | `/api/v1/merchants/{id}/qr` | Fetch static QR code payload for counter print |
| `GET` | `/api/v1/merchant/offers` | List all offers created by merchant |
| `POST` | `/api/v1/offers` | Submit new offer for approval |
| `PUT` | `/api/v1/offers/{id}` | Update or pause active offer |
| `GET` | `/api/v1/merchant/transactions` | Query merchant redemptions and settlements |
| `GET` | `/api/v1/merchant/analytics/dashboard`| Aggregate daily revenue, footfall, and AOV stats |

#### Admin APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard/stats` | Platform-wide counts, revenue, and queue sizes |
| `GET` | `/api/v1/admin/merchants` | Paginated list of all merchants with status filters |
| `PATCH`| `/api/v1/admin/merchants/{id}/status`| Approve, reject, or suspend a merchant |
| `GET` | `/api/v1/admin/stores` | Query all stores across merchants |
| `PATCH`| `/api/v1/admin/stores/{id}/status` | Verify or disable a store branch |
| `GET` | `/api/v1/admin/offers` | Moderation queue for offers |
| `PATCH`| `/api/v1/admin/offers/{id}/status` | Approve or reject a promotional offer |
| `GET` | `/api/v1/admin/categories` | Fetch category taxonomy tree |
| `POST` | `/api/v1/admin/categories` | Add/update category or subcategory |
| `GET` | `/api/v1/admin/transactions` | Platform-wide transaction stream with filters |
| `GET` | `/api/v1/admin/audit-logs` | Immutable audit log records |

---

## 8. Frontend Form Validation & Data Models

### 8.1 Store Creation Schema (Zod)
```typescript
import { z } from "zod";

export const StoreFormSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  branchCode: z.string().optional(),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),
  address: z.string().min(10, "Please provide complete street address"),
  cityId: z.string().min(1, "City selection is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format HH:mm"),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format HH:mm"),
  status: z.enum(["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"]).default("ACTIVE"),
});

export type StoreFormData = z.infer<typeof StoreFormSchema>;
```

### 8.2 Offer Creation Schema (Zod)
```typescript
export const OfferFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.enum(["FLAT_PCT", "FLAT_AMT", "BOGO"]),
  value: z.number().positive("Discount value must be greater than 0"),
  maxDiscount: z.number().nonnegative().optional(),
  minBillAmount: z.number().nonnegative().default(0),
  validFrom: z.string().datetime("Must be valid ISO timestamp"),
  validTo: z.string().datetime("Must be valid ISO timestamp"),
  storeIds: z.array(z.string()).min(1, "Select at least one store branch"),
  termsAndConditions: z.string().min(10, "Terms are required"),
}).refine(data => new Date(data.validTo) > new Date(data.validFrom), {
  message: "End date must be after start date",
  path: ["validTo"],
});

export type OfferFormData = z.infer<typeof OfferFormSchema>;
```

---

## 9. Deployment Architecture (Web Application Container)

The web frontend is built using Docker multi-stage builds and served via Nginx with client-side SPA routing support.

### 9.1 Multi-Stage Dockerfile (`Dockerfile.web`)
```dockerfile
# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Nginx Configuration (`web.conf`)
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression for high performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Single Page Application (SPA) fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Reverse proxy backend API calls
    location /api/ {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.3 Environment Variables
```ini
# Production environment (.env.production)
VITE_API_BASE_URL=https://api.superapp.in/api/v1
VITE_MAP_TILES_PROVIDER=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_APP_TITLE=Pinak Merchant & Admin Portal
VITE_ENABLE_ANALYTICS=true
```

---

## 10. Web Developer 17-Day MVP Implementation Schedule

| Phase | Working Days | Web Developer Scope & Deliverables |
|---|---|---|
| **Phase 1: Foundation** | 7–9 Sept | • Project scaffolding, Vite, TypeScript configuration<br>• Theme provider, styling design system tokens<br>• Unified `/login` screen with OTP & password input<br>• Role-based routing guards (`/merchant/*` vs `/admin/*`)<br>• Responsive dashboard shells (Sidebar, TopBar, UserProfile) |
| **Phase 2: Discovery & Stores** | 10–15 Sept | • Merchant business onboarding & KYC upload forms<br>• Multi-branch store management views<br>• Interactive map coordinate picker for store location<br>• Admin merchant verification & KYC approval workflow<br>• Admin store verification with map location inspector |
| **Phase 3: Offers & Transactions**| 16–23 Sept | • Merchant Offer Studio (Create, edit, pause discounts)<br>• Counter QR code modal with SVG/PDF export<br>• Admin offer governance & moderation queue<br>• Category & taxonomy management view<br>• Live billing feed & transaction history table with export |
| **Phase 4: Integration & Hardening**| 24–30 Sept | • End-to-end API integration with Backend Core & TX<br>• Form validation hardening (Zod schemas)<br>• Token refresh interceptors & error boundary alerts<br>• Multi-screen responsiveness (Tablet/Desktop/POS screen)<br>• Production Docker build & Nginx deployment on VPS |

---

## 11. Do's and Don'ts for the Web Development Team

### Do's:
1. **Always use Store for Location:** Remember that coordinates belong to the `Store` branch, never to the `Merchant` entity.
2. **Strict Currency Handling:** Format all prices as Indian Rupees (`₹`) with commas (`Intl.NumberFormat('en-IN')`). Never truncate decimals for financial transactions.
3. **Map Coordinate Order:** Ensure the map component passes `latitude` and `longitude` accurately to match backend PostGIS `ST_MakePoint(lng, lat)`.
4. **Resilient Data Tables:** Use server-side pagination, search debouncing (300ms), and empty/loading skeleton states on all tables.
5. **Session Safety:** Cleanly purge tokens from storage upon logout or persistent 401 unauthorized errors.

### Don'ts:
1. **Never hardcode API URLs:** Always use `import.meta.env.VITE_API_BASE_URL`.
2. **Never expose Admin routes to Merchants:** Maintain strict client-side route guards and verify that backend returns 403 on tampering.
3. **Do not store unencrypted PII:** Do not log user phone numbers, emails, or bank credentials to browser console.
4. **Do not create separate React repositories:** Maintain one unified code base for both portals with clean directory modularity (`features/merchant`, `features/admin`).
