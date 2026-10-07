# Merchant Discovery Super-App — Deployment Guide (Render Free)

This guide walks you through deploying the Merchant Discovery Super-App Spring Boot backend to **Render Free** (or any container-based cloud platform) with public HTTPS API access, PostgreSQL with PostGIS, and Redis.

---

## 1. Prerequisites

Before starting, ensure you have:
- A GitHub account with this repository pushed to your remote.
- A [Render](https://render.com) account (free tier).
- A managed PostgreSQL database instance (Render PostgreSQL, [Supabase](https://supabase.com), or [Neon](https://neon.tech)).
- (Optional but recommended) A Redis instance ([Upstash Redis Free](https://upstash.com) or Render Redis).
  > **Note**: If Redis is not configured, the application automatically falls back to an in-memory `ConcurrentMapCacheManager` and in-memory OTP store without failing startup.

---

## 2. GitHub Setup

1. Verify your local working branch is clean and all changes are pushed:
   ```bash
   git status
   git push origin <your-branch-name>
   ```
2. Confirm that `.gitignore` prevents sensitive files (`.env`, `*.pem`, `*.key`, `credentials/`, `target/`) from being pushed to GitHub.

---

## 3. PostgreSQL & PostGIS Setup

### Option A: Supabase (Recommended for PostGIS Free Tier)
1. Create a free project at [Supabase](https://supabase.com).
2. Under **Database Settings** > **Connection Pooling**, copy the JDBC URI or connection parameters:
   - Host, Port (default `5432` or `6543`), Database name (`postgres`), User (`postgres`), Password.
3. PostGIS is pre-installed in Supabase. In the Supabase SQL editor, ensure it is active:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### Option B: Render PostgreSQL
1. On your Render Dashboard, click **New +** > **PostgreSQL**.
2. Name: `superapp-db`.
3. Plan: **Free**.
4. Once provisioned, copy the **Internal Database URL** (if deploying backend in the same Render region) or **External Database URL**.
5. Note: Format the JDBC URL as:
   `jdbc:postgresql://<host>:<port>/<dbname>?sslmode=require`

### Database Migrations
Flyway runs automatically on application startup (`V1` through `V22`).
- Flyway migrations are located in `src/main/resources/db/migration`.
- Migration `V10` and `V14` detect if PostGIS is available (`pg_available_extensions`). If present, `CREATE EXTENSION IF NOT EXISTS postgis` is executed; if not present, the app catches this cleanly and uses Haversine mathematical formulas on latitude/longitude columns.
- **Do not manually run table creation scripts** — Flyway handles schema creation and version tracking automatically.

---

## 4. Redis Setup (Optional / In-Memory Fallback)

### Upstash Redis (Recommended Free Tier)
1. Create a free database at [Upstash](https://upstash.com).
2. Under **Connect** > **Java / Spring**, note down:
   - Host
   - Port (typically `6379`)
   - Password
3. Alternatively, copy the complete Redis URL (`rediss://default:<password>@<host>:<port>`).

> **Zero-Downtime Resilience**: If `REDIS_HOST` is omitted or connection fails, the application logs a warning and automatically activates an in-memory cache and OTP fallback.

---

## 5. Render Web Service Setup

### Step-by-Step Configuration in Render Dashboard
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `globalinfotechindia07/wardhaclub` (or your repository fork).
4. Configure service settings:
   - **Name**: `superapp-backend` (or your preferred name)
   - **Region**: Select the region closest to your database (e.g., `Singapore`, `Frankfurt`, `Oregon`)
   - **Branch**: `parag1803-patch-1` (or `main`)
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: **Free**
5. Expand **Advanced Settings**:
   - **Health Check Path**: `/actuator/health`
   - **Auto-Deploy**: `Yes`

---

## 6. Environment Variables Reference

In the Render Web Service settings, navigate to **Environment** and add the following variables:

| Variable Name | Required | Example / Guidance |
| :--- | :---: | :--- |
| `PORT` | Auto | Render sets this automatically (defaults to `8080`). |
| `SERVER_ADDRESS` | Yes | `0.0.0.0` |
| `DB_URL` | Yes | `jdbc:postgresql://<host>:<port>/<dbname>?sslmode=require` |
| `DB_USERNAME` | Yes | Your database username. |
| `DB_PASSWORD` | Yes | Your database password. |
| `JWT_SECRET` | Yes | 256-bit secret key (generate with `openssl rand -hex 32`). |
| `JWT_ISSUER` | No | `superapp-api` |
| `JWT_AUDIENCE` | No | `superapp-client` |
| `CORS_ALLOWED_ORIGINS`| Yes | Comma-separated allowed frontend URLs (e.g. `https://myapp.vercel.app,http://localhost:3000`). |
| `REDIS_HOST` | Optional | Redis server host (e.g. `upstash-endpoint.upstash.io`). |
| `REDIS_PORT` | Optional | `6379` |
| `REDIS_PASSWORD` | Optional | Redis authentication password. |
| `REDIS_SSL` | Optional | `true` (if using Upstash TLS port) or `false`. |
| `REDIS_URL` | Optional | Full connection URI (e.g. `rediss://default:pass@host:6379`). |
| `MAIL_MOCK` | Yes | `true` (prints registration/reset OTPs to logs for dev testing). |
| `LOG_LEVEL_APP` | No | `INFO` |
| `LOG_LEVEL_SPRING` | No | `INFO` |

---

## 7. Docker Deployment

The repository includes a multi-stage `Dockerfile`:
- **Build Stage**: Uses `maven:3.9.8-eclipse-temurin-21-alpine` to compile code and build the executable JAR in the cloud.
- **Runtime Stage**: Uses minimal `eclipse-temurin:21-jre-alpine`.
- **Security**: The application runs under an unprivileged user `appuser:appgroup` (UID `10001`).
- **Memory Tuning**: Container JVM flags are set to `-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC` to stay strictly within Render Free's 512 MB memory boundary.

To test the container locally (requires Docker installed):
```bash
docker build -t superapp-backend .
docker run -p 8080:8080 --env-file .env superapp-backend
```

---

## 8. Health Check Verification

Render's orchestrator queries the health check endpoint periodically:
```http
GET /actuator/health
```

Expected Response:
```json
{
  "status": "UP"
}
```

The custom health check endpoint is also publicly accessible:
```http
GET /api/v1/health
```

---

## 9. API Testing Checklist (Postman / cURL)

Replace `https://<project-name>.onrender.com` with your Render service URL.

### 1. Health Probe
```bash
curl -i -X GET "https://<project-name>.onrender.com/actuator/health"
```
*Expected*: `HTTP/1.1 200 OK`, `{"status":"UP"}`.

### 2. User Authentication (Login)
```bash
curl -i -X POST "https://<project-name>.onrender.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@superapp.com",
    "password": "Customer@123456"
  }'
```
*Expected*: `HTTP/1.1 200 OK`, returns `accessToken`, `refreshToken`, and user details.

### 3. Public Discovery (Nearby Stores)
```bash
curl -i -X GET "https://<project-name>.onrender.com/api/v1/discovery/nearby?lat=21.1458&lng=79.0882&radiusKm=10"
```
*Expected*: `HTTP/1.1 200 OK`, returns stores within the given radius.

### 4. Protected API (Get Customer Profile)
```bash
curl -i -X GET "https://<project-name>.onrender.com/api/v1/customer/profile" \
  -H "Authorization: Bearer <CUSTOMER_JWT_ACCESS_TOKEN>"
```
*Expected*: `HTTP/1.1 200 OK`, returns authenticated user profile.

### 5. Admin Dashboard Summary (Strict ADMIN Authorization)
```bash
curl -i -X GET "https://<project-name>.onrender.com/api/v1/admin/dashboard" \
  -H "Authorization: Bearer <ADMIN_JWT_ACCESS_TOKEN>"
```
*Expected*: `HTTP/1.1 200 OK` for admin token; `HTTP/1.1 403 Forbidden` for customer token.

---

## 10. CORS Configuration

For frontend communication:
- Set `CORS_ALLOWED_ORIGINS` to your frontend application domain (e.g. `https://my-app.vercel.app`).
- For multiple origins, separate them with commas (no trailing slashes):
  ```
  https://my-app.vercel.app,http://localhost:3000,http://localhost:5173
  ```
- The backend will reject requests from unlisted origins with CORS errors and forbids wildcards (`*`) with credentials.

---

## 11. Troubleshooting & Render Free Limitations

### Cold-Start Delay (15-Minute Inactivity Sleep)
- On Render Free, instances sleep after 15 minutes of inactivity.
- The first request after sleep spins up the container and typically takes 30–50 seconds. Subsequent requests are fast.
- Client applications should configure request timeouts accordingly (e.g. 60 seconds).

### Out of Memory (OOMKilled)
- Render Free allocates 512 MB of RAM.
- The Dockerfile applies `-XX:MaxRAMPercentage=75.0` (capping Java heap at ~384 MB).
- If your application crashes with exit code 137, verify that Hikari connection pool is kept low (`maximum-pool-size=10`) and reduce thread pool queue capacities if necessary.

### Database Connection Failures
- Ensure your database URL contains `?sslmode=require` if using managed cloud databases like Supabase or Neon.
- Verify that your database provider allows inbound connections from anywhere (`0.0.0.0/0`) or whitelist Render's outbound IP ranges.

---

## 12. Security Checklist

- [x] **No hardcoded secrets**: All database, Redis, mail, and JWT credentials externalized.
- [x] **Git protection**: `.env`, `.env.*`, keys, and certificates added to `.gitignore`.
- [x] **Non-root container**: Container runs as unprivileged user `appuser` (UID 10001).
- [x] **Actuator restricted**: Sensitive endpoints (`/actuator/env`, `/actuator/beans`, etc.) are hidden; only `/actuator/health` is exposed publicly.
- [x] **Error sanitation**: `GlobalExceptionHandler` hides SQL errors, internal exceptions, and stack traces.
- [x] **Seed credential rotation**: Change default seed account passwords (`superadmin@superapp.com`, `admin@superapp.com`, `vendor@superapp.com`, `customer@superapp.com`) before opening to real production traffic.
