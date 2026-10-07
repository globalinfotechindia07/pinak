# pinak-client

The web application is not just “some React pages.” It is effectively **two role-based applications sharing one React codebase**:

```
                    WEB APPLICATION
                           │
             ┌─────────────┴─────────────┐
             │                           │
       MERCHANT PORTAL              ADMIN PORTAL
             │                           │
      Merchant Dashboard          Admin Dashboard
      Merchant Profile            Merchant Approval
      Store Management             Store Approval
      Store Location               Offer Approval
      Offer Management             Category Management
      Transactions                 Transaction Monitoring
```

This matches the original project scope.

Below is the **full implementation process, architecture, security, coding standards, API integration, testing, deployment, Git workflow, performance and all important Do/Don't rules**.

---

# WEB FRONTEND — COMPLETE ENGINEERING PROCESS

## 1. Final Technology Stack

Use:

| Area | Technology |
| --- | --- |
| UI | React |
| Language | TypeScript |
| Build | Vite |
| Routing | React Router |
| State | Redux Toolkit |
| Server State | RTK Query |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP/API | RTK Query `fetchBaseQuery` |
| Styling | Project-approved UI system |
| Tables | Reusable server-side table |
| Maps | Map provider |
| Testing | Vitest + React Testing Library |
| E2E | Playwright |
| Lint | ESLint |
| Formatting | Prettier |
| Git Hooks | Husky + lint-staged |
| CI | GitHub Actions |
| Deployment | Docker + Nginx |

RTK Query is particularly appropriate here because it handles server-data fetching, caching, loading state and cache invalidation rather than forcing every API response into manually maintained Redux slices.

---

# 2. VERY IMPORTANT — One Web App, Two Portals

Do **not** create two completely separate React projects unless there is a later business requirement.

Use:

```
web/
└── one React application
```

with:

```
/merchant/*
/admin/*
```

This gives us:

- shared components
- shared API layer
- shared authentication
- shared design system
- shared validation
- shared utilities
- less duplicated code

But the authorization boundaries remain strict.

---

# 3. URL Architecture

Use clean role-based URLs.

```
/login

/merchant
/merchant/dashboard
/merchant/profile
/merchant/stores
/merchant/stores/new
/merchant/stores/:storeId
/merchant/stores/:storeId/edit
/merchant/offers
/merchant/offers/new
/merchant/offers/:offerId
/merchant/transactions

/admin
/admin/dashboard
/admin/merchants
/admin/merchants/:merchantId
/admin/stores
/admin/stores/:storeId
/admin/offers
/admin/categories
/admin/transactions
```

Avoid URLs such as:

```
/page1
/adminPage
/manage
/data
```

Routes should communicate their purpose.

---

# 4. Project Structure

I recommend this structure:

```
web/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── store.ts
│   │   └── providers.tsx
│   │
│   ├── api/
│   │   ├── baseApi.ts
│   │   ├── authApi.ts
│   │   ├── merchantApi.ts
│   │   ├── storeApi.ts
│   │   ├── categoryApi.ts
│   │   ├── offerApi.ts
│   │   └── transactionApi.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── modals/
│   │   ├── feedback/
│   │   └── maps/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── merchant/
│   │   ├── stores/
│   │   ├── offers/
│   │   ├── categories/
│   │   ├── transactions/
│   │   └── dashboard/
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── MerchantLayout.tsx
│   │   └── AdminLayout.tsx
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleRoute.tsx
│   │   ├── MerchantRoutes.tsx
│   │   └── AdminRoutes.tsx
│   │
│   ├── hooks/
│   │
│   ├── schemas/
│   │
│   ├── types/
│   │
│   ├── constants/
│   │
│   ├── utils/
│   │
│   ├── config/
│   │
│   └── styles/
│
├── .env.example
├── .gitignore
├── eslint.config.*
├── prettier.config.*
├── tsconfig.json
├── vite.config.ts
├── package.json
└── Dockerfile
```

---

# 5. Architecture Principle

The dependency direction should be:

```
Pages
  ↓
Features
  ↓
Hooks
  ↓
API / State
  ↓
Backend
```

