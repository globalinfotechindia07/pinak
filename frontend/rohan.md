# Task Assignment & Technical Handover: Rohan

**Assignee:** Rohan  
**Module:** Merchant Onboarding, KYC Verification & Store Management API Integration (CRUD)  
**Project:** Pinak Super-App  
**Date:** 2026-09-29  
**Status:** In Progress / Ready for Integration  

---

## 1. Project Environment & Workspace Paths

| Component | Path | Port / URL |
| :--- | :--- | :--- |
| **Backend (Spring Boot 3)** | `C:\Users\globalinfotechindia\Documents\GII Workspace\Pinak\backend` | `http://localhost:8080` |
| **Frontend (React + Vite)** | `C:\Users\globalinfotechindia\Documents\GII Workspace\Pinak\frontend` | `http://localhost:3000` |
| **Database (PostgreSQL 18)** | Database: `superappdb` (User: `postgres`, Pass: `root`) | `localhost:5432` |

> [!NOTE]
> Vite is already configured to proxy all `/api/*` calls from `http://localhost:3000` directly to `http://localhost:8080`. You can make relative fetch / axios calls via `apiClient` in `client/src/api/client.ts`.

---

## 2. Seeded Database Data Available for Testing

The PostgreSQL database (`superappdb`) already contains live seed data matching the frontend mock records:

### 2.1 Test Accounts & Credentials
| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `riya.admin@pinak.app` | `Admin@123456` | Central platform administrator with root access |
| **Admin** | `admin@superapp.com` | `Admin@123456` | Platform admin account |
| **Merchant Owner** | `sunil@curryleaf.in` | `Merchant@123456` | Owner of **The Curry Leaf** (Active, Verified KYC) |
| **Merchant Owner** | `pooja@glowtheory.com` | `Merchant@123456` | Owner of **Glow Theory Studio** (Active, Verified KYC) |
| **Merchant Owner** | `vikram@stridefitness.in` | `Merchant@123456` | Owner of **Stride Fitness Club** (Active, Pending KYC) |
| **Merchant Owner** | `neha@bloombrew.in` | `Merchant@123456` | Owner of **Bloom & Brew** (Active, Verified KYC) |
| **Merchant Owner** | `anil@urbannest.in` | `Merchant@123456` | Owner of **Urban Nest Living** (Inactive, Submitted KYC) |
| **Store Branch** | `dharampeth@curryleaf.in` | `Merchant@123456` | Dharampeth Flagship Store Manager (PIN: `4821`) |

### 2.2 Seeded Database Records
* **5 Merchants**:
  - `a0000000-0000-0000-0000-000000000001` — The Curry Leaf (Category: Food & Dining)
  - `a0000000-0000-0000-0000-000000000002` — Glow Theory Studio (Category: Services & Salons)
  - `a0000000-0000-0000-0000-000000000003` — Stride Fitness Club (Category: Health & Fitness)
  - `a0000000-0000-0000-0000-000000000004` — Bloom & Brew (Category: Cafes & Bakeries)
  - `a0000000-0000-0000-0000-000000000005` — Urban Nest Living (Category: Retail & Shopping)
* **7 Branch Stores**:
  - `b0000000-0000-0000-0000-000000000001` — The Curry Leaf (Dharampeth Flagship)
  - `b0000000-0000-0000-0000-000000000002` — The Curry Leaf (Civil Lines Executive)
  - `b0000000-0000-0000-0000-000000000003` — The Curry Leaf (Koregaon Park Bistro)
  - `b0000000-0000-0000-0000-000000000004` — Glow Theory Studio (FC Road Lounge)
  - `b0000000-0000-0000-0000-000000000005` — Glow Theory Studio (Baner Luxe)
  - `b0000000-0000-0000-0000-000000000006` — Stride Fitness Club (Bandra West Center)
  - `b0000000-0000-0000-0000-000000000007` — Bloom & Brew (Aundh Coffee Roastery)
* **5 KYC Records**: GSTIN & PAN documents with verified / pending statuses in `merchant_kyc`.

---

## 3. Scope of Work (What Rohan Needs to Do)

Rohan's primary objective is to replace the mock memory service calls in the **Merchant & KYC** screens with real backend API calls.

### Task 1: Admin Merchant Network & KYC Review Integration
* **File to update:** `client/src/features/admin/MerchantNetwork.tsx`
* **APIs to call:**
  1. `GET /api/v1/admin/merchants?page=0&size=20&status=&approvalStatus=`
     - Use `merchantApi.getMerchantsAdmin()` in `client/src/api/merchantApi.ts`.
     - Displays live merchant accounts fetched from PostgreSQL.
  2. `PATCH /api/v1/admin/merchants/{merchantId}/approve`
     - Approve merchant registration and activate KYC verification status.
  3. `PATCH /api/v1/admin/merchants/{merchantId}/reject`
     - Rejects merchant application with a required reason (`AdminRejectMerchantRequest { reason: string }`).
  4. `PATCH /api/v1/admin/merchants/{merchantId}/suspend`
     - Suspends an active merchant account.

### Task 2: Merchant Profile & KYC Self-Submission
* **File to update:** `client/src/features/merchant/MerchantProfile.tsx`
* **APIs to call:**
  1. `GET /api/v1/merchant/profile`
     - Fetches currently authenticated merchant's business profile and bank UPI details.
  2. `PUT /api/v1/merchant/profile`
     - Saves updated legal name, business description, contact phone, website, and UPI VPA.
  3. `POST /api/v1/merchant/kyc` (Multipart)
     - Uploads GSTIN certificate, PAN document, and business registration details.

### Task 3: Store Branch CRUD Integration
* **File to update:** `client/src/features/merchant/BranchStores.tsx`
* **APIs to call:**
  1. `GET /api/v1/merchant/stores`
     - Returns branches owned by the logged-in merchant.
  2. `POST /api/v1/merchant/stores`
     - Creates a new store branch (`CreateStoreRequest`: storeName, address, cityId, state, pincode, latitude, longitude, phone).
  3. `PUT /api/v1/merchant/stores/{storeId}`
     - Edits store timings, contact details, and location coordinates.

---

## 4. API Client & Types Reference

* **Axios Instance with Bearer Token:** `client/src/api/client.ts`
* **Merchant API Methods:** `client/src/api/merchantApi.ts`
* **Store API Methods:** `client/src/api/storeApi.ts`
* **Auth API & Token Management:** `client/src/api/authApi.ts` & `client/src/api/interceptors.ts`

---

## 5. Verification Checklist for Rohan

- [ ] Log in as `admin@superapp.com` or `riya.admin@pinak.app` and verify `/api/v1/admin/merchants` loads 5 merchants.
- [ ] Test approving a pending merchant (e.g. `Stride Fitness Club` or `Urban Nest Living`). Verify status changes in the database.
- [ ] Log in as `sunil@curryleaf.in` and verify Merchant Profile loads `The Curry Leaf`.
- [ ] Create a new store branch in `BranchStores.tsx` and verify the new row appears in PostgreSQL `stores` table.
- [ ] Run `npx tsc --noEmit` in `Pinak/frontend` to ensure 0 TypeScript compilation errors.
