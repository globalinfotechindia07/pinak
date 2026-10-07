# 🚀 PINAK Portal — Discovery Control Handover & Production Deployment Guide

## 1. Executive Summary
The **Discovery & Location Control** module (`/admin/discovery`) provides the Super Admin team with real-time operational control over customer-facing mobile search, PostGIS geofencing, territory expansion, and feed curation.

---

## 2. Architecture & Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Interactive Map** | **Leaflet 1.9 + OpenStreetMap** | Open-source, zero API keys, no Google Cloud billing limits, smooth dynamic radius rendering, custom brand pins & popups |
| **Frontend Framework** | **React 19 + Vite + Tailwind CSS** | Real-time state management, instant cross-tab sync via `BroadcastChannel`, 60fps slider updates |
| **Backend REST API** | **Java 21 + Spring Boot 3.3.4** | Port `8080`, Springdoc OpenAPI / Swagger, Bucket4j rate-limiting, JWT authentication |
| **Database & Spatial** | **PostgreSQL 15+ & PostGIS** | Flyway migration `V6` with spatial GiST indexing and composite index fallbacks |
| **Audit Ledger** | **Automated System Audit** | Every curation change (boosts, weights, territories) logs an immutable event |

---

## 3. Four Core Sub-Modules

### 🧭 1. Spatial Simulator & PostGIS Visualizer
* **Simulated Device Coordinates:** Test discovery as if you were a customer at any coordinate across India (*Nagpur, Pune, Mumbai, Bengaluru, Hyderabad, Delhi NCR*) or click **"Use My GPS"** to test from your physical phone/laptop.
* **Dynamic Search Radius:** 500m to 25km slider with live Haversine & PostGIS distance calculations.
* **Interactive Leaflet Map:** Displays the pulsing customer pin, soft-shaded search radius boundary, and numbered pins for all matching store outlets.
* **Ranked Mobile Feed:** Real-time list of stores sorted by proximity, with walking time estimates (*e.g., ~4m walk*), merchant rating, active discount badges, and an **"Inspect Store"** quick-view drawer.
* **PostGIS Query Telemetry:** Live preview of the actual PostGIS `ST_DWithin` & `ST_Distance` query and spatial execution latency.

### 🌐 2. Operating Cities & Geofencing Master Data
* **Territory Coverage:** View, activate, and deactivate operating cities where customer discovery and merchant onboarding are supported.
* **Add Operating City:** Modal with name, slug, state, country, default latitude/longitude coordinates, and service radius.
* **Direct "Simulate in Map" Action:** One-click button next to any city to immediately center the spatial simulator on that city and test its radius coverage.

### ✨ 3. Feed Curation & Discovery Boosting
* **Promoted Outlets:** Ability to pin specific stores with a **Boost Rank (#1, #2...)** so they appear at the top of the consumer app's recommendations regardless of strict distance sorting.
* **Hero "Deal of the Day":** Pick from active, approved discount campaigns to showcase in the top promotional carousel on the mobile app.
* **Discovery Ranking Weights Tuner:** Sliders to configure how the app ranks stores:
  * Proximity / Distance Weight (%)
  * Offer Value / Discount Weight (%)
  * Merchant Rating Weight (%)
  * Redemption Popularity Weight (%)
* **JSON Export & Import:** 1-click export of curation rules to `.json` and 1-click import to synchronize staging and production environments.
* **Cross-Tab Real-time Sync:** Powered by `BroadcastChannel` so adjustments in one tab sync immediately across all open tabs.

### 🔍 4. Global Search Diagnostics Sandbox
* **Multi-Entity Search Tester:** Direct testing tool for the backend's `/api/v1/discovery/search/global` endpoint.
* **Simultaneous Matching:** Type any query (*e.g. "Pizza", "Coffee", "50% off", "Bandra"*) to see matches segmented across **Stores**, **Categories**, and **Active Deals**.

---

## 4. Full-Stack Local Execution

### Start the Spring Boot Backend (Port 8080)
```bash
cd backend
./mvnw spring-boot:run
```
*Health Check:* `http://localhost:8080/actuator/health` (Status: `UP`)  
*Swagger Documentation:* `http://localhost:8080/swagger-ui.html`

### Start the Frontend Portal (Port 3000)
```bash
cd frontend
pnpm dev
```
*Local Access:* `http://localhost:3000/admin/discovery`  
*Mobile / Network Access:* `http://<YOUR_LAN_IP>:3000/admin/discovery`

---

## 5. Production Database Migration (PostGIS)

Flyway migration file is located at:
`backend/src/main/resources/db/migration/V6__add_postgis_and_discovery_curation.sql`

When running Flyway or manual deployment on AWS RDS / DigitalOcean:
```sql
-- Enables PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adds spatial geography column with GiST index
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_geog GEOGRAPHY(Point, 4326);
UPDATE stores SET location_geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_location_geog_gist ON stores USING GIST (location_geog);
```

---

## 6. Client Handover Walkthrough Checklist

- [x] Open `/admin/discovery` on both laptop and mobile device.
- [x] Relocate simulated customer by picking presets or clicking directly on the Leaflet map.
- [x] Adjust radius slider from 500m to 15km to verify instant store distance recalculation.
- [x] Click a store pin to inspect details, operating hours, and active discount campaigns.
- [x] Switch to **Operating Cities** and add/toggle a city status.
- [x] Switch to **Feed Curation**, boost a store, adjust ranking weights, and click **Export JSON**.
- [x] Switch to **Search Diagnostics** and test keyword matching for stores, categories, and offers.
- [x] Navigate to **Audit & Security** to view logged administrative discovery actions.
