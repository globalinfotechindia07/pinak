package com.superapp.transaction.transaction.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record TransactionPageResponse(
        List<TransactionListItemResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static TransactionPageResponse of(Page<TransactionListItemResponse> p) {
        return new TransactionPageResponse(
                p.getContent(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages()
        );
    }
}
