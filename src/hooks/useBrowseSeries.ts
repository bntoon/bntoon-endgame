import { useInfiniteQuery } from "@tanstack/react-query";
import { dbQuery, BrowseSeriesItem } from "@/lib/db";

export type { BrowseSeriesItem };

export function useBrowseSeries() {
  return useInfiniteQuery({
    queryKey: ["browse-series"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await dbQuery<{
        series: BrowseSeriesItem[];
        nextPage: number | undefined;
      }>("get_browse_series", { page: pageParam });

      // Return empty result if DB not initialized yet
      if (error) {
        console.warn("Browse series query failed (DB may not be initialized):", error);
        return { series: [], nextPage: undefined };
      }
      return data || { series: [], nextPage: undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
