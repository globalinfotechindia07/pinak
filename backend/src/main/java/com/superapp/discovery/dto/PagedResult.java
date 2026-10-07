package com.superapp.discovery.dto;

import com.superapp.common.response.PaginationMeta;
import java.io.Serializable;
import java.util.List;

public record PagedResult<T extends Serializable>(
        List<T> content,
        PaginationMeta meta
) implements Serializable {
    public static <T extends Serializable> PagedResult<T> of(List<T> content, PaginationMeta meta) {
        return new PagedResult<>(content != null ? content : List.of(), meta);
    }
}
