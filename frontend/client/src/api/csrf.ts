import axios from "axios";

/**
 * Enterprise Double-Submit CSRF Management
 * 
 * Standard:
 * 1. Web application requests CSRF token from /api/v1/auth/csrf
 * 2. Backend sets a client-readable cookie: XSRF-TOKEN=<hmac-signed-token>
 * 3. Frontend reads this cookie and injects it into X-XSRF-TOKEN header on mutating requests.
 * 4. Backend validates header == cookie AND cryptographically validates HMAC signature.
 */

export const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function getCsrfTokenFromCookie(): string | null {
  return getCookie(CSRF_COOKIE_NAME);
}

let pendingCsrfPromise: Promise<string | null> | null = null;

export async function fetchCsrfToken(): Promise<string | null> {
  if (pendingCsrfPromise) {
    return pendingCsrfPromise;
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

  pendingCsrfPromise = (async () => {
    try {
      const response = await axios.get(`${BASE_URL}/auth/csrf`, {
        withCredentials: true,
        headers: {
          "X-Client-Type": "web",
          Accept: "application/json",
        },
      });

      const tokenFromResponse =
        response.data?.data?.csrfToken ||
        response.data?.csrfToken ||
        getCsrfTokenFromCookie();

      return tokenFromResponse || null;
    } catch (err) {
      console.warn("[CSRF] Failed to fetch CSRF token from server:", err);
      return getCsrfTokenFromCookie();
    } finally {
      pendingCsrfPromise = null;
    }
  })();

  return pendingCsrfPromise;
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfTokenFromCookie();
  if (existing) {
    return existing;
  }
  return fetchCsrfToken();
}
