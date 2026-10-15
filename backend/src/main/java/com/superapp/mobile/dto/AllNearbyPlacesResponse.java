package com.superapp.mobile.dto;

import java.util.List;

public class AllNearbyPlacesResponse {

    private String sectionTitle;
    private String sectionSubtitle;
    private long totalPlacesCount;
    private int currentPage;
    private int pageSize;
    private int totalPages;
    private boolean hasNext;
    private String activeSortFilter;
    private List<NearbyPlaceCardDto> places;

    public AllNearbyPlacesResponse() {
    }

    public AllNearbyPlacesResponse(String sectionTitle, String sectionSubtitle, long totalPlacesCount,
                                  int currentPage, int pageSize, int totalPages, boolean hasNext,
                                  String activeSortFilter, List<NearbyPlaceCardDto> places) {
        this.sectionTitle = sectionTitle;
        this.sectionSubtitle = sectionSubtitle;
        this.totalPlacesCount = totalPlacesCount;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = totalPages;
        this.hasNext = hasNext;
        this.activeSortFilter = activeSortFilter;
        this.places = places;
    }

    public String getSectionTitle() {
        return sectionTitle;
    }

    public void setSectionTitle(String sectionTitle) {
        this.sectionTitle = sectionTitle;
    }

    public String getSectionSubtitle() {
        return sectionSubtitle;
    }

    public void setSectionSubtitle(String sectionSubtitle) {
        this.sectionSubtitle = sectionSubtitle;
    }

    public long getTotalPlacesCount() {
        return totalPlacesCount;
    }

    public void setTotalPlacesCount(long totalPlacesCount) {
        this.totalPlacesCount = totalPlacesCount;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }

    public String getActiveSortFilter() {
        return activeSortFilter;
    }

    public void setActiveSortFilter(String activeSortFilter) {
        this.activeSortFilter = activeSortFilter;
    }

    public List<NearbyPlaceCardDto> getPlaces() {
        return places;
    }

    public void setPlaces(List<NearbyPlaceCardDto> places) {
        this.places = places;
    }
}
