// Read queries used by Server Components. All synchronous (node:sqlite).

import { getDb } from "./db";
import { slugify } from "./format";
import { PROVINCES } from "./taxonomy";
import type { CompanyRow, JobRow } from "./types";

/** SQL boolean: this job is a live featured/premium placement right now. */
const JOB_FEATURED =
  "(j.featured = 1 AND (j.featured_until IS NULL OR j.featured_until >= datetime('now')))";
/** SQL boolean for a company being a live spotlight (pass "" for an unprefixed scope). */
const companyFeatured = (p = "c.") =>
  `(${p}featured = 1 AND (${p}featured_until IS NULL OR ${p}featured_until >= datetime('now')))`;

const JOB_COLS = `j.*, c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo, ${JOB_FEATURED} AS is_featured, ${companyFeatured("c.")} AS company_featured`;
const JOB_FROM = `FROM jobs j JOIN companies c ON c.id = j.company_id`;

export interface JobFilters {
  category?: string;
  seniority?: string;
  workMode?: string;
  city?: string; // city slug
  province?: string; // province display name
  country?: string;
  tool?: string;
  company?: string; // company slug
  salaryMin?: number; // annual EUR
  ai?: boolean;
  remote?: boolean;
  datePosted?: number; // posted within the last N days
  lang?: "nl" | "en"; // language of the posting text
  q?: string;
}

export type SortKey = "newest" | "salary";

export const PROVINCE_BY_SLUG = new Map(PROVINCES.map((p) => [slugify(p), p]));
export function provinceFromSlug(slug: string): string | undefined {
  return PROVINCE_BY_SLUG.get(slug);
}

function buildWhere(f: JobFilters): { sql: string; params: (string | number)[] } {
  const cond: string[] = ["j.status = 'active'"];
  const params: (string | number)[] = [];
  if (f.category) (cond.push("j.category = ?"), params.push(f.category));
  if (f.seniority) (cond.push("j.seniority = ?"), params.push(f.seniority));
  if (f.workMode) (cond.push("j.work_mode = ?"), params.push(f.workMode));
  if (f.remote) cond.push("j.work_mode = 'remote'");
  if (f.city) (cond.push("j.city_slug = ?"), params.push(f.city));
  if (f.province) (cond.push("j.province = ?"), params.push(f.province));
  if (f.country) (cond.push("j.country = ?"), params.push(f.country.toUpperCase()));
  if (f.company) (cond.push("c.slug = ?"), params.push(f.company));
  if (f.tool) (cond.push("j.tools_json LIKE ?"), params.push(`%"${f.tool}"%`));
  if (f.ai) cond.push("j.ai_required = 1");
  if (f.lang) (cond.push("j.lang = ?"), params.push(f.lang));
  if (f.datePosted && f.datePosted > 0) {
    // age of the posting: prefer the source's posted date, fall back to when we first saw it
    cond.push("COALESCE(j.posted_at, j.first_seen_at) >= datetime('now', ?)");
    params.push(`-${Math.floor(f.datePosted)} days`);
  }
  if (f.salaryMin) {
    cond.push("j.salary_disclosed = 1 AND j.salary_max_eur >= ?");
    params.push(f.salaryMin);
  }
  if (f.q && f.q.trim()) {
    // Search title, company, description and detected tools (so e.g. "HubSpot" matches
    // jobs tagged with that tool even when it isn't in the title).
    cond.push(
      "(j.title_norm LIKE ? OR lower(c.name) LIKE ? OR lower(j.description_text) LIKE ? OR lower(j.tools_json) LIKE ?)",
    );
    const like = `%${f.q.trim().toLowerCase()}%`;
    params.push(like, like, like, like);
  }
  return { sql: cond.join(" AND "), params };
}

function sortClause(sort: SortKey | undefined): string {
  // Live featured/premium jobs always pin to the top, then the requested sort.
  switch (sort) {
    case "salary":
      return `ORDER BY ${JOB_FEATURED} DESC, (j.salary_max_eur IS NULL), j.salary_max_eur DESC, COALESCE(j.posted_at, j.first_seen_at) DESC`;
    case "newest":
    default:
      return `ORDER BY ${JOB_FEATURED} DESC, COALESCE(j.posted_at, j.first_seen_at) DESC, j.id DESC`;
  }
}

export function listJobs(
  f: JobFilters,
  opts: { sort?: SortKey; page?: number; perPage?: number } = {},
): JobRow[] {
  const db = getDb();
  const { sql, params } = buildWhere(f);
  const perPage = opts.perPage ?? 25;
  const page = Math.max(1, opts.page ?? 1);
  const offset = (page - 1) * perPage;
  const stmt = db.prepare(
    `SELECT ${JOB_COLS} ${JOB_FROM} WHERE ${sql} ${sortClause(opts.sort)} LIMIT ? OFFSET ?`,
  );
  return stmt.all(...params, perPage, offset) as unknown as JobRow[];
}

