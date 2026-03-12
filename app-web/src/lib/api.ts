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
  PlatformConnection,
  UserProfile,
  OnboardBody,
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

// ── /api/v1/platform ──────────────────────────────────────────────────────────

export type PlatformId = "linkedin" | "naukri" | "indeed";

export const platformApi = {
  getMe: (token: string | null) =>
    apiFetch<UserProfile | null>("/api/v1/platform/me", { token }),

  onboard: (body: OnboardBody, token: string | null) =>
    apiFetch<UserProfile>("/api/v1/platform/me/onboard", { token, method: "POST", body }),

  getConnections: (token: string | null) =>
    apiFetch<PlatformConnection[]>("/api/v1/platform/connections", { token }),

  initConnect: (platform: PlatformId, token: string | null) =>
    apiFetch<{ sessionId: string; liveViewUrl: string }>(
      `/api/v1/platform/connections/${platform}/init`,
      { token, method: "POST" },
    ),

  pollConnection: (platform: PlatformId, sessionId: string, token: string | null) =>
    apiFetch<{ ready: boolean }>(
      `/api/v1/platform/connections/${platform}/${sessionId}/poll`,
      { token },
    ),

  saveConnection: (platform: PlatformId, sessionId: string, token: string | null) =>
    apiFetch<{ saved: boolean }>(
      `/api/v1/platform/connections/${platform}/${sessionId}/save`,
      { token, method: "POST" },
    ),

  disconnect: (platform: PlatformId, token: string | null) =>
    apiFetch<void>(`/api/v1/platform/connections/${platform}`, { token, method: "DELETE" }),

  rescrape: (platform: PlatformId, token: string | null) =>
    apiFetch<{ queued: boolean }>(`/api/v1/platform/connections/${platform}/rescrape`, { token, method: "POST" }),
};
