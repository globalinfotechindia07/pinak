# STAGE 1 API INTEGRATION & ARCHITECTURE GUIDELINES
## Pinak Web Portal (Merchant & Admin) ↔ Spring Boot 3 Backend (`com.superapp`)
**Version:** 1.0 • September 2026  
**Frontend Stack:** React 19 + TypeScript + Vite + TanStack Query v5 + Axios + Zod + Sonner  
**Backend Stack:** Java 21 + Spring Boot 3 + Spring Data JPA + PostGIS + Redis  

---

## 1. Executive Summary & Purpose

This document defines the complete engineering blueprint for connecting the **Pinak Web Portal** to the **Stage 1 Spring Boot Core Backend**.

The goal is to deliver an enterprise-grade, high-performance integration that adheres to three core tenets:
1. **Zero UI Freezing ("Never Stuck"):** The interface must never hang, freeze, or display jarring full-screen loading spinners. We employ optimistic UI updates, stale-while-revalidate caching, request timeouts, and skeleton shimmer states.
2. **Defensive Security:** Token refresh mutex, sanitized inputs, strict role guards, and defense-in-depth API error handling.
3. **Modular Maintainability:** Strict separation between HTTP client, typed DTOs, TanStack Query hooks, and UI presentation components.

---

## 2. Directory & Architecture Standards

```
client/src/
├── api/                             # Network & Transport Layer
│   ├── client.ts                    # Central Axios instance (Base URL, Timeouts, Defaults)
│   ├── interceptors.ts              # Bearer auth injection & 401 Silent Token Refresh Mutex
│   ├── error.ts                     # Standardized API error parser & toast dispatch
│   ├── authApi.ts                   # Auth endpoints (Login, OTP, Refresh, Me)
│   ├── categoryApi.ts               # Category & Taxonomy endpoints
│   ├── merchantApi.ts               # Merchant Profile & KYC endpoints
│   └── storeApi.ts                  # Store Branch & PostGIS Location endpoints
│
├── types/
│   └── api/                         # Strict TypeScript DTO contracts
│       ├── common.ts                # Standard envelopes, pagination & errors
│       ├── auth.dto.ts              # Auth payloads & user identities
│       ├── category.dto.ts          # Category tree & parent-child structures
│       ├── merchant.dto.ts          # Merchant entity, KYC & UPI VPA details
│       └── store.dto.ts             # Branch model & GPS coordinates
│
├── hooks/
│   └── queries/                     # TanStack Query (React Query v5) Hooks
│       ├── useAuth.ts               # Login, registration, session queries
│       ├── useCategories.ts         # Cached category tree & optimistic mutations
│       ├── useMerchant.ts           # Profile & KYC query & mutation
│       └── useStores.ts             # Branch list, toggle status, map coordinate updates
│
└── components/
    └── feedback/                    # "Never Stuck" UI States
        ├── TableSkeleton.tsx        # Shimmer row placeholders for data grids
        ├── CardSkeleton.tsx         # Shimmer blocks for KPI cards & branches
        └── AsyncBoundary.tsx        # Error Boundary + Suspense fallback
```

---

## 3. Technology Stack & Decision Rationale

### 3.1 `@tanstack/react-query` (v5)
* **Why:** Eliminates full-page reloads and blocking spinners. Implements the *Stale-While-Revalidate (SWR)* pattern: cached data renders instantly in 0ms when navigating between views, while fresh data is silently fetched in the background.
* **Cache Strategy:**
  - `staleTime: 5 * 60 * 1000` (5 minutes before data is considered stale)
  - `gcTime: 15 * 60 * 1000` (Garbage collection retention for 15 minutes)
  - `refetchOnWindowFocus: false` (Prevents disruptive re-rendering while multitasking)
  - `retry: 1` (Fails fast on permanent errors; avoids infinite retry loops)

### 3.2 `axios` Client with Interceptors
* Automatic serialization of JSON request/response bodies.
* Hard timeout configured at **10,000ms (10 seconds)** to prevent orphaned pending promises.
* Request Interceptor: Automatically attaches `Authorization: Bearer <token>`.
* Response Interceptor: Catches 401 Unauthorized, locks parallel requests using a **Token Refresh Mutex**, fetches a new token via `/api/v1/auth/token/refresh`, and replays all queued requests seamlessly without logging the user out.

### 3.3 `zod` Schema Validation
* Validates user form inputs before network transmission.
* Protects client application state against unexpected nulls or malformed API responses.

---

## 4. Stage 1 API Specifications (Spring Boot `com.superapp`)

All requests carry the standard envelope structure:

```typescript
// Standard API Envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

### 4.1 Authentication Endpoints (`/api/v1/auth`)
| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `{ emailOrPhone, password, role }` | Unified password login for Merchant & Admin |
| `POST` | `/api/v1/auth/otp/request` | `{ phone, purpose: "LOGIN" \| "REGISTER" }` | Sends 6-digit OTP via SMS gateway |
| `POST` | `/api/v1/auth/otp/verify` | `{ phone, otp }` | Validates OTP and returns JWT tokens |
| `POST` | `/api/v1/auth/token/refresh`| `{ refreshToken }` | Silent JWT renewal |
| `GET`  | `/api/v1/auth/me` | *None (Bearer token)* | Returns active user profile & RBAC permissions |
| `POST` | `/api/v1/auth/logout` | `{ refreshToken }` | Revokes active refresh token |

### 4.2 Category Management Endpoints (`/api/v1/categories`)
| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET`  | `/api/v1/categories` | *None* | Returns category hierarchy (Parents & Subcategories) |
| `POST` | `/api/v1/categories` | `{ name, slug, parentId?, iconUrl, status }` | Creates category (Admin only) |
| `PUT`  | `/api/v1/categories/{id}` | `{ name, parentId?, iconUrl, status }` | Updates category metadata |
| `DELETE`| `/api/v1/categories/{id}`| *None* | Soft deletes or deactivates a category |

