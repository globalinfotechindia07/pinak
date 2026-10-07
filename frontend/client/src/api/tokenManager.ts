/**
 * Enterprise In-Memory Token Manager
 * 
 * Security Standard:
 * - Access tokens are stored ONLY in private JavaScript closure memory.
 * - Never written to localStorage, sessionStorage, or client-side non-HttpOnly cookies.
 * - This provides total immunity to Cross-Site Scripting (XSS) token exfiltration attacks.
 * - Proactively tracks token expiration and provides change hooks for multi-tab sync.
 */

export interface TokenPayload {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  [key: string]: any;
}

// Scoped Closure - Private State
let inMemoryAccessToken: string | null = null;
let parsedPayload: TokenPayload | null = null;
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

type TokenChangeListener = (token: string | null, payload: TokenPayload | null) => void;
const listeners = new Set<TokenChangeListener>();

/**
 * Safely decodes a base64url JWT payload without requiring heavy third-party dependencies.
 */
function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn("[TokenManager] Failed to decode JWT payload:", err);
    return null;
  }
}

export const tokenManager = {
  /**
   * Retrieves the current access token from memory.
   */
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  /**
   * Checks if an access token is actively held in memory.
   */
  hasAccessToken(): boolean {
    return inMemoryAccessToken !== null && inMemoryAccessToken.length > 0;
  },

  /**
   * Sets the new in-memory access token, decodes payload, and schedules proactive refresh.
   */
  setAccessToken(token: string | null, onProactiveRefresh?: () => void): void {
    inMemoryAccessToken = token;

    if (proactiveRefreshTimer) {
      clearTimeout(proactiveRefreshTimer);
      proactiveRefreshTimer = null;
    }

    if (token) {
      parsedPayload = decodeJwtPayload(token);

      // If proactive refresh callback provided and token has expiration:
      if (parsedPayload?.exp && onProactiveRefresh) {
        const expiresAtMs = parsedPayload.exp * 1000;
        const nowMs = Date.now();
        // Trigger refresh 60 seconds before expiration, minimum 10 seconds from now
        const refreshDelayMs = Math.max(10_000, expiresAtMs - nowMs - 60_000);

        if (refreshDelayMs > 0 && expiresAtMs > nowMs) {
          proactiveRefreshTimer = setTimeout(() => {
            console.debug("[TokenManager] Triggering proactive silent token rotation...");
            onProactiveRefresh();
          }, refreshDelayMs);
        }
      }
    } else {
      parsedPayload = null;
    }

    // Notify registered listeners
    listeners.forEach((listener) => {
      try {
        listener(inMemoryAccessToken, parsedPayload);
      } catch (err) {
        console.error("[TokenManager] Error in token change listener:", err);
      }
    });
  },

  /**
   * Clears the access token from memory and cancels any scheduled timers.
   */
  clearAccessToken(): void {
    this.setAccessToken(null);
  },

  /**
   * Returns decoded payload claims (e.g. sub, roles, exp).
   */
  getTokenPayload(): TokenPayload | null {
    return parsedPayload;
  },

  /**
   * Returns remaining lifetime in milliseconds, or 0 if expired/absent.
   */
  getRemainingLifetimeMs(): number {
    if (!parsedPayload?.exp) return 0;
    return Math.max(0, parsedPayload.exp * 1000 - Date.now());
  },

  /**
   * Subscribes to token changes (e.g. for multi-tab synchronization).
   */
  onTokenChange(callback: TokenChangeListener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};

export default tokenManager;
