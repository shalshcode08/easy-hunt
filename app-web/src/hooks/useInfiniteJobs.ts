import useSWRInfinite from "swr/infinite";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, type ApiError } from "@/lib/api-client";
import type { GetJobsParams, JobsResponse } from "@/lib/types";

const PAGE_SIZE = 20;

export function useInfiniteJobs(params: Omit<GetJobsParams, "page" | "limit"> = {}) {
  const { getToken } = useAuth();

  const getKey = (pageIndex: number, previousData: JobsResponse | null) => {
    // Stop fetching when previous page had no more results
    if (previousData && previousData.jobs.length < PAGE_SIZE) return null;
    const p: Record<string, string | number | undefined> = {
      ...params,
      page: pageIndex + 1,
      limit: PAGE_SIZE,
    };
    return ["/api/v1/jobs", JSON.stringify(p)] as const;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<
    JobsResponse,
    ApiError
  >(
    getKey,
    async ([url, paramsJson]: readonly [string, string]) => {
      const token = await getToken();
      return apiFetch<JobsResponse>(url, {
        token,
        params: JSON.parse(paramsJson) as Record<string, string | number | undefined>,
      });
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5_000,
      errorRetryCount: 2,
      revalidateFirstPage: false,
    },
  );

  const seen = new Set<string>();
  const jobs = data
    ? data.flatMap((page) => page.jobs).filter((job) => {
        if (seen.has(job.id)) return false;
        seen.add(job.id);
        return true;
      })
    : [];
  const total = data?.[0]?.total ?? 0;
  const totalPages = data?.[0]?.totalPages ?? 1;
  const hasMore = size < totalPages && (data?.[size - 1]?.jobs.length ?? 0) >= PAGE_SIZE;
  const isFetchingMore = isValidating && (data?.length ?? 0) === size;

  function loadMore() {
    if (hasMore && !isValidating) setSize((s) => s + 1);
  }

  return { jobs, total, isLoading, isFetchingMore, hasMore, error, loadMore, mutate };
}