Not:

```
Component
  ↓
random axios call
  ↓
backend
```

And definitely not:

```
Button
 ↓
axios
 ↓
Redux
 ↓
another axios
 ↓
component
```

Keep responsibilities separated.

---

# 6. Component Architecture

Build three levels.

## Level 1 — UI primitives

```
Button
Input
Select
Checkbox
Radio
Badge
Spinner
Tooltip
Dropdown
Modal
```

## Level 2 — reusable business components

```
DataTable
SearchInput
Pagination
ConfirmDialog
StatusBadge
MapPicker
FileUploader
DateRangePicker
ApprovalDialog
```

## Level 3 — feature components

```
MerchantTable
StoreTable
OfferTable
MerchantApprovalCard
StoreApprovalCard
TransactionTable
```

Pages compose these components.

---

# 7. Do NOT Build Giant Components

Bad:

```
MerchantDashboard.tsx
```

with 2,000+ lines containing:

- API calls
- forms
- tables
- modals
- validation
- business logic
- UI

Instead:

```
MerchantDashboard/
├── MerchantDashboardPage.tsx
├── components/
│   ├── Stats.tsx
│   ├── StoreSummary.tsx
│   └── OfferSummary.tsx
└── hooks/
    └── useMerchantDashboard.ts
```

---

# 8. TypeScript Rules

Use strict TypeScript.

```
{
  "compilerOptions": {
    "strict":true
  }
}
```

Rules:

### Do

```
interfaceStore {
  id:string;
  name:string;
}
```

### Don't

```
conststore:any=response.data;
```

Avoid `any`.

If a type is genuinely unknown:

```
unknown
```

then narrow it safely.

Redux Toolkit itself provides strong TypeScript integration and typed APIs.

---

# 9. API Architecture

Create **one RTK Query base API** for the web app unless there is a genuine need for different base URLs.

```
src/api/baseApi.ts
```

Conceptually:

```
baseApi
│
├── auth endpoints
├── merchant endpoints
├── store endpoints
├── category endpoints
├── offer endpoints
└── transaction endpoints
```

RTK Query recommends defining API endpoints centrally and using queries for reads and mutations for server-changing operations.

---

# 10. API Module Structure

```
api/
├── baseApi.ts
├── authApi.ts
├── merchantApi.ts
├── storeApi.ts
├── categoryApi.ts
├── offerApi.ts
└── transactionApi.ts
```

Example conceptual flow:

```
StoreListPage
      ↓
useGetStoresQuery()
      ↓
storeApi
      ↓
baseApi
      ↓
GET /api/v1/stores
```

---

# 11. API Contract Rule

Frontend must never invent the backend response.

If backend says:

```
{
  "id":"123",
  "storeName":"ABC Store"
}
```

frontend uses:

```
interfaceStore {
  id:string;
  storeName:string;
}
```

Don't silently rename it to:

```
name:string;
```

unless a deliberate mapper exists.

---

# 12. Request/Response Types

Keep API types separate.

```
types/
├── auth.ts
├── merchant.ts
├── store.ts
├── category.ts
├── offer.ts
└── transaction.ts
```

For example:

```
Store
CreateStoreRequest
UpdateStoreRequest
StoreListResponse
StoreDetailsResponse
```

Do not use one giant `StoreType` everywhere.

---

# 13. DTO vs UI Model

If backend data doesn't perfectly match what UI needs:

```
Backend DTO
     ↓
Mapper
     ↓
UI Model
```

Example:

```
StoreResponse
      ↓
mapStoreResponse()
      ↓
StoreViewModel
```

This prevents backend contract changes from contaminating the entire UI.

---

# 14. Authentication Architecture

Use:

```
Login
 ↓
Backend
 ↓
Session established
 ↓
Authenticated application
```

For browser applications, **do not put authentication tokens/JWTs in `localStorage` or `sessionStorage` as the default design**. OWASP specifically warns that JavaScript-accessible browser storage exposes tokens to XSS and recommends secure `HttpOnly` cookies or an appropriate BFF/session architecture.

