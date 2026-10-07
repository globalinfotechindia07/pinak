# [Task] Frontend API Integration: Merchant Profile & KYC Module (CRUD, Documents, Admin Verification)

**Assignee:** Frontend Team Member  
**Module:** Merchant Portal (`/merchant/profile`) & Admin Portal (`/admin/merchants`)  
**Backend Reference:** Spring Boot `com.superapp.merchant` (`MerchantProfileController`, `AdminMerchantController`)  
**Status:** Ready for Development  
**Priority:** High  

---

## 1. Objective

Integrate the **Merchant Profile & KYC Management** screens in the web app with the live Spring Boot backend APIs. This includes reading real merchant business details, updating bank UPI VPAs, uploading KYC documents via multipart form data, and enabling Admin KYC approval/rejection workflows.

---

## 2. Target Spring Boot Backend Endpoints

The network layer (`client/src/api/client.ts` and `client/src/api/merchantApi.ts`) is already configured with Bearer token injection and timeouts. Connect to these endpoints:

### A. Merchant-Facing Endpoints (`MerchantProfileController.java`)
| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/merchant/profile` | *None (Bearer Token)* | Fetches business details, category, bank UPI VPA, and KYC status |
| `PUT` | `/api/v1/merchant/profile` | `UpdateMerchantProfileRequest` (JSON) | Updates business name, legal entity name, bank account, and UPI VPA |
| `POST` | `/api/v1/merchant/kyc` | `multipart/form-data` (`file`, `documentType`, `documentNumber`) | Uploads KYC verification documents (PAN, GSTIN, FSSAI, Udyam) |
| `POST` | `/api/v1/merchants/register` | `RegisterMerchantRequest` (JSON) | Self-registration endpoint for new businesses |

### B. Admin-Facing Endpoints (`AdminMerchantController.java`)
| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/merchants` | `?page=0&size=20&status=PENDING_REVIEW` | Paginated list of all merchants with status filters |
| `GET` | `/api/v1/admin/merchants/{id}` | *None* | Detailed view of a merchant with uploaded document URLs |
| `PATCH` / `POST` | `/api/v1/admin/merchants/{id}/approve` | *None* | Approves merchant KYC and sets status to `ACTIVE` |
| `PATCH` / `POST` | `/api/v1/admin/merchants/{id}/reject` | `{ "reason": "Document blurred" }` | Rejects KYC with formal reason |
| `PATCH` / `POST` | `/api/v1/admin/merchants/{id}/suspend` | `{ "reason": "Policy violation" }` | Suspends a merchant |
| `PATCH` / `POST` | `/api/v1/admin/merchants/{id}/activate` | *None* | Re-activates a suspended merchant |

---

## 3. Scope of Work (UI Components to Connect)

### Task 1: Connect `MerchantProfile.tsx` (`client/src/features/merchant/MerchantProfile.tsx`)
1. **Load Real Profile:** Replace static/seed data with `useMerchant()` hook (`useMerchantProfileQuery`).
2. **Handle Loading Skeleton:** Render `CardSkeleton` while `isLoading` is true so the page layout does not jump.
3. **Profile Form Submit:**
   * Wire the "Save Changes" / "Update Profile" button to `merchantApi.updateProfile(...)`.
   * Include fields: `businessName`, `legalEntityName`, `categoryId`, `bankUpiId`, `bankAccountNumber`, `bankIfsc`, `accountHolderName`.
   * Display Sonner toast on success or error.
4. **KYC Document Upload:**
   * Implement file input handler (`<input type="file" accept=".pdf,.png,.jpg,.jpeg" />`).
   * Append document to `FormData`:
     ```ts
     const formData = new FormData();
     formData.append("file", file);
     formData.append("documentType", docType); // e.g. "FSSAI", "GSTIN", "PAN"
     formData.append("documentNumber", docNumber);
     await merchantApi.submitKyc(formData);
     ```
   * Show upload progress and refresh KYC status badge (`UNDER_REVIEW`).

### Task 2: Connect `MerchantNetwork.tsx` (`client/src/features/admin/MerchantNetwork.tsx`)
1. **Live Admin Merchant Table:**
   * Fetch paginated list using `merchantApi.getMerchantsAdmin({ page, size, status: filterStatus })`.
   * Display real merchant count, category badges, bank UPI ID, and KYC review status (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
2. **Review & Approval Drawer:**
   * Clicking a merchant row displays their business details and clickable links to view uploaded KYC documents.
3. **Approve Action:**
   * Call `merchantApi.approveMerchantAdmin(merchantId)`.
   * Optimistically update the row badge to `APPROVED`.
4. **Reject Action:**
   * Open confirmation dialog requesting `reason`.
   * Call `merchantApi.rejectMerchantAdmin(merchantId, reason)`.
   * Optimistically update the row badge to `REJECTED`.

---

## 4. Technical Guidelines & Best Practices

1. **State & Caching:**
   * Use TanStack Query (`client/src/hooks/queries/useMerchant.ts`).
   * Invalidate query cache `["merchant", "profile"]` and `["admin", "merchants"]` on mutations.
2. **Zero-Stuck User Experience:**
   * Do not use full-screen blocking spinners. Use inline button loading states (`isUpdatingProfile`) and `TableSkeleton`.
   * Maintain the offline fallback: if backend is unreachable, display a toast and allow user to continue in sandbox mode.
3. **Type Safety:**
   * Import all DTO contracts from `client/src/types/api/merchant.dto.ts`.
   * Do not use `any` types for request or response payloads.

---

## 5. Acceptance Criteria

- [ ] Merchant can view their real business profile and KYC status loaded from `GET /api/v1/merchant/profile`.
- [ ] Merchant can update their Bank UPI VPA (`store@upi`) and verify it persists in PostgreSQL.
- [ ] Merchant can upload a KYC document (PDF/Image) via `POST /api/v1/merchant/kyc`.
- [ ] Admin can view pending KYC submissions at `/admin/merchants`.
- [ ] Admin can click **Approve**, successfully calling `/api/v1/admin/merchants/{id}/approve` and activating the merchant.
- [ ] Admin can click **Reject**, entering a reason that is sent to `/api/v1/admin/merchants/{id}/reject`.
- [ ] `pnpm check` passes with 0 TypeScript errors.
