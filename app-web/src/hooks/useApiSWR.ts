/**
 * Base SWR hook that automatically injects the Clerk auth token.
 *
 * - Key: [path, stable-serialized-params] → SWR revalidates whenever params change.
 * - Token is fetched fresh on every SWR call (Clerk caches it internally).
 * - Returns the same shape as useSWR<T, ApiError>.
 */

import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, type ApiError } from "@/lib/api-client";

type Params = Record<string, string | number | boolean | undefined | null>;

/** Stable key: serialize params so SWR compares by value, not reference. */
function buildKey(path: string | null, params?: Params): [string, string] | null {
  if (!path) return null;
  return [path, JSON.stringify(params ?? {})];
}

export function useApiSWR<T>(
  path: string | null,
  params?: Params,
  config?: SWRConfiguration<T, ApiError>,
): SWRResponse<T, ApiError> {
  const { getToken } = useAuth();
  const key = buildKey(path, params);

  return useSWR<T, ApiError>(
    key,
    async ([url, paramsJson]: [string, string]) => {
      const token = await getToken();
      return apiFetch<T>(url, {
        token,
        params: JSON.parse(paramsJson) as Params,
      });
    },
    {
      revalidateOnFocus: false,     // don't refetch on tab focus
      dedupingInterval: 5_000,      // deduplicate calls within 5s
      errorRetryCount: 2,           // retry failed requests up to 2 times
      ...config,
    },
  );
}
