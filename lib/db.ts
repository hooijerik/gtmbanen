// SQLite connection + schema, using Node's built-in `node:sqlite` (no native build).
// Used by both the scrapers (writes) and the Next.js server components (reads).

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website TEXT,
  ats_type TEXT,
  ats_slug TEXT,
  logo_url TEXT,
  hq_city TEXT,
  size TEXT,
  industry TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  title_norm TEXT NOT NULL,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  apply_url TEXT,
  description_html TEXT,
  description_text TEXT,
  location_raw TEXT,
  city TEXT,
  city_slug TEXT,
  province TEXT,
  country TEXT,
  work_mode TEXT,
  category TEXT NOT NULL,
  seniority TEXT,
  employment_type TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT,
  salary_interval TEXT,
  salary_min_eur REAL,
  salary_max_eur REAL,
  salary_disclosed INTEGER NOT NULL DEFAULT 0,
  comp_structure TEXT,
  equity_type TEXT,
  tools_json TEXT,
  reports_to TEXT,
  ai_required INTEGER NOT NULL DEFAULT 0,
  posted_at TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active',
  hash TEXT NOT NULL,
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs(seniority);
CREATE INDEX IF NOT EXISTS idx_jobs_city_slug ON jobs(city_slug);
CREATE INDEX IF NOT EXISTS idx_jobs_province ON jobs(province);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_workmode ON jobs(work_mode);
CREATE INDEX IF NOT EXISTS idx_jobs_status_posted ON jobs(status, posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  filters_json TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  confirmed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_sent_at TEXT,
  unsubscribe_token TEXT
);

CREATE TABLE IF NOT EXISTS employer_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  contact_email TEXT,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  started_at TEXT,
  finished_at TEXT,
  found INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  errors_json TEXT
);

CREATE TABLE IF NOT EXISTS premium_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                    -- 'job' | 'company' | 'combo'
  job_id INTEGER REFERENCES jobs(id),
  company_id INTEGER REFERENCES companies(id),
  buyer_email TEXT,
  company_name TEXT,
  package TEXT,
  amount_eur REAL,
  status TEXT NOT NULL DEFAULT 'lead',   -- lead|invoiced|paid|active|expired|cancelled
  starts_at TEXT,
  expires_at TEXT,
  invoice_ref TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

let _db: DatabaseSync | null = null;

export function dbPath(): string {
  return process.env.GTMBANEN_DB || path.join(process.cwd(), "data", "gtmbanen.db");
}

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const file = dbPath();
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  // Migration: add `lang` to existing DBs (schema uses CREATE TABLE IF NOT EXISTS).
  const cols = db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "lang")) {
    db.exec("ALTER TABLE jobs ADD COLUMN lang TEXT NOT NULL DEFAULT 'nl'");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_jobs_lang ON jobs(lang)");
  // Migration: premium placements - featured flags + richer company profile.
  if (!cols.some((c) => c.name === "featured")) {
    db.exec("ALTER TABLE jobs ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
    db.exec("ALTER TABLE jobs ADD COLUMN featured_until TEXT");
  }
  const ccols = db.prepare("PRAGMA table_info(companies)").all() as { name: string }[];
  if (!ccols.some((c) => c.name === "featured")) {
    db.exec("ALTER TABLE companies ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
    db.exec("ALTER TABLE companies ADD COLUMN featured_until TEXT");
    db.exec("ALTER TABLE companies ADD COLUMN tagline TEXT");
    db.exec("ALTER TABLE companies ADD COLUMN description TEXT");
    db.exec("ALTER TABLE companies ADD COLUMN banner_url TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(featured)");
  // Migration: per-subscriber unsubscribe token (powers email unsubscribe links).
  const scols = db.prepare("PRAGMA table_info(subscribers)").all() as { name: string }[];
  if (!scols.some((c) => c.name === "unsubscribe_token")) {
    db.exec("ALTER TABLE subscribers ADD COLUMN unsubscribe_token TEXT");
  }
  const needToken = db
    .prepare("SELECT id FROM subscribers WHERE unsubscribe_token IS NULL OR unsubscribe_token = ''")
    .all() as { id: number }[];
  for (const r of needToken) {
    db.prepare("UPDATE subscribers SET unsubscribe_token = ? WHERE id = ?").run(randomUUID(), r.id);
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_subscribers_token ON subscribers(unsubscribe_token)");
  _db = db;
  return db;
}