For this project, I would prefer:

```
Browser
   ↓
Secure HTTPS
   ↓
HttpOnly + Secure + SameSite cookie
   ↓
Backend session/token handling
```

The exact implementation must match the backend authentication contract.

---

# 15. Authentication Flow

```
/login
   ↓
Submit credentials/OTP
   ↓
Backend
   ↓
Authenticated session
   ↓
GET current user
   ↓
Determine role
   ↓
 ┌───────────────┐
 │               │
MERCHANT        ADMIN
 │               │
 ↓               ↓
Merchant       Admin
Layout         Layout
```

---

# 16. Current User Endpoint

Have one authoritative current-user request.

Conceptually:

```
GET /api/v1/auth/me
```

Then:

```
user.id
user.role
user.status
user.permissions
```

The frontend should not determine the user's role from arbitrary local values.

---

# 17. Route Protection

Implement two layers.

### Authentication

```
ProtectedRoute
```

checks:

```
authenticated?
```

### Authorization

```
RoleRoute
```

checks:

```
ADMIN?
MERCHANT?
```

Example:

```
/admin/*
       ↓
authenticated?
       ↓
role === ADMIN?
       ↓
allow
```

But remember:

> This is only UX protection.
> 

The backend must enforce authorization. A user can manipulate the browser.

---

# 18. Never Trust Frontend Authorization

This is critical.

Never assume:

```
if (user.role==="ADMIN") {// therefore backend is safe
}
```

The backend must reject unauthorized API requests with:

```
403 Forbidden
```

Frontend simply reflects that state.

---

# 19. Logout

Logout must:

```
Invalidate server session/token
        ↓
Clear client authentication state
        ↓
Clear RTK Query cache
        ↓
Clear sensitive application state
        ↓
Redirect /login
```

OWASP recommends clearing application-managed session data and cached information during logout.

---

# 20. 401 Handling

Every authenticated API request needs consistent handling.

```
API request
   ↓
401?
 ┌─┴──────────┐
NO            YES
│              │
Continue       Session refresh/re-auth
               ↓
            success?
             /   \
           YES    NO
            │      │
          retry   logout
```

Do not duplicate this logic across every endpoint.

---

# 21. 403 Handling

```
403
 ↓
Permission denied UI
```

Do not redirect every 403 to login.

A `403` normally means:

> You are authenticated, but you are not allowed to perform this operation.
> 

---

# 22. CSRF

If authentication uses cookies, CSRF protection must be part of the architecture.

Frontend may need to send a backend-provided CSRF token/header depending on the backend implementation.

OWASP describes sending CSRF tokens through a dedicated request header for unsafe methods and explicitly advises against placing the CSRF token in browser local storage.

So:

```
Cookie authentication
+
CSRF protection
```

not:

```
Cookie authentication
+
nothing
```

---

# 23. XSS Protection

Never render user-controlled HTML blindly.

Avoid:

```
dangerouslySetInnerHTML
```

unless absolutely necessary and sanitized.

Potentially unsafe sources include:

- merchant names
- descriptions
- offer descriptions
- addresses
- query parameters
- URL values
- imported data

OWASP identifies DOM-based XSS as a risk when attacker-controlled data reaches dangerous DOM sinks.

---

# 24. Content Security Policy

Production should have a CSP appropriate to the application's actual dependencies.

At minimum, work with DevOps/backend to establish:

```
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
frame-ancestors
```

CSP is a defense-in-depth control against XSS, clickjacking and unauthorized script/resource loading.

---

# 25. Never Put Secrets in Frontend

Anything bundled into React is potentially visible to the user.

Therefore:

```
DO NOT:
DATABASE_PASSWORD
JWT_SECRET
PRIVATE_API_KEY
PAYMENT_SECRET
ADMIN_SECRET
```

# 26. Environment Management

---

If browser code can access it, the user can potentially access it.

does **not** mean secret.

```
VITE_*
```

Remember:

inside frontend environment variables.

If you want a **short non-negotiable rule sheet** for the developer, give them this:

# 27. Forms

---

