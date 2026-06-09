// URL helpers shared across the app. Dutch query-param names.
import type { Locale } from "./i18n/config";

/** Localize an app path: Dutch stays at the root (no prefix), English gets the /en prefix. */
export const withLocale = (locale: Locale, path: string) => {
  const p = path === "" ? "/" : path;
  if (locale === "en") return p === "/" ? "/en" : `/en${p}`;
  return p;
};

export const PARAMS = {
  category: "categorie",
  seniority: "niveau",
  workMode: "werk",
  city: "stad",
  province: "provincie",
  tool: "tool",
  salary: "salaris",
  ai: "ai",
  datePosted: "geplaatst",
  lang: "taal",
  q: "q",
  sort: "sort",
  page: "pagina",
} as const;

export const jobUrl = (slug: string) => `/vacature/${slug}`;
export const companyUrl = (slug: string) => `/bedrijven/${slug}`;
export const categoryUrl = (slug: string) => `/vacatures/categorie/${slug}`;
export const seniorityUrl = (slug: string) => `/vacatures/niveau/${slug}`;
export const locationUrl = (slug: string) => `/vacatures/locatie/${slug}`;
export const toolUrl = (slug: string) => `/tools/${slug}`;
export const remoteUrl = () => `/vacatures/remote`;

/** Build a /vacatures URL from a set of query params (drops empty values). */
export function buildVacaturesUrl(
  params: Partial<Record<keyof typeof PARAMS, string | number | undefined>>,
  base = "/vacatures",
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;
    sp.set(PARAMS[key as keyof typeof PARAMS], String(value));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Normalize a stored website value to an absolute https URL, or null. */
export function companyWebsiteUrl(website?: string | null): string | null {
  if (!website) return null;
  return website.startsWith("http") ? website : `https://${website}`;
}

/** Glassdoor employer-search deep link (no API — lands on the company's Glassdoor search). */
export function glassdoorSearchUrl(name: string): string {
  return `https://www.glassdoor.nl/Search/results.htm?keyword=${encodeURIComponent(name)}`;
}

/** LinkedIn company-search deep link (no API — lands on the company search). */
export function linkedinCompanySearchUrl(name: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
}
