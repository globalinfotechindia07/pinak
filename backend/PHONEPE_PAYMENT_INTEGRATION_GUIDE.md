# 🇮🇳 PhonePe Payment Gateway Integration Blueprint (PINAK SuperApp)

> **Document Status**: Architectural Reference & Implementation Guide  
> **Target Release**: Payment Phase (Post-Mobile API completion)  
> **Cost Model**: ₹0 Setup Fee • ₹0 Annual Maintenance (AMC) • 0% MDR on UPI Transactions

---

## 📌 Executive Summary
This document provides the complete, production-ready specification for integrating **PhonePe Payment Gateway (PG)** into the PINAK SuperApp ecosystem. It details sandbox credentials, API payloads, base64 encoding, SHA-256 `X-VERIFY` checksum algorithms, server-to-server webhook handling, and mobile UPI app-to-app intent triggering.

---

## 1. Credentials & Environments

### A. Free Developer Sandbox / UAT (Ready to use immediately)
* **API Base URL**: `https://api-preprod.phonepe.com/apis/pg-sandbox`
* **Merchant ID (MID)**: `PGTESTPAYUAT`
* **Salt Key**: `099eb0cd-02cf-4e2a-8aca-3e6c6aff0399`
* **Salt Index**: `1`
* **Auth**: No bearer token needed; all requests are authenticated via cryptographic checksum (`X-VERIFY`).