Never secrets.

```
VITE_API_BASE_URL
VITE_MAP_PUBLIC_KEY
```

Only public configuration:

```
.env.development
.env.staging
.env.production
.env.example
```

Use:

# 28. Form Error Mapping

---

Backend validation remains authoritative.

Client validation improves UX.

```
Input
 ↓
Client validation
 ↓
Request
 ↓
Backend validation
 ↓
Success/Error
```

Flow:

```
React Hook Form
+
Zod
```

Use:

# 29. Form States

---

map them to the relevant form fields.

```
businessName → "Business name already exists"
pincode → "Invalid pincode"
```

If backend returns field errors:

```
Something went wrong.
```

Don't just show:

# 30. Duplicate Submission Protection

---

This prevents duplicate requests.

```
[Creating...]
```

becomes disabled:

```
[Create Store]
```

During submission:

```
idle
editing
submitting
success
error
```

Every form should have:

# 31. Tables

---

Backend must also implement idempotency where required.

But frontend protection is not sufficient.

to disable the action.

```
isLoading
```

Use:

- Payment-related actions
- Reject
- Approve
- Update
- Create

Especially for:

# 32. Server-Side Pagination

---

rather than creating a completely different table implementation for every screen.

```
DataTable<T>
```

Example:

```
columns
sorting
pagination
search
filters
loading
empty
error
row actions
responsive behavior
```

Build one reusable table system supporting:

Merchant/Admin applications will have many tables.

# 33. Server-Side Search

---

- transactions
- offers
- stores
- merchants

This matters particularly for:

then filtering 100,000 records in React.

```
GET /api/v1/merchants
```

not:

```
GET /api/v1/merchants?page=0&size=20
```

For potentially large datasets:

# 34. Debouncing

---

Don't download the entire database into the browser.

```
Search input
 ↓
debounce
 ↓
API
 ↓
server filtering
 ↓
results
```

Search should normally be backend-driven.

# 35. URL Query State

---

rather than five requests.

```
User types:
A
AB
ABC
ABC S
ABC St

        ↓

one API request
```

For example:

- remote filtering
- map search
- autocomplete
- search

Use debounce for:

# 36. Store Management

---

- browser back/forward works
- shareable
- bookmarkable
- refresh-safe

Benefits:

```
/admin/merchants?
status=PENDING
&page=2
&search=abc
```

Example:

Filters that users may want to share/bookmark should live in URL parameters.

# 37. Store Location

---

The architecture explicitly separates Merchant and Store, with location belonging to Store.

Store represents a **physical branch**.

```
Stores
 ↓
Store List
 ↓
Create Store
 ↓
Store Details
 ↓
Location
 ↓
Save
```

Merchant flow:

# 38. Coordinates

---

Never assume address text alone is accurate enough for discovery.

```
Address
 ↓
Geocode
 ↓
Map
 ↓
Pin
 ↓
Merchant adjusts pin
 ↓
latitude
longitude
 ↓
Save
```

Use a map picker.

# 39. Merchant Onboarding

---

in that order.

```
longitude
latitude
```

The backend/PostGIS design specifically notes that geographic point creation uses:

and ensure the frontend follows the backend coordinate convention.

```
latitude
longitude
```

Always maintain:

# 40. Onboarding Draft State

---

```
Registration
→ Business Details
→ Category
→ Store Details
→ Address / Map Pin
→ KYC
→ Admin Review
→ Approval
→ Discoverable
```

The defined business flow is:

```
Step 1
Registration

Step 2
Business Details

Step 3
Category

Step 4
Store

Step 5
Location

Step 6
KYC

Step 7
Review

Step 8
Submitted
```

Implement as a controlled multi-step workflow:

# 41. Offer Management

---

Do **not** invent frontend-only persistence for important business state.

But only implement this if the backend provides a draft/save contract.

so users can resume.

```
Step 1
 ↓
Save
 ↓
Step 2
 ↓
Save
```

Use:

If the backend supports it, don't force merchants to complete the entire form in one browser session.

Important improvement:

# 42. Admin Approval

---

