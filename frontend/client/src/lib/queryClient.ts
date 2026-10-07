import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes before considering data stale
      gcTime: 15 * 60 * 1000, // Keep unused cache for 15 minutes
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Prevent jarring refreshes when user returns to tab
      refetchOnReconnect: true, // Automatically refresh when network reconnects
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (prevents duplicate writes)
    },
  },
});