/** Recent jobs in randomized order, so the homepage doesn't always show the same ones first. */
export function listRecentShuffled(limit = 8, pool = 50, lang?: "nl" | "en"): JobRow[] {
  const db = getDb();
  const langCond = lang ? " AND j.lang = ?" : "";
  const params = lang ? [lang, pool, limit] : [pool, limit];
  return db
    .prepare(
      `SELECT * FROM (
         SELECT ${JOB_COLS} ${JOB_FROM} WHERE j.status='active'${langCond}
         ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC LIMIT ?
       ) ORDER BY RANDOM() LIMIT ?`,
    )
    .all(...params) as unknown as JobRow[];
}

/** Live featured/premium jobs, newest first - for the homepage 'Uitgelicht' strip. */
export function getFeaturedJobs(limit = 6, lang?: "nl" | "en"): JobRow[] {
  const db = getDb();
  const langCond = lang ? " AND j.lang = ?" : "";
  const params = lang ? [lang, limit] : [limit];
  return db
    .prepare(
      `SELECT ${JOB_COLS} ${JOB_FROM}
       WHERE j.status='active' AND ${JOB_FEATURED}${langCond}
       ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC LIMIT ?`,
    )
    .all(...params) as unknown as JobRow[];
}

export function countJobs(f: JobFilters): number {
  const db = getDb();
  const { sql, params } = buildWhere(f);
  const row = db
    .prepare(`SELECT COUNT(*) AS n ${JOB_FROM} WHERE ${sql}`)
    .get(...params) as { n: number };
  return row?.n ?? 0;
}

/** Active vacancies open longer than `days` (by posted_at, else first_seen_at). */
export function countLongOpenJobs(days = 30): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM jobs
         WHERE status='active' AND COALESCE(posted_at, first_seen_at) < datetime('now', ?)`,
      )
      .get(`-${Math.floor(days)} days`) as { n: number }
  ).n;
}

/** Median annual-EUR salary range for a filtered set (uses disclosed jobs only). */
export function salaryBand(f: JobFilters): { min: number; max: number; count: number } | null {
  const db = getDb();
  const { sql, params } = buildWhere(f);
  const rows = db
    .prepare(
      `SELECT salary_min_eur AS lo, salary_max_eur AS hi ${JOB_FROM}
       WHERE ${sql} AND j.salary_disclosed = 1 AND j.salary_max_eur IS NOT NULL`,
    )
    .all(...params) as { lo: number | null; hi: number | null }[];
  if (rows.length === 0) return null;
  const median = (arr: number[]) => {
    const a = arr.filter((x) => x != null).sort((x, y) => x - y);
    if (!a.length) return 0;
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  };
  const lows = rows.map((r) => r.lo ?? r.hi!).filter((x) => x != null);
  const highs = rows.map((r) => r.hi ?? r.lo!).filter((x) => x != null);
  return { min: Math.round(median(lows)), max: Math.round(median(highs)), count: rows.length };
}

export function getJobBySlug(slug: string): JobRow | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${JOB_COLS}, c.website AS company_website ${JOB_FROM} WHERE j.slug = ? ORDER BY (j.status='active') DESC LIMIT 1`)
    .get(slug);
  return (row as unknown as JobRow) ?? null;
}

export function getRelatedJobs(job: JobRow, limit = 6, lang?: "nl" | "en"): JobRow[] {
  const db = getDb();
  const langCond = lang ? " AND j.lang = ?" : "";
  const params = lang
    ? [lang, job.id, job.category, job.company_id, job.company_id, limit]
    : [job.id, job.category, job.company_id, job.company_id, limit];
  return db
    .prepare(
      `SELECT ${JOB_COLS} ${JOB_FROM}
       WHERE j.status='active'${langCond} AND j.id != ? AND (j.category = ? OR j.company_id = ?)
       ORDER BY (j.company_id = ?) DESC, COALESCE(j.posted_at, j.first_seen_at) DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as JobRow[];
}

export interface Stats {
  activeJobs: number;
  newThisWeek: number;
  companies: number;
}
export function getStats(lang?: "nl" | "en"): Stats {
  const db = getDb();
  const langCond = lang ? " AND lang = ?" : "";
  const p = lang ? [lang] : [];
  const a = db
    .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE status='active'${langCond}`)
    .get(...p) as { n: number };
  // "New this week" = actually published in the last 7 days (posted_at), NOT when we first
  // scraped it (first_seen_at). Jobs without a known publish date aren't claimed as new.
  const w = db
    .prepare(
      `SELECT COUNT(*) AS n FROM jobs WHERE status='active' AND posted_at >= datetime('now','-7 days')${langCond}`,
    )
    .get(...p) as { n: number };
  const c = db
    .prepare(`SELECT COUNT(DISTINCT company_id) AS n FROM jobs WHERE status='active'${langCond}`)
    .get(...p) as { n: number };
  return { activeJobs: a.n, newThisWeek: w.n, companies: c.n };
}