```
CREATED
→ PENDING_APPROVAL
→ ACTIVE
→ EXPIRED
```

The defined offer lifecycle is:

```
Offers
 ↓
Create
 ↓
Draft
 ↓
Submit
 ↓
Pending Approval
 ↓
Active
 ↓
Expired
```

Merchant:

# 43. Admin Categories

---

Approval/rejection should not happen accidentally from a single click.

```
Reject Merchant?

Reason:
[________________]

[Cancel] [Reject]
```

Before destructive action:

```
Pending
 ↓
View Details
 ↓
Approve / Reject
```

Build reusable approval patterns.

# 44. Transaction Monitoring

---

Remember the backend model supports hierarchical categories using `parent_id`.

```
Category List
Create Category
Edit Category
Activate/Deactivate
Parent Category
Subcategory
```

Admin needs:

# 45. Dashboard

---

Use server-side filtering/pagination.

```
status
date range
merchant
store
transaction ID
```

Filters:

```
Transaction ID
Customer
Merchant
Store
Amount
Status
Date
```

Admin transaction table:

# 46. Global UI States

---

Advanced analytics are explicitly out of scope for this MVP.

```
Pending Merchants
Pending Stores
Pending Offers
Transactions
```

### Admin

```
Stores
Active Offers
Pending Offers
Transactions
KYC Status
```

### Merchant

For MVP:

Do not build a fake analytics platform.

# 47. Global Error Boundary

---

Never leave blank screens.

```
The requested store doesn't exist.
```

### Not Found

```
You don't have permission to perform this action.
```

### Permission

```
Unable to load stores.
[Retry]
```

### Error

```
No stores found.
```

### Empty

```
Skeleton / Spinner
```

### Loading

Every screen must support:

# 48. Logging

---

Do not expose stack traces to normal users.

```
Application
   ↓
ErrorBoundary
   ↓
Unexpected error
   ↓
Friendly error screen
   ↓
Retry
```

React-level unexpected errors should be caught.

# 49. Accessibility

---

Use a proper frontend error-monitoring system if introduced.

```
tokens
cookies
passwords
OTP
payment credentials
sensitive personal data
```

**Do not log:**

Production:

```
console.debug(...)
```

Development:

# 50. Responsive Design

---

is appropriate.

```
<button>
```

when a semantic:

```
<div onClick={...}>
```

Do not create:

- no keyboard traps
- screen readers
- sufficient contrast
- proper form errors
- accessible names
- labels
- semantic HTML
- visible focus
- keyboard navigation

Every important UI element should support:

# 51. Mobile Browser Support

---

Merchant/Admin dashboards should not depend on one fixed screen size.

At minimum.

```
Desktop
Laptop
Tablet
```

Web portal should support:

# 52. Performance

---

```
Login
View store
View offer
View transaction
```

At minimum:

Even if this is primarily a desktop portal, test the essential workflows on smaller screens.

# 53. RTK Query Cache Strategy

---

- virtualize very large tables
- avoid duplicate API requests
- cache API data
- debounce searches
- paginate large data
- memoize only when justified
- avoid unnecessary renders
- optimize images

Also:

load separately.

```
/login
/admin/*
/merchant/*
```

Use route-level lazy loading:

### Do

```
load every route immediately
```

### Don't

Major rules:

# 54. DO NOT Use Full Page Reloads

---

RTK Query provides cache tags and invalidation specifically for these patterns.

```
window.location.reload()
```

Instead of:

```
Create Store
 ↓
invalidate StoreList
 ↓
store list refreshes
```

Example:

```
Store
StoreList
Offer
OfferList
Merchant
Transaction
```

Conceptually:

Use tags.

# 55. Don't Put Everything in Redux

---

This produces a real application rather than a collection of server-rendered pages.

```
mutation
 ↓
invalidate cache
 ↓
RTK Query refetch
 ↓
UI updates
```

Prefer:

after every mutation.

```
window.location.reload();
```

Bad:

# 56. State Ownership

---

This separation is one of the most important architecture decisions.

