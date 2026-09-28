import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiError } from "../types/api/common";

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, any>;
    
    // Spring Boot custom error envelope or default error object
    const code = data.code || data.error?.code || `HTTP_${error.response.status}`;
    const message =
      data.message ||
      data.error?.message ||
      data.detail ||
      error.message ||
      "An unexpected server error occurred.";
      
    const details = data.details || data.error?.details;
    
    return {
      code,
      message,
      details,
      status: error.response.status,
    };
  }

  if (error instanceof Error) {
    // Network timeouts or AbortController cancellations
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return {
        code: "TIMEOUT",
        message: "The server took too long to respond. Please check your connection and retry.",
        status: 408,
      };
    }

    return {
      code: "CLIENT_ERROR",
      message: error.message,
    };
  }

  return {
    code: "UNKNOWN",
    message: "A network or connectivity issue occurred.",
  };
}

export function handleApiErrorToast(error: unknown, fallbackMessage?: string): ApiError {
  const parsed = parseApiError(error);
  
  // Don't show toast for intentional cancellations
  if (parsed.code === "ERR_CANCELED") {
    return parsed;
  }

  const title = fallbackMessage || "Action Failed";
  toast.error(title, {
    description: parsed.message,
    duration: 4000,
  });

  return parsed;
}
