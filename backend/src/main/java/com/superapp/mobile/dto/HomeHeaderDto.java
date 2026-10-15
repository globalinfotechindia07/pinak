package com.superapp.mobile.dto;

public class HomeHeaderDto {

    private String precinctName;
    private String cityState;
    private Integer coinBalance;
    private String rupeeValue;
    private Integer unreadNotificationCount;
    private String searchPlaceholder;
    private Boolean voiceSearchEnabled;
    private Boolean radarScanEnabled;

    public HomeHeaderDto() {
    }

    public HomeHeaderDto(String precinctName, String cityState, Integer coinBalance, String rupeeValue,
                         Integer unreadNotificationCount, String searchPlaceholder,
                         Boolean voiceSearchEnabled, Boolean radarScanEnabled) {
        this.precinctName = precinctName;
        this.cityState = cityState;
        this.coinBalance = coinBalance;
        this.rupeeValue = rupeeValue;
        this.unreadNotificationCount = unreadNotificationCount;
        this.searchPlaceholder = searchPlaceholder;
        this.voiceSearchEnabled = voiceSearchEnabled;
        this.radarScanEnabled = radarScanEnabled;
    }

    public String getPrecinctName() {
        return precinctName;
    }

    public void setPrecinctName(String precinctName) {
        this.precinctName = precinctName;
    }

    public String getCityState() {
        return cityState;
    }

    public void setCityState(String cityState) {
        this.cityState = cityState;
    }

    public Integer getCoinBalance() {
        return coinBalance;
    }

    public void setCoinBalance(Integer coinBalance) {
        this.coinBalance = coinBalance;
    }

    public String getRupeeValue() {
        return rupeeValue;
    }

    public void setRupeeValue(String rupeeValue) {
        this.rupeeValue = rupeeValue;
    }

    public Integer getUnreadNotificationCount() {
        return unreadNotificationCount;
    }

    public void setUnreadNotificationCount(Integer unreadNotificationCount) {
        this.unreadNotificationCount = unreadNotificationCount;
    }

    public String getSearchPlaceholder() {
        return searchPlaceholder;
    }

    public void setSearchPlaceholder(String searchPlaceholder) {
        this.searchPlaceholder = searchPlaceholder;
    }

    public Boolean getVoiceSearchEnabled() {
        return voiceSearchEnabled;
    }

    public void setVoiceSearchEnabled(Boolean voiceSearchEnabled) {
        this.voiceSearchEnabled = voiceSearchEnabled;
    }

    public Boolean getRadarScanEnabled() {
        return radarScanEnabled;
    }

    public void setRadarScanEnabled(Boolean radarScanEnabled) {
        this.radarScanEnabled = radarScanEnabled;
    }
}