```
Server data → RTK Query
Global client state → Redux
Local UI state → useState
Form state → React Hook Form
URL state → URL/search params
```

Use local component state for local UI state.

Use RTK Query for server state.

Use Redux for actual client/global state.

```
everythingStore.ts
```

Redux should not become:

# 57. API Status Standardization

---

This prevents unnecessary global state.

```
React Hook Form
```

### Form input

```
Redux/auth state
```

### Authenticated user

```
RTK Query
```

### Merchant API data

```
URL
```

### Search filter

```
useState
```

### Modal open/close

Example:

# 58. API Retry Strategy

---

Components should explicitly handle them.

```
data
isLoading
isFetching
isError
error
```

Every API hook should expose predictable states.

# 59. Security Headers / Deployment Cooperation

---

For important mutations, backend idempotency should be used where appropriate.

Automatic retries can create duplicate operations.

```
POST
PUT
PATCH
DELETE
```

Be careful with mutations:

Safe candidates may include transient GET requests.

Do not blindly retry every failed request.

# 60. CORS Rule

---

CORS is a backend/server concern, not something the React application can fix by adding a magic frontend header.

```
HTTPS
HSTS
CSP
X-Content-Type-Options
Referrer-Policy
frame-ancestors
secure cookies
CORS
```

Frontend developer and DevOps must jointly verify:

# 61. Build Configuration

---

Backend/Nginx must configure CORS correctly.

Those are response/server headers.

as a request header.

```
Access-Control-Allow-Origin
```

Frontend should **not** attempt:

# 62. Git Workflow

---

```
lint
typecheck
test
build
```

CI should run at least:

```
npm run preview
```

Preview:

```
npm run build
```

Build:

```
npm run typecheck
```

Type check:

```
npm run lint
```

Lint:

```
npm run test
```

Testing:

```
npm run dev
```

Development:

# 63. Commit Standards

---

The original project already defines feature branches, PR review and CI checks as the working model.

```
Issue
 ↓
Branch
 ↓
Development
 ↓
Local tests
 ↓
Push
 ↓
PR
 ↓
CI
 ↓
Code review
 ↓
develop
 ↓
Staging
 ↓
UAT
 ↓
main
```

Flow:

```
feature/FE-041-create-store
```

Example:

```
main
develop
feature/*
fix/*
hotfix/*
```

Use:

# 64. Pull Request Requirements

---

```
feat: add merchant store creation

feat: add admin merchant approval

fix: prevent duplicate store submission

fix: handle expired session

test: add merchant onboarding tests

refactor: extract reusable data table
```

Examples:

```
feat:
fix:
refactor:
test:
chore:
docs:
```

Use:

# 65. Definition of Done

---

```
[ ] TypeScript passes
[ ] ESLint passes
[ ] Tests pass
[ ] Build passes
[ ] No console errors
[ ] No secrets
[ ] Responsive checked
[ ] Accessibility checked
[ ] API contract verified
[ ] Error states handled
[ ] Loading states handled
[ ] Empty states handled
```

PR checklist:

```
What changed?
Why?
Which issue?
Screenshots?
API changes?
Testing performed?
Known limitations?
```

Every PR should contain:

# 66. Testing Pyramid

---

```
UI implemented
+
API integrated
+
TypeScript clean
+
Validation implemented
+
Loading state
+
Empty state
+
Error state
+
Authorization checked
+
Responsive
+
Accessibility
+
Tests
+
Lint
+
Build
+
Code review
```

It is complete only when:

A frontend issue is **not complete** just because the screen appears.

# 67. Unit Tests

---

Don't write everything as E2E.

```
                 E2E
                /   \
          Integration
             /       \
        Component Tests
           /           \
       Unit Tests
```

Use:

# 68. Component Tests

---

```
formatCurrency()
formatDate()
isOfferActive()
canApproveMerchant()
```

Example:

```
validators
formatters
mappers
permission helpers
selectors
utility functions
```

Test:

# 69. Integration Tests

---

Check behavior, not implementation details.

```
StoreForm
OfferForm
ApprovalModal
DataTable
LoginForm
StatusBadge
MapPicker
```