export interface Facet {
  key: string;
  label?: string;
  count: number;
}
export interface Facets {
  categories: Facet[];
  seniority: Facet[];
  workMode: Facet[];
  country: Facet[];
  cities: Facet[]; // key = city_slug, label = city
  tools: Facet[];
  lang: Facet[];
}

export function getFacets(lang?: "nl" | "en"): Facets {
  const db = getDb();
  const langCond = lang ? " AND lang = ?" : "";
  const lp = lang ? [lang] : [];
  const groupBy = (col: string): Facet[] =>
    db
      .prepare(
        `SELECT ${col} AS key, COUNT(*) AS count FROM jobs WHERE status='active' AND ${col} IS NOT NULL AND ${col} != ''${langCond} GROUP BY ${col} ORDER BY count DESC`,
      )
      .all(...lp) as unknown as Facet[];

  const cities = db
    .prepare(
      `SELECT city_slug AS key, city AS label, COUNT(*) AS count FROM jobs
       WHERE status='active' AND city_slug IS NOT NULL${langCond} GROUP BY city_slug ORDER BY count DESC LIMIT 40`,
    )
    .all(...lp) as unknown as Facet[];

  // tools live in a JSON array column -> count in JS
  const toolRows = db
    .prepare(
      `SELECT tools_json FROM jobs WHERE status='active' AND tools_json IS NOT NULL AND tools_json != '[]'${langCond}`,
    )
    .all(...lp) as { tools_json: string }[];
  const toolCounts = new Map<string, number>();
  for (const r of toolRows) {
    try {
      for (const t of JSON.parse(r.tools_json) as string[]) {
        toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1);
      }
    } catch {
      /* ignore */
    }
  }
  const tools: Facet[] = [...toolCounts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  return {
    categories: groupBy("category"),
    seniority: groupBy("seniority"),
    workMode: groupBy("work_mode"),
    country: groupBy("country"),
    cities,
    tools,
    lang: groupBy("lang"),
  };
}

export interface CompanyWithCount extends CompanyRow {
  open_count: number;
  featured_live?: number; // computed 0/1: featured AND not expired
}

export function listCompanies(limit?: number, lang?: "nl" | "en"): CompanyWithCount[] {
  const db = getDb();
  const langCond = lang ? " AND j.lang = ?" : "";
  const sql = `SELECT *, ${companyFeatured("")} AS featured_live FROM (
      SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status='active'${langCond}) AS open_count
      FROM companies c
    ) WHERE open_count > 0 ORDER BY ${companyFeatured("")} DESC, open_count DESC, name COLLATE NOCASE ${limit ? "LIMIT ?" : ""}`;
  const params: (string | number)[] = [];
  if (lang) params.push(lang);
  if (limit) params.push(limit);
  return db.prepare(sql).all(...params) as unknown as CompanyWithCount[];
}

/** Live featured/spotlight companies - homepage spotlight + top of /bedrijven. */
export function getFeaturedCompanies(limit = 8): CompanyWithCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status='active') AS open_count,
         ${companyFeatured("c.")} AS featured_live
       FROM companies c WHERE ${companyFeatured("c.")}
       ORDER BY open_count DESC, name COLLATE NOCASE LIMIT ?`,
    )
    .all(limit) as unknown as CompanyWithCount[];
}

export function getCompanyBySlug(slug: string): CompanyWithCount | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status='active') AS open_count,
         ${companyFeatured("c.")} AS featured_live
       FROM companies c WHERE c.slug = ? LIMIT 1`,
    )
    .get(slug);
  return (row as unknown as CompanyWithCount) ?? null;
}

export function getAllActiveJobSlugs(): { slug: string; last_seen_at: string }[] {
  const db = getDb();
  return db
    .prepare("SELECT slug, last_seen_at FROM jobs WHERE status='active' ORDER BY last_seen_at DESC")
    .all() as unknown as { slug: string; last_seen_at: string }[];
}

export function getActiveCompanySlugs(): string[] {
  return listCompanies().map((c) => c.slug);
}

export function getProvinceFacets(lang?: "nl" | "en"): { province: string; count: number }[] {
  const langCond = lang ? " AND lang = ?" : "";
  const p = lang ? [lang] : [];
  return getDb()
    .prepare(
      `SELECT province, COUNT(*) AS count FROM jobs
       WHERE status='active' AND province IS NOT NULL${langCond} GROUP BY province ORDER BY count DESC`,
    )
    .all(...p) as unknown as { province: string; count: number }[];
}
