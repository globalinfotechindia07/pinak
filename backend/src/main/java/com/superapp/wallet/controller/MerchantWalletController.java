package com.superapp.wallet.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.wallet.dto.*;
import com.superapp.wallet.service.MerchantPayoutService;
import com.superapp.wallet.service.MerchantWalletService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant/wallet")
@PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STORE_MANAGER')")
public class MerchantWalletController {

    private final MerchantWalletService walletService;
    private final MerchantPayoutService payoutService;

    public MerchantWalletController(MerchantWalletService walletService, MerchantPayoutService payoutService) {
        this.walletService = walletService;
        this.payoutService = payoutService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<WalletSummaryResponse>> getWalletSummary(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        WalletSummaryResponse summary = walletService.getWalletSummaryByMerchantId(effectiveMerchantId);
        return ResponseEntity.ok(ApiResponse.success("Wallet summary retrieved successfully", summary));
    }

    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<Page<WalletLedgerResponse>>> getWalletLedger(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @PageableDefault(size = 20) Pageable pageable,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        Page<WalletLedgerResponse> page = walletService.getWalletLedger(effectiveMerchantId, storeId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Wallet ledger retrieved successfully", page));
    }

    @PostMapping("/payout")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> requestPayout(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @Valid @RequestBody CreatePayoutRequest request,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        UUID userId = extractUserId(principal);
        PayoutRequestResponse response = payoutService.requestPayout(effectiveMerchantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank payout requested successfully", response));
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<Page<PayoutRequestResponse>>> getMerchantPayouts(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @PageableDefault(size = 20) Pageable pageable,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        Page<PayoutRequestResponse> page = payoutService.getMerchantPayouts(effectiveMerchantId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Payout history retrieved successfully", page));
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<ApiResponse<BankAccountResponse>> addBankAccount(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @Valid @RequestBody CreateBankAccountRequest request,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        BankAccountResponse response = walletService.addBankAccount(effectiveMerchantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank account added and verified successfully", response));
    }

    @GetMapping("/bank-accounts")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getBankAccounts(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            Principal principal) {
        UUID effectiveMerchantId = merchantId != null ? merchantId : extractUserOrDemoMerchantId(principal);
        List<BankAccountResponse> list = walletService.getBankAccounts(effectiveMerchantId);
        return ResponseEntity.ok(ApiResponse.success("Bank accounts retrieved successfully", list));
    }

    private UUID extractUserOrDemoMerchantId(Principal principal) {
        // Fallback demo merchant ID for local UI prototyping if principal not tied directly
        return UUID.fromString("11111111-1111-1111-1111-111111111111");
    }

    private UUID extractUserId(Principal principal) {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
