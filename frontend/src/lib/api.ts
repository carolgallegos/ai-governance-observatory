/** Browser → host machine. Server (SSR in Docker) → service name `api`. */
function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000"
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export type CountryListItem = {
  iso_code: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  agri_score: number | null;
  maturity_tier?: string | null;
  maturity_label?: string | null;
};

export type GovernanceTrends = {
  top_priorities: { label: string; count: number }[];
  top_risks: { label: string; count: number }[];
  governance_models: { label: string; count: number }[];
  maturity_distribution: {
    iso_code: string;
    name: string;
    score: number | null;
    tier: string;
    tier_label: string;
  }[];
  countries_analyzed: number;
};

export type ScenarioResult = {
  country_iso: string;
  dimension: string;
  increase_raw_points: number;
  agri_before: number;
  agri_after: number;
  delta: number;
  maturity_before: string;
  maturity_after: string;
  narrative: string;
};

export type PolicyProfile = {
  strategy_title: string;
  strategy_date: string | null;
  regulation_summary: string;
  responsible_bodies: string;
  priorities: string[];
  regulatory_approach: string;
  privacy: string;
  generative_ai: string;
  education: string;
  risks: string;
};

export type TimelineEvent = {
  year: number;
  title: string;
  description: string;
  event_type: string;
};

export type Citation = {
  document: string;
  page: number | null;
  section: string;
  confidence: number;
  excerpt?: string;
};

export type CountryDetail = {
  iso_code: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  profile: PolicyProfile | null;
  frameworks: { framework_type: string; title: string; effective_date: string | null; source_url: string }[];
  agri: {
    year: number;
    total_score: number;
    regulation: number;
    investment: number;
    education: number;
    open_data: number;
    research: number;
    methodology_note: string;
  } | null;
  timeline: TimelineEvent[];
};

export type PolicySimilarity = {
  similarity_percent: number;
  explanations: string[];
  dimension_alignment: Record<string, number>;
};

export type CompareResult = {
  country_a: CountryDetail;
  country_b: CountryDetail;
  dimensions: { key: string; label: string; country_a: string; country_b: string }[];
  radar: { dimension: string; country_a: number; country_b: number }[];
  policy_similarity: PolicySimilarity;
};

export type RankingItem = {
  iso_code: string;
  name: string;
  total_score: number;
  region: string;
};

export type ObservatoryMeta = {
  last_updated: string;
  jurisdictions: number;
  governance_frameworks: number;
  policy_sources: number;
  agri_version: string;
};

export type CountryRecommendation = {
  iso_code: string;
  name: string;
  similarity_percent: number;
  explanations: string[];
};

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json();
}

export const api = {
  countries: () => fetchApi<CountryListItem[]>("/api/v1/countries"),
  country: (iso: string) => fetchApi<CountryDetail>(`/api/v1/countries/${iso}`),
  compare: (a: string, b: string) => fetchApi<CompareResult>(`/api/v1/compare?a=${a}&b=${b}`),
  similarity: (a: string, b: string) =>
    fetchApi<{ country_a: string; country_b: string; policy_similarity: PolicySimilarity }>(
      `/api/v1/similarity?a=${a}&b=${b}`
    ),
  similarCountries: (iso: string) =>
    fetchApi<{ source_country: string; recommendations: CountryRecommendation[] }>(
      `/api/v1/countries/${iso}/similar`
    ),
  observatoryMeta: () => fetchApi<ObservatoryMeta>("/api/v1/observatory/meta"),
  ranking: () => fetchApi<RankingItem[]>("/api/v1/scores/ranking"),
  trends: () => fetchApi<GovernanceTrends>("/api/v1/analytics/trends"),
  scenario: (countryIso: string, dimension: string, increasePoints = 0.5) =>
    fetchApi<ScenarioResult>("/api/v1/analytics/scenario", {
      method: "POST",
      body: JSON.stringify({
        country_iso: countryIso,
        dimension,
        increase_points: increasePoints,
      }),
    }),
  chat: (message: string, countries?: string[]) =>
    fetchApi<{ answer: string; citations: Citation[]; sources: Citation[]; mode: string }>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message, countries }),
    }),
  documents: () => fetchApi<{ id: number; filename: string; summary_json: Record<string, unknown> | null }[]>("/api/v1/documents"),
};

export async function uploadPdf(file: File, countryIso?: string) {
  const form = new FormData();
  form.append("file", file);
  const q = countryIso ? `?country_iso=${countryIso}` : "";
  const res = await fetch(`${getApiBaseUrl()}/api/v1/documents/upload${q}`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function summarizeDoc(id: number) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/documents/${id}/summarize`, { method: "POST" });
  if (!res.ok) throw new Error("Summarize failed");
  return res.json();
}
