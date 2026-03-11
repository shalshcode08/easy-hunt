import { useApiSWR } from "./useApiSWR";
import type { GetJobsParams, JobsResponse } from "@/lib/types";

/**
 * Fetches a paginated list of jobs.
 * Re-fetches automatically whenever `params` changes (filter/page).
 *
 * @example
 * const { data, isLoading, error } = useJobs({ source: "linkedin", city: "Bengaluru" });
 */
export function useJobs(params: GetJobsParams = {}) {
  return useApiSWR<JobsResponse>(
    "/api/v1/jobs",
    params as Record<string, string | number | undefined>,
  );
}
