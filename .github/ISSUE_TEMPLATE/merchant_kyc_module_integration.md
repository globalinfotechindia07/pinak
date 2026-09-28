---
name: "Merchant Profile & KYC Module Integration"
about: "Integrate Merchant Profile, KYC upload, and Admin Verification APIs with Spring Boot backend"
title: "[Task] Frontend API Integration: Merchant Profile & KYC Module (CRUD, Documents, Admin Verification)"
labels: ["enhancement", "api-integration", "merchant-portal", "admin-portal"]
assignees: []
---

## Objective
Integrate the **Merchant Profile & KYC Management** screens in the web app with the live Spring Boot backend APIs. This includes reading real merchant business details, updating bank UPI VPAs, uploading KYC documents via multipart form data, and enabling Admin KYC approval/rejection workflows.

## Target Spring Boot Backend Endpoints
- `GET /api/v1/merchant/profile` — Fetch business details, category, bank UPI VPA, and KYC status
- `PUT /api/v1/merchant/profile` — Update business profile details
- `POST /api/v1/merchant/kyc` — Multipart upload for KYC documents (PAN, GSTIN, FSSAI, Udyam)
- `GET /api/v1/admin/merchants` — Paginated list of all merchants with status filters
- `PATCH /api/v1/admin/merchants/{id}/approve` — Approve merchant KYC
- `PATCH /api/v1/admin/merchants/{id}/reject` — Reject KYC with reason payload

## Files to Update
- `client/src/features/merchant/MerchantProfile.tsx`
- `client/src/features/admin/MerchantNetwork.tsx`
- `client/src/hooks/queries/useMerchant.ts`
- `client/src/api/merchantApi.ts`

## Acceptance Criteria
- [ ] Merchant can view their real business profile and KYC status loaded from `GET /api/v1/merchant/profile`.
- [ ] Merchant can update their Bank UPI VPA (`store@upi`) and verify it persists in PostgreSQL.
- [ ] Merchant can upload a KYC document (PDF/Image) via `POST /api/v1/merchant/kyc`.
- [ ] Admin can view pending KYC submissions at `/admin/merchants`.
- [ ] Admin can click **Approve**, calling `/api/v1/admin/merchants/{id}/approve` and activating the merchant.
- [ ] Admin can click **Reject**, entering a reason sent to `/api/v1/admin/merchants/{id}/reject`.
- [ ] `pnpm check` passes with 0 TypeScript errors.