Test:

# 70. E2E Tests

---

```
Admin approval
 ↓
API
 ↓
Status changes
 ↓
Table refresh
```

and:

```
Store creation
 ↓
API
 ↓
Success
 ↓
Store list refresh
```

and:

```
Login
 ↓
Current User
 ↓
Merchant Dashboard
```

Important flows:

# 71. Security Testing

---

```
Admin login
 ↓
Transaction page
 ↓
Search
 ↓
Filter
 ↓
Open details
```

### Transaction

```
Merchant login
 ↓
Create offer
 ↓
Submit
```

### Offer

```
Login
 ↓
Merchant list
 ↓
Open pending merchant
 ↓
Approve
```

### Admin

```
Login
 ↓
Dashboard
 ↓
Create Store
 ↓
Set Location
 ↓
Submit
```

### Merchant

Minimum critical journeys:

# 72. Important Browser Storage Rule

---

OWASP specifically recommends checking browser storage for authentication tokens and sensitive business data because JavaScript-accessible storage can increase the impact of XSS.

```
XSS
CSRF
authentication bypass
authorization bypass
session expiry
logout
cookie flags
CORS
open redirects
URL manipulation
sensitive data in storage
sensitive data in logs
```

Before production test:

# 73. Production Security Checklist

---

If the backend architecture forces a different mechanism, that decision should be documented as a security exception rather than casually implemented.

OWASP explicitly recommends against storing authentication tokens/session identifiers in `localStorage` or `sessionStorage`.

```
localStorage:
accessToken
refreshToken
JWT
sessionId
password
OTP
```

### Avoid

For this web application:

# 74. Observability

---

```
[ ] HTTPS only
[ ] Secure cookies
[ ] HttpOnly cookies where applicable
[ ] SameSite configured
[ ] CSRF protection
[ ] CSP
[ ] XSS review
[ ] No secrets in JS bundle
[ ] No tokens in localStorage
[ ] No sensitive logs
[ ] Role-based backend authorization verified
[ ] CORS restricted
[ ] Error messages don't expose internals
[ ] Source maps handled according to policy
```

Before release:

# 75. Release Process

---

The overall project already includes logs, health checks, resource monitoring and payment failure monitoring at the infrastructure/backend level.

```
JWT
password
OTP
payment credentials
sensitive PII
```

But don't send:

```
JavaScript exceptions
API failures
route failures
major user-flow failures
```

Capture:

Frontend errors should be observable.

# 76. Docker Web Deployment

---

```
Developer PC
 ↓
FTP
 ↓
Production
```

Never:

```
Feature Branch
      ↓
PR
      ↓
CI
      ↓
Develop
      ↓
Staging
      ↓
QA
      ↓
UAT
      ↓
Production
```

Use:

# 77. React SPA Routing + Nginx

---

The architecture already specifies Nginx, Docker Compose, frontend/web container and the two backend containers on the Linux VPS.

```
Nginx
 ├── Web
 ├── Core API
 └── Transaction API
```

Backend:

```
Internet
   ↓
Nginx
   ↓
Web Container
```

Production:

# 78. Deployment Cache Strategy

---

Then React Router handles the route.

```
index.html
```

→

```
/admin/*
/merchant/*
```

So production must support SPA fallback:

directly, Nginx must serve the SPA entry point rather than returning a filesystem 404.

```
/admin/merchants/123
```

If user opens:

This is important.

# 79. Frontend Release Version

---

Otherwise users can receive stale application versions.

```
index.html
→ short/no-cache

assets/*.js
assets/*.css
→ long immutable cache
```

Recommended concept:

and hashed JS/CSS assets.

```
index.html
```

Be careful with:

# 80. Feature Flags

---

You immediately know which frontend build they are using.

> "The store page is broken."
> 

Useful when someone reports:

```
App Version: 1.0.0
Build: 20260909.123
```

Example:

Add application version information.

# 81. What NOT to Build

---

Simple environment/config-based flags are enough initially.

But don't build a complex feature-flag platform for MVP.