### 4.3 Merchant Profile & KYC Endpoints (`/api/v1/merchants`)
| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/merchants/register`| `{ businessName, categoryId, phone, upiVpa }`| Merchant self-registration |
| `GET`  | `/api/v1/merchants/profile` | *None (Bearer token)* | Returns merchant profile, KYC status, UPI VPA |
| `PUT`  | `/api/v1/merchants/profile` | `{ businessName, bankUpiId, kycDocs }` | Updates business info and KYC documents |
| `GET`  | `/api/v1/admin/merchants` | `?status=PENDING&page=0&size=20` | Admin queue of pending merchant approvals |
| `PATCH`| `/api/v1/admin/merchants/{id}/status` | `{ status: "APPROVED" \| "REJECTED", reason? }` | Admin approval action |

### 4.4 Store Branches & PostGIS Locations (`/api/v1/stores`)
| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET`  | `/api/v1/stores/my-stores` | *None (Bearer token)* | Lists all branches for authenticated merchant |
| `POST` | `/api/v1/stores` | `{ storeName, address, cityId, latitude, longitude, contactPhone }` | Creates store branch with coordinates |
| `PUT`  | `/api/v1/stores/{id}` | `{ storeName, address, latitude, longitude, ... }` | Updates branch details or location pin |
| `PATCH`| `/api/v1/stores/{id}/status` | `{ status: "ACTIVE" \| "TEMPORARILY_CLOSED" }` | Instant branch operational toggle |
| `GET`  | `/api/v1/stores/nearby` | `?lat=21.1458&lng=79.0882&radius=5000` | PostGIS spatial search test endpoint |

---

## 5. "Never Stuck" UX Strategy (Smooth & Instant Interactions)

1. **Optimistic Updates:**
   * When changing store operational status (`OPEN` ↔ `CLOSED`), the UI updates immediately in **0 milliseconds**.
   * TanStack Query retains the previous state in its rollback buffer. If the API fails or times out, the switch reverts and a clear error toast appears.
2. **Skeleton Screens Over Spinners:**
   * Full-page spinners disorient the user. Skeletons (`TableSkeleton`, `CardSkeleton`) outline the structure, indicating progress without layout shift.
3. **Debounced Search Queries (300ms):**
   * Filter bars and search inputs do not fire on every keystroke. Typing waits 300ms before sending network requests, eliminating API flooding.
4. **Resilient Error Toasting:**
   * Clear, human-readable error messages from the backend are displayed through Sonner toasts. Technical stack traces are never shown to the user.
5. **Request Cancellation via `AbortController`:**
   * If a user navigates away from a tab or changes search filters before the previous query completes, the obsolete request is immediately aborted to free up browser and server resources.

---

## 6. Security Hardening Specifications

### 6.1 Frontend Security Rules
* **Token Storage:** Access token is stored in memory / active session; refresh token is handled securely.
* **Token Refresh Mutex:** Prevents race conditions where multiple expired requests trigger multiple concurrent refresh token exchanges.
* **XSS Sanitization:** React JSX automatically escapes output; avoid `dangerouslySetInnerHTML`.
* **RBAC Route Guards:** Protected routes (`/merchant/*` and `/admin/*`) verify both the user's logged-in status and matching role before rendering children.

### 6.2 Spring Boot Backend Security Rules
* **Explicit CORS Configuration:**
  ```java
  @Configuration
  public class CorsConfig implements WebMvcConfigurer {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
          registry.addMapping("/api/**")
                  .allowedOrigins("http://localhost:5173", "http://localhost:3000", "https://portal.pinak.in")
                  .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                  .allowedHeaders("*")
                  .allowCredentials(true)
                  .maxAge(3600);
      }
  }
  ```
* **Rate Limiting:** Protect `/api/v1/auth/otp/request` and `/api/v1/auth/login` using Redis token buckets (e.g. maximum 3 OTP requests per phone per 15 minutes).
* **Global Exception Handling:** `@RestControllerAdvice` guarantees that internal 500 errors never leak SQL queries or class names.

---

## 7. Execution Checklist for Stage 1

- [x] Create comprehensive architectural guidelines document (`docs/STAGE_1_API_INTEGRATION_GUIDELINES.md`).
- [ ] Install `@tanstack/react-query` in `pinak-portal`.
- [ ] Implement central Axios client with Bearer injection and 401 token refresh queue.
- [ ] Define strict TypeScript API DTOs (`auth`, `category`, `merchant`, `store`).
- [ ] Implement HTTP API calling services.
- [ ] Implement TanStack Query hooks with optimistic updates and caching.
- [ ] Wrap application with `QueryClientProvider` configured for high-speed caching.
- [ ] Add `TableSkeleton` and `CardSkeleton` components.
- [ ] Connect `Login.tsx`, `CategoryManager.tsx`, and `BranchStores.tsx` to live hooks.
