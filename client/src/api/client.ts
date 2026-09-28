import axios from "axios";
import { setupInterceptors } from "./interceptors";

// Fallback to relative /api/v1 for local proxy or use environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10-second hard limit to prevent UI hanging
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach bearer token injection and 401 token refresh queue
setupInterceptors(apiClient);

export default apiClient;
