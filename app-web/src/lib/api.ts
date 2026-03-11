/**
 * Typed API functions — one per endpoint.
 * These are pure async functions with no React/SWR dependency.
 * Import these in SWR hooks or in event handlers for mutations.
 */

import { apiFetch } from "./api-client";
import type {
  Job,
  JobsResponse,
  SavedJob,
  SavedJobWithJob,
  GetJobsParams,
  GetSavedJobsParams,
  SaveJobBody,
  UpdateSavedJobBody,
} from "./types";

// ── /api/v1/jobs ──────────────────────────────────────────────────────────────

export const jobsApi = {
  list: (params: GetJobsParams, token: string | null) =>
    apiFetch<JobsResponse>("/api/v1/jobs", {
      token,
      params: params as Record<string, string | number | undefined>,
    }),

  get: (id: string, token: string | null) =>
    apiFetch<Job>(`/api/v1/jobs/${id}`, { token }),
};

// ── /api/v1/saved ─────────────────────────────────────────────────────────────

export const savedApi = {
  list: (params: GetSavedJobsParams, token: string | null) =>
    apiFetch<SavedJobWithJob[]>("/api/v1/saved", {
      token,
      params: params as Record<string, string | undefined>,
    }),

  save: (body: SaveJobBody, token: string | null) =>
    apiFetch<SavedJob>("/api/v1/saved", {
      token,
      method: "POST",
      body,
    }),

  update: (id: string, body: UpdateSavedJobBody, token: string | null) =>
    apiFetch<SavedJob>(`/api/v1/saved/${id}`, {
      token,
      method: "PATCH",
      body,
    }),

  remove: (id: string, token: string | null) =>
    apiFetch<void>(`/api/v1/saved/${id}`, {
      token,
      method: "DELETE",
    }),
};
