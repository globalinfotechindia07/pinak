package com.superapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaginationMeta(
        int page,
        int size,
        long totalElements,
        int totalPages
) implements java.io.Serializable {
    public static PaginationMeta of(int page, int size, long totalElements, int totalPages) {
        return new PaginationMeta(page, size, totalElements, totalPages);
    }

    public static PaginationMeta of(org.springframework.data.domain.Page<?> page) {
        return new PaginationMeta(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
