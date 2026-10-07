# STAFF, ROLES & PERMISSIONS ARCHITECTURE SPECIFICATION
## Pinak Super-App Platform & Merchant Stores
**Version:** 1.0 • September 2026  
**Scope:** Super Admin Platform Team & Merchant Store/Shop Staff  

---

## 1. Executive Summary

This architecture establishes a two-tiered Role-Based Access Control (RBAC) and Granular Permission system:
1. **Tier 1 — Platform Super Admin Staff:** Operators, regional managers, and auditors who moderate the entire ecosystem.
2. **Tier 2 — Merchant Shop Staff:** In-store branch managers, desk cashiers, and billing staff assigned to specific store branches with locked security boundaries preventing access to bank accounts and KYC data.

---

## 2. Roles & Permissions Matrix

### 2.1 Tier 1: Platform Administration Roles (`SUPER_ADMIN`)
Managed via `/admin/settings` (Team & Access Management).

| Permission | `SUPERADMIN` | `REGIONAL_OPS` | `FINANCE_AUDITOR` | `SUPPORT_LEAD` |
|---|:---:|:---:|:---:|:---:|
| **Approve / Reject Merchants & KYC** | Yes | Yes | No | View Only |
| **Verify Store Branch Coordinates** | Yes | Yes | No | No |
| **Moderate & Approve Offers** | Yes | Yes | No | No |
| **View UPI Transactions & Settlements**| Yes | No | Yes | View Only (Masked) |
| **Manage Categories & Taxonomy** | Yes | Yes | No | No |
| **Platform Settings & Webhook Keys** | Yes | No | No | No |
| **View System Audit Logs** | Yes | Yes | Yes | No |

---

### 2.2 Tier 2: Merchant Shop / Branch Staff Roles
Managed via `/merchant` (Shop Staff & Roles).

> **CRITICAL SECURITY RULE:** Store staff (Cashiers, Managers) can **NEVER** view or edit the Merchant's Bank Account, UPI VPA (`store@upi`), or business KYC registration documents. Those are strictly locked to the Brand Owner.

| Permission | `STORE_MANAGER` | `CASHIER` | `BILLING_STAFF` | `MARKETING_LEAD` |
|---|:---:|:---:|:---:|:---:|
| **Scope of Access** | Assigned Branch | Assigned Branch Counter | Assigned Branch | All Outlets / Assigned |
| **Display Counter QR Standee** | Yes | Yes | No | Yes |
| **Access Live Billing Feed** | Yes | Yes (Today's Feed) | Yes (Read Only) | No |
| **Verify & Redeem Customer Discounts** | Yes | Yes | No | No |
| **Create & Pause Branch Offers** | Yes (Draft / Branch) | No | No | Yes |
| **Update Branch Operating Hours** | Yes | No | No | No |
| **View Branch Footfall & Revenue** | Yes | No | No | Yes (Offer stats) |
| **Edit Bank UPI VPA & Bank Details** | **LOCKED (No)** | **LOCKED (No)** | **LOCKED (No)** | **LOCKED (No)** |
| **Upload / View KYC Legal Docs** | **LOCKED (No)** | **LOCKED (No)** | **LOCKED (No)** | **LOCKED (No)** |
| **4-Digit POS Counter PIN Login** | Optional | **Yes** | **Yes** | No |

---

## 3. Database Schema Design (PostgreSQL)

### 3.1 Merchant Shop Staff Table (`merchant_staff`)
```sql
CREATE TABLE merchant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL, -- NULL indicates all branches
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(30) NOT NULL, -- 'STORE_MANAGER', 'CASHIER', 'BILLING_STAFF', 'MARKETING_LEAD'
    pin_hash VARCHAR(255),     -- bcrypt hash for 4-digit quick desk login
    permissions JSONB NOT NULL DEFAULT '{
        "canViewQR": true,
        "canViewBilling": true,
        "canApplyDiscounts": true,
        "canManageOffers": false,
        "canEditTimings": false,
        "canViewAnalytics": false,
        "canEditBankDetails": false,
        "canUploadKYC": false
    }'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_merchant_staff_merchant ON merchant_staff(merchant_id);
CREATE INDEX idx_merchant_staff_store ON merchant_staff(store_id);
CREATE INDEX idx_merchant_staff_user ON merchant_staff(user_id);
```

### 3.2 Platform Admin Staff Table (`admin_team_members`)
```sql
CREATE TABLE admin_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL, -- 'SUPERADMIN', 'REGIONAL_OPS', 'FINANCE_AUDITOR', 'SUPPORT_LEAD'
    permissions JSONB NOT NULL DEFAULT '{
        "approveMerchants": true,
        "approveStores": true,
        "approveOffers": true,
        "viewTransactions": false,
        "manageCategories": true,
        "manageSettings": false
    }'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INVITED', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);
```

---

## 4. REST API Endpoints Specification

### 4.1 Merchant Staff API (`/api/v1/merchant/staff`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/merchant/staff` | List all staff members for current merchant (`?storeId=...`) |
| `POST` | `/api/v1/merchant/staff` | Create a new staff member (Name, phone, storeId, role, PIN, permissions) |
| `PUT` | `/api/v1/merchant/staff/{id}` | Update assigned store, role, or permissions |
| `PATCH` | `/api/v1/merchant/staff/{id}/status` | Instant toggle between `ACTIVE` and `SUSPENDED` |
| `PATCH` | `/api/v1/merchant/staff/{id}/pin` | Reset 4-digit POS counter PIN |
| `DELETE`| `/api/v1/merchant/staff/{id}` | Revoke staff access completely |

### 4.2 Admin Staff API (`/api/v1/admin/users`)
*Already backed by `AdminController.java`:*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/users?role=ADMIN` | List all platform operators and team members |
| `POST` | `/api/v1/admin/users` | Invite and create new platform administrator / operator |
| `PATCH` | `/api/v1/admin/users/{userId}/role` | Update admin operational role |
| `PATCH` | `/api/v1/admin/users/{userId}/status` | Suspend or activate administrator account |
| `DELETE`| `/api/v1/admin/users/{userId}` | Delete user account |

---

## 5. Security & Isolation Invariants

1. **Owner Isolation:** A cashier's JWT token carries a claim `{"role": "STAFF", "merchantId": "...", "storeId": "...", "permissions": [...]}`. The Spring Boot backend automatically denies any call to `/api/v1/merchant/profile` (bank UPI VPA, KYC docs).
2. **Branch Spatial Enclosure:** Staff assigned to Store branch A cannot access the live redemptions of Store branch B.
3. **PIN Brute-Force Rate Limiting:** 4-digit counter desk PIN logins are restricted to 5 attempts per 15 minutes via Redis token bucket.
