// ── Enums ─────────────────────────────────────────────────────────────────────
// These mirror the backend Drizzle enums exactly.

export type JobSource = "linkedin" | "naukri" | "indeed";

export type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance"
  | "temporary";

export type WorkMode = "onsite" | "remote" | "hybrid";

export type ExperienceLevel =
  | "internship"
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "manager"
  | "director"
  | "executive";

export type SavedStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

// ── Domain Models ─────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  url: string;
  urlHash: string;
  externalId: string | null;
  title: string;
  titleNormalized: string;
  company: string;
  companyNormalized: string;
  locationRaw: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isRemote: boolean;
  workMode: WorkMode | null;
  source: JobSource;
  jobType: JobType | null;
  experienceLevel: ExperienceLevel | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string | null;
  skillsRaw: string[] | null;
  applyUrl: string | null;
  isActive: boolean;
  isDeleted: boolean;
  postedAt: string | null;   // ISO timestamp
  scrapedAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  clerkId: string;
  jobId: string;
  status: SavedStatus;
  notes: string | null;
  appliedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /api/v1/saved — joined row */
export interface SavedJobWithJob {
  savedJob: SavedJob;
  job: Job;
}

// ── Request Params ─────────────────────────────────────────────────────────────

export interface GetJobsParams {
  source?: JobSource;
  city?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  datePosted?: "24h" | "7d" | "30d";
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

export interface GetSavedJobsParams {
  status?: SavedStatus;
}

export interface SaveJobBody {
  jobId: string;
}

export interface UpdateSavedJobBody {
  status?: SavedStatus;
  notes?: string;
}

// ── API Responses ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  jobs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type JobsResponse = PaginatedResponse<Job>;
