/**
 * useSavedJobs — data hook
 * useSavedJobsMutations — save / update / remove with optimistic UI
 *
 * Both use the same SWR cache key so mutations instantly update all consumers.
 */

import { useAuth } from "@clerk/nextjs";
import { useSWRConfig } from "swr";
import { useApiSWR } from "./useApiSWR";
import { savedApi } from "@/lib/api";
import type { SavedJobWithJob, SavedStatus, UpdateSavedJobBody } from "@/lib/types";

// Canonical cache key — must match exactly what useApiSWR generates.
const SAVED_KEY: [string, string] = ["/api/v1/saved", "{}"];

// ── Data hook ─────────────────────────────────────────────────────────────────

/**
 * Returns all saved jobs (all statuses).
 * Filter client-side by status for Saved / Tracker views.
 */
export function useSavedJobs() {
  return useApiSWR<SavedJobWithJob[]>("/api/v1/saved");
}

// ── Mutation hook ─────────────────────────────────────────────────────────────

export function useSavedJobsMutations() {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();

  /**
   * Bookmark a job from the feed.
   * Appends optimistically, rolls back on error.
   */
  async function save(jobId: string) {
    const token = await getToken();
    await mutate(
      SAVED_KEY,
      async (current: SavedJobWithJob[] | undefined) => {
        const newEntry = await savedApi.save({ jobId }, token);
        // Re-fetch to get the joined job data — or append with partial data.
        // For simplicity, invalidate so SWR re-fetches with full data.
        return current ? [...current] : [];
      },
      { revalidate: true },
    );
  }

  /**
   * Update status or notes on a saved job.
   * Optimistically updates the cache; rolls back if the request fails.
   */
  async function update(id: string, body: UpdateSavedJobBody) {
    const token = await getToken();

    const optimistic = (current: SavedJobWithJob[] | undefined): SavedJobWithJob[] =>
      current?.map((item) =>
        item.savedJob.id === id
          ? { ...item, savedJob: { ...item.savedJob, ...body } }
          : item,
      ) ?? [];

    await mutate(
      SAVED_KEY,
      async (current: SavedJobWithJob[] | undefined) => {
        const updated = await savedApi.update(id, body, token);
        return current?.map((item) =>
          item.savedJob.id === id ? { ...item, savedJob: updated } : item,
        ) ?? [];
      },
      {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  /**
   * Remove a saved job.
   * Optimistically removes from the list; rolls back if the request fails.
   */
  async function remove(id: string) {
    const token = await getToken();

    const optimistic = (current: SavedJobWithJob[] | undefined): SavedJobWithJob[] =>
      current?.filter((item) => item.savedJob.id !== id) ?? [];

    await mutate(
      SAVED_KEY,
      async (current: SavedJobWithJob[] | undefined) => {
        await savedApi.remove(id, token);
        return current?.filter((item) => item.savedJob.id !== id) ?? [];
      },
      {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  /**
   * Update status only — convenience wrapper used in Tracker drag-and-drop.
   */
  async function updateStatus(id: string, status: SavedStatus) {
    return update(id, { status });
  }

  /**
   * Update notes only — convenience wrapper used in Tracker card notes.
   */
  async function updateNotes(id: string, notes: string) {
    return update(id, { notes });
  }

  return { save, update, remove, updateStatus, updateNotes };
}
