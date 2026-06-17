// Dev sets NEXT_PUBLIC_API_URL (e.g. http://localhost:8002) in .env.local.
// In production the frontend is served behind nginx with /api proxied to the
// backend, so an empty base means same-origin relative requests ("/api/...").
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const bearer = token ?? getToken();

  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { email: string; full_name: string; password: string }) =>
    request<{ user: User; access_token: string; refresh_token: string; token_type: string }>(
      "/api/v1/users/register",
      { method: "POST", body: JSON.stringify(body) }
    ),

  login: (body: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>(
      "/api/v1/users/login",
      { method: "POST", body: JSON.stringify(body) }
    ),

  me: () => request<User>("/api/v1/users/me"),
};

// ── Resumes ───────────────────────────────────────────────────────────────────
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Resume>("/api/v1/resumes/upload", { method: "POST", body: form });
  },

  list: () => request<Resume[]>("/api/v1/resumes/"),

  get: (id: string) => request<ResumeDetail>(`/api/v1/resumes/${id}`),

  delete: (id: string) =>
    request<void>(`/api/v1/resumes/${id}`, { method: "DELETE" }),
};

// ── Matching ──────────────────────────────────────────────────────────────────
export const matchApi = {
  analyze: (body: { resume_id: string; job_description: string }) =>
    request<MatchResult>("/api/v1/matching/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  tailor: (body: { resume_id: string; job_description: string }) =>
    request<TailoredResume>("/api/v1/matching/tailor", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  saveTailored: (body: { resume_id: string; title: string; content: TailoredResume }) =>
    request<SavedTailored>("/api/v1/matching/saved", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateSaved: (id: string, body: { title: string; content: TailoredResume }) =>
    request<SavedTailored>(`/api/v1/matching/saved/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  listSaved: () => request<SavedTailoredListItem[]>("/api/v1/matching/saved"),

  getSaved: (id: string) => request<SavedTailored>(`/api/v1/matching/saved/${id}`),

  deleteSaved: (id: string) =>
    request<void>(`/api/v1/matching/saved/${id}`, { method: "DELETE" }),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MatchResult {
  match_score: number;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  dates: string;
}

export interface TailoredResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  injected_keywords: string[];
}

export interface SavedTailoredListItem {
  id: string;
  resume_id: string;
  title: string;
  created_at: string;
}

export interface SavedTailored extends SavedTailoredListItem {
  content: TailoredResume;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  role: "user" | "admin";
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  chunk_count: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
}

export interface ResumeDetail extends Resume {
  raw_text: string;
}
