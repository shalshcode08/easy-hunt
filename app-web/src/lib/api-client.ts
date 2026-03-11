// ── API Error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound()     { return this.status === 404; }
  get isConflict()     { return this.status === 409; }
  get isServerError()  { return this.status >= 500; }
}

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

// ── Core fetch ────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface FetchOptions {
  token: string | null;
  method?: HttpMethod;
  body?: unknown;
  /** Query params — undefined/null/"" values are omitted automatically */
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiFetch<T>(
  path: string,
  { token, method = "GET", body, params }: FetchOptions,
): Promise<T> {
  // Build URL with query params
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Execute
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network failure (offline, DNS, CORS, etc.)
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed — check your connection.");
  }

  // 204 No Content → return undefined
  if (res.status === 204) return undefined as T;

  // Parse body for both success and error
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = json as { code?: string; message?: string } | null;
    throw new ApiError(
      res.status,
      err?.code ?? "API_ERROR",
      err?.message ?? `Request failed with status ${res.status}`,
    );
  }

  return json as T;
}
