import axios from "axios";
import { setupInterceptors } from "./interceptors";

// Target backend via reverse proxy or direct base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15-second limit
  withCredentials: true, // Required for HttpOnly refresh cookie & XSRF cookie exchange
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach Bearer token injection, CSRF double-submit headers, and 401 token refresh queue
setupInterceptors(apiClient);

export default apiClient;
