import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: data is fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache time: keep unused data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default (we'll enable per-query)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't throw errors, return them in error state
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      throwOnError: false,
    },
  },
});