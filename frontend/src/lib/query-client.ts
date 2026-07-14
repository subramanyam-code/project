import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (count, error: unknown) => {
        const s = (error as { response?: { status: number } })?.response?.status;
        if (s === 401 || s === 403 || s === 404) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
