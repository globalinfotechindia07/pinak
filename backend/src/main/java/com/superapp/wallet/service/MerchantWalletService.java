package com.superapp.wallet.service;

import com.superapp.wallet.dto.*;
import com.superapp.wallet.entity.MerchantBankAccount;
import com.superapp.wallet.entity.MerchantWallet;
import com.superapp.wallet.entity.MerchantWalletLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface MerchantWalletService {

    MerchantWallet provisionWalletForMerchant(UUID merchantId);

    WalletSummaryResponse getWalletSummaryByMerchantId(UUID merchantId);

    Page<WalletLedgerResponse> getWalletLedger(UUID merchantId, UUID storeId, Pageable pageable);

    MerchantWalletLedger recordCustomerTransactionCredit(
            UUID merchantId,
            UUID storeId,
            UUID transactionId,
            BigDecimal grossAmount,
            BigDecimal commissionFee,
            String description,
            String sourceReference
    );

    List<StoreRevenueSummaryResponse> getStoreRevenueBreakdown(UUID merchantId);

    BankAccountResponse addBankAccount(UUID merchantId, CreateBankAccountRequest request);

    List<BankAccountResponse> getBankAccounts(UUID merchantId);

    MerchantBankAccount getBankAccountEntity(UUID bankAccountId);
}
