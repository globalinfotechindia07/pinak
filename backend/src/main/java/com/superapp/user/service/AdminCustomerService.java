package com.superapp.user.service;

import com.superapp.user.dto.CustomerDtos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminCustomerService {

    Page<CustomerDtos.CustomerDirectoryResponse> getCustomers(
            String search,
            String status,
            String segment,
            String city,
            Pageable pageable
    );

    CustomerDtos.CustomerStatsResponse getCustomerStats();

    CustomerDtos.CustomerDetailResponse getCustomerDetails(UUID customerId);

    CustomerDtos.CustomerDirectoryResponse updateCustomerStatus(
            UUID customerId,
            String status,
            String reason,
            UUID adminUserId,
            String requestId
    );

    CustomerDtos.CustomerRewardSummary adjustCustomerRewardPoints(
            UUID customerId,
            int pointsDelta,
            String reason,
            UUID adminUserId
    );

    CustomerDtos.CustomerDirectoryResponse createCustomer(
            CustomerDtos.CreateCustomerRequest request,
            UUID adminUserId
    );
}