```
ENABLE_NEW_OFFER_FLOW
ENABLE_NEW_DASHBOARD
```

Example:

For risky functionality, consider feature flags.

# 82. Complete Web Development Sequence

---

These are explicitly outside the current MVP.

```
AI recommendations
advanced analytics
Elasticsearch UI
complex loyalty engine
cab/fleet dashboards
BBPS
recharge
bus booking
movie booking
Kafka event dashboard
microservice-specific frontend architecture
```

For this September MVP, don't let the web developer start adding:

# 83. Final Web Architecture

---

```
PHASE 1
│
├── WEB-001 Project initialization
├── WEB-002 TypeScript strict
├── WEB-003 ESLint + Prettier
├── WEB-004 Folder architecture
├── WEB-005 Environment configuration
├── WEB-006 React Router
├── WEB-007 Redux Toolkit
├── WEB-008 RTK Query
├── WEB-009 Base API
└── WEB-010 Common UI foundation

        ↓

AUTHENTICATION
│
├── WEB-011 Login
├── WEB-012 Session
├── WEB-013 Current user
├── WEB-014 Protected routes
├── WEB-015 Role routes
├── WEB-016 Logout
└── WEB-017 401/403 handling

        ↓

MERCHANT FOUNDATION
│
├── WEB-018 Merchant layout
├── WEB-019 Merchant dashboard
├── WEB-020 Merchant profile
└── WEB-021 Merchant onboarding

        ↓

STORE
│
├── WEB-022 Store list
├── WEB-023 Create store
├── WEB-024 Edit store
├── WEB-025 Store details
├── WEB-026 Map picker
└── WEB-027 Location validation

        ↓

ADMIN FOUNDATION
│
├── WEB-028 Admin layout
├── WEB-029 Admin dashboard
├── WEB-030 Merchant list
├── WEB-031 Merchant approval
├── WEB-032 Store list
└── WEB-033 Store approval

        ↓

CATEGORIES
│
├── WEB-034 Category list
├── WEB-035 Create category
├── WEB-036 Edit category
└── WEB-037 Category hierarchy

        ↓

OFFERS
│
├── WEB-038 Merchant offer list
├── WEB-039 Create offer
├── WEB-040 Edit offer
├── WEB-041 Offer status
└── WEB-042 Admin offer approval

        ↓

TRANSACTIONS
│
├── WEB-043 Merchant transactions
├── WEB-044 Admin transactions
├── WEB-045 Transaction search
├── WEB-046 Transaction filters
└── WEB-047 Transaction details

        ↓

QUALITY
│
├── WEB-048 Error handling
├── WEB-049 Loading states
├── WEB-050 Empty states
├── WEB-051 Accessibility
├── WEB-052 Responsive UI
├── WEB-053 Unit tests
├── WEB-054 Component tests
├── WEB-055 Integration tests
├── WEB-056 E2E tests
└── WEB-057 Security testing

        ↓

RELEASE
│
├── WEB-058 Production build
├── WEB-059 Docker
├── WEB-060 Nginx SPA routing
├── WEB-061 CI/CD
├── WEB-062 Staging deployment
├── WEB-063 UAT
├── WEB-064 Production deployment
└── WEB-065 Post-release validation
```

This is the order I would enforce.

# 84. The Most Important Rules to Give the Developer

---

```
                    React Web
                       │
              ┌────────┴────────┐
              │                 │
          MERCHANT            ADMIN
              │                 │
       ┌──────┼──────┐    ┌─────┼────────┐
       │      │      │    │     │        │
     Profile Stores Offers Merchants Stores Offers
                      │          │        │
                 Transactions Categories
```

And logically:

```
                         WEB
                          │
                    React + TS
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
    Routing            UI Layer          State Layer
       │                  │                  │
 React Router        Components          Redux
       │                  │                  │
       │                  │              RTK Query
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                       API Layer
                          │
                    HTTPS / REST
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
       Backend Core              Backend TX
             │                         │
             └────────────┬────────────┘
                          │
                    PostgreSQL
                     + PostGIS
                          │
                        Redis
```

The complete target architecture should be:
