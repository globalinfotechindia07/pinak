/**
 * Multi-Tab Cross-Context Auth Synchronization
 * 
 * Uses BroadcastChannel API to synchronize auth events (login, logout, session expiration)
 * instantly across all active browser tabs without server polling.
 */

export type AuthChannelMessage =
  | { type: "AUTH_LOGIN"; email?: string; role?: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_EXPIRED" };

type AuthChannelListener = (msg: AuthChannelMessage) => void;

const CHANNEL_NAME = "pinak_auth_bus";
let channel: BroadcastChannel | null = null;
const listeners = new Set<AuthChannelListener>();

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const msg: AuthChannelMessage = event.data;
      listeners.forEach((fn) => {
        try {
          fn(msg);
        } catch (err) {
          console.error("[AuthChannel] Listener error:", err);
        }
      });
    };
  } catch (err) {
    console.warn("[AuthChannel] BroadcastChannel initialization failed:", err);
  }
}

export const authChannel = {
  broadcast(message: AuthChannelMessage): void {
    if (channel) {
      try {
        channel.postMessage(message);
      } catch (err) {
        console.warn("[AuthChannel] PostMessage error:", err);
      }
    }
  },

  subscribe(listener: AuthChannelListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export default authChannel;
