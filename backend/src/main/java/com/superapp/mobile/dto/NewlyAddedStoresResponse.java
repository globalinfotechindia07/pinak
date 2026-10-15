package com.superapp.mobile.dto;

import java.util.List;

public class NewlyAddedStoresResponse {

    private String sectionTitle;
    private String sectionBadge;
    private List<NewlyAddedStoreCardDto> stores;

    public NewlyAddedStoresResponse() {
    }

    public NewlyAddedStoresResponse(String sectionTitle, String sectionBadge, List<NewlyAddedStoreCardDto> stores) {
        this.sectionTitle = sectionTitle;
        this.sectionBadge = sectionBadge;
        this.stores = stores;
    }

    public String getSectionTitle() {
        return sectionTitle;
    }

    public void setSectionTitle(String sectionTitle) {
        this.sectionTitle = sectionTitle;
    }

    public String getSectionBadge() {
        return sectionBadge;
    }

    public void setSectionBadge(String sectionBadge) {
        this.sectionBadge = sectionBadge;
    }

    public List<NewlyAddedStoreCardDto> getStores() {
        return stores;
    }

    public void setStores(List<NewlyAddedStoreCardDto> stores) {
        this.stores = stores;
    }
}
