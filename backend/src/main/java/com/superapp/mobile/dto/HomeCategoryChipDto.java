package com.superapp.mobile.dto;

public class HomeCategoryChipDto {

    private String id;
    private String name;
    private String icon;
    private String tag;
    private Long storeCount;
    private Boolean isFilter;

    public HomeCategoryChipDto() {
    }

    public HomeCategoryChipDto(String id, String name, String icon, String tag, Long storeCount, Boolean isFilter) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.tag = tag;
        this.storeCount = storeCount;
        this.isFilter = isFilter;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public Long getStoreCount() {
        return storeCount;
    }

    public void setStoreCount(Long storeCount) {
        this.storeCount = storeCount;
    }

    public Boolean getIsFilter() {
        return isFilter;
    }

    public void setIsFilter(Boolean filter) {
        isFilter = filter;
    }
}