### B. Production / Live Environment (Post Business KYC)
* **API Base URL**: `https://api.phonepe.com/apis/hermes`
* **Sign-up Portal**: [business.phonepe.com](https://business.phonepe.com/)
* **KYC Requirements**:
  1. Company / Firm PAN & Certificate of Incorporation / GSTIN
  2. Authorized Signatory Aadhar & PAN
  3. Bank Account details with Cancelled Cheque (where customer money is settled)
* **Live Credentials Issued**: Custom `MERCHANT_ID`, unique `SALT_KEY`, and assigned `SALT_INDEX`.

---

## 2. End-to-End Payment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Mobile App: User taps "Pay ₹595 & Unlock Rewards"                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PINAK Backend: Creates internal ledger transaction & requests PhonePe    │
│    - Encodes JSON payload into Base64                                       │
│    - Calculates X-VERIFY = SHA256(Base64Payload + "/pg/v1/pay" + SaltKey)  │
│                            + "###" + SaltIndex                              │
│    - POST https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. PhonePe Response: Returns redirectUrl / UPI Intent URI                   │
│    - Example: upi://pay?pa=phonepe@yesbank&pn=Pinak&am=595.00&tr=TXN_...    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Mobile App: Opens Google Pay, PhonePe, Paytm, or BHIM                    │
│    - Customer enters their UPI PIN                                          │
│    - Bank deducts funds directly                                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Instant Server Webhook: PhonePe POSTs to PINAK Backend                   │
│    - URL: https://api.pinak.com/api/v1/payments/webhooks/PHONEPE            │
│    - Signature verified using SHA256                                        │
│    - Payment & Transaction status -> SUCCESS                                │
│    - Real-time rewards (Pinak Coins + Scratch Card) unlocked                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. API Specifications

### 1. Initiate Payment (`/pg/v1/pay`)

#### Raw Payload (Before Base64 Encoding):
```json
{
  "merchantId": "PGTESTPAYUAT",
  "merchantTransactionId": "TXN_PINAK_1727710000000",
  "merchantUserId": "USR_CUST_001",
  "amount": 59500,
  "redirectUrl": "https://api.pinak.com/api/v1/payments/redirect",
  "redirectMode": "POST",
  "callbackUrl": "https://api.pinak.com/api/v1/payments/webhooks/PHONEPE",
  "mobileNumber": "9876543210",
  "paymentInstrument": {
    "type": "UPI_INTENT",
    "targetApp": "com.phonepe.app"
  }
}
```
*(Note: Amount is specified in **paise**, so ₹595.00 = `59500`)*.

#### Checksum Algorithm (`X-VERIFY` Header):
```java
String base64Payload = Base64.getEncoder().encodeToString(rawJsonPayload.getBytes(StandardCharsets.UTF_8));
String stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
String sha256Hex = DigestUtils.sha256Hex(stringToHash);
String xVerifyHeader = sha256Hex + "###" + saltIndex;
```

#### Final Request Sent to PhonePe:
```http
POST /apis/pg-sandbox/pg/v1/pay HTTP/1.1
Host: api-preprod.phonepe.com
Content-Type: application/json
X-VERIFY: <sha256Hex>###1

{
  "request": "<base64Payload>"
}
```

#### PhonePe Response:
```json
{
  "success": true,
  "code": "PAYMENT_INITIATED",
  "message": "Payment Initiated",
  "data": {
    "merchantId": "PGTESTPAYUAT",
    "merchantTransactionId": "TXN_PINAK_1727710000000",
    "instrumentResponse": {
      "type": "UPI_INTENT",
      "intentUrl": "upi://pay?pa=phonepe@yesbank&pn=Pinak&am=595.00&tr=TXN_PINAK_1727710000000&mc=5411"
    }
  }
}
```

---

### 2. Check Transaction Status API (`/pg/v1/status`)
Used as a resilient fallback if a customer network disconnects before webhook arrival.

* **Method**: `GET`
* **URL**: `/apis/pg-sandbox/pg/v1/status/{merchantId}/{merchantTransactionId}`
* **Headers**:
  * `Content-Type: application/json`
  * `X-MERCHANT-ID: PGTESTPAYUAT`
  * `X-VERIFY`: `SHA256("/pg/v1/status/" + merchantId + "/" + merchantTransactionId + saltKey) + "###" + saltIndex`

---

### 3. Server Webhook Ingestion (`callbackUrl`)
When payment is completed by the customer, PhonePe's servers send an HTTP POST:

* **URL**: `POST /api/v1/payments/webhooks/PHONEPE`
* **Header**: `X-VERIFY: <sha256Hex>###<saltIndex>`
* **Body**:
```json
{
  "response": "<base64EncodedResponsePayload>"
}
```

#### Decoded Webhook Payload:
```json
{
  "success": true,
  "code": "PAYMENT_SUCCESS",
  "message": "Payment Successful",
  "data": {
    "merchantId": "PGTESTPAYUAT",
    "merchantTransactionId": "TXN_PINAK_1727710000000",
    "transactionId": "T2610141530129876543210",
    "amount": 59500,
    "state": "COMPLETED",
    "responseCode": "SUCCESS",
    "paymentInstrument": {
      "type": "UPI",
      "utr": "429188192019"
    }
  }
}
```

---

## 4. Backend Implementation Plan (When Ready)

When we start the payment task, the implementation will consist of:
1. **`PhonePePaymentProvider.java`**:
   * Implements existing `com.superapp.transaction.payment.provider.PaymentProvider`.
   * Houses payload generation, SHA-256 calculation, and HTTP calls using Spring's `RestClient` / `RestTemplate`.
2. **`application.yml` updates**:
   ```yaml
   app:
     payment:
       provider:
         phonepe:
           base-url: ${PHONEPE_BASE_URL:https://api-preprod.phonepe.com/apis/pg-sandbox}
           merchant-id: ${PHONEPE_MERCHANT_ID:PGTESTPAYUAT}
           salt-key: ${PHONEPE_SALT_KEY:099eb0cd-02cf-4e2a-8aca-3e6c6aff0399}
           salt-index: ${PHONEPE_SALT_INDEX:1}
           callback-url: ${PHONEPE_CALLBACK_URL:https://api.pinak.com/api/v1/payments/webhooks/PHONEPE}
   ```
3. **`PaymentWebhookController.java` updates**:
   * Add `X-VERIFY` support alongside `X-Webhook-Signature` and `X-Razorpay-Signature`.

---

## 5. Security & Idempotency Best Practices
* **SHA-256 Checksum Validation**: Reject any webhook if the computed hash does not match `X-VERIFY`.
* **Amount Matching**: Confirm that `data.amount / 100` strictly matches `payment.payableAmount`.
* **Idempotency**: Prevent duplicate coin credits if PhonePe retries the webhook using our existing `WebhookEventRepository.existsByProviderAndProviderEventId`.
