// Job-alert digest sender. Run: npm run alerts:send
// Sends via Resend if RESEND_API_KEY is set, otherwise prints a dry-run to the console.
import { getDb } from "../lib/db";
import { listJobs } from "../lib/queries";
import { geoCity, geoForCityName, haversineKm } from "../lib/geo";
import { SITE } from "../lib/site";
import { formatSalaryRange } from "../lib/format";
import { categoryLabel } from "../lib/taxonomy";
import { sendEmail, alertEmailFooter, listUnsubscribeHeaders } from "../lib/email";
import type { JobRow } from "../lib/types";

interface Sub {
  id: number;
  email: string;
  filters_json: string | null;
  frequency: string;
  last_sent_at: string | null;
  unsubscribe_token: string | null;
}

function renderDigest(jobs: JobRow[], token: string): string {
  const rows = jobs
    .map((j) => {
      const sal = formatSalaryRange(j.salary_min, j.salary_max, j.salary_currency, j.salary_interval);
      const meta = [j.company_name, j.city, categoryLabel(j.category), sal].filter(Boolean).join(" · ");
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">
        <a href="${SITE.url}/vacature/${j.slug}" style="color:#6d28d9;font-weight:600;text-decoration:none">${j.title}</a>
        <br><span style="color:#555;font-size:14px">${meta}</span></td></tr>`;
    })
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
    <h2 style="color:#0f172a">Nieuwe GTM-vacatures</h2>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="margin-top:16px"><a href="${SITE.url}/vacatures" style="color:#6d28d9">Bekijk alle vacatures →</a></p>
    ${alertEmailFooter(token)}
  </div>`;
}

async function main() {
  const db = getDb();
  const subs = db
    .prepare("SELECT id, email, filters_json, frequency, last_sent_at, unsubscribe_token FROM subscribers")
    .all() as unknown as Sub[];

  if (subs.length === 0) {
    console.log("Geen abonnees gevonden.");
    return;
  }

  for (const s of subs) {
    const filters = s.filters_json ? JSON.parse(s.filters_json) : {};
    // category/seniority/salaryMin are applied in SQL; distance is matched here by coords.
    // The centre comes from the subscriber's geocoded postcode (lat/lng).
    const lat = Number(filters.lat);
    const lng = Number(filters.lng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : geoCity(filters.near);
    const useDistance = !!center && !!filters.radiusKm;
    let recent = listJobs(filters, { sort: "newest", perPage: useDistance ? 200 : 25 });
    if (useDistance && center) {
      const radiusKm = Number(filters.radiusKm) || 25;
      recent = recent.filter((j) => {
        if (j.work_mode === "remote") return true; // remote works near any location
        const g = geoCity(j.city_slug) ?? geoForCityName(j.city);
        return g ? haversineKm(center.lat, center.lng, g.lat, g.lng) <= radiusKm : false;
      });
    }
    const fresh = s.last_sent_at
      ? recent.filter((j) => (j.first_seen_at || "") > s.last_sent_at!)
      : recent.slice(0, 10);

    if (fresh.length === 0) {
      console.log(`${s.email}: geen nieuwe vacatures`);
      continue;
    }
    const res = await sendEmail({
      to: s.email,
      subject: `${fresh.length} nieuwe GTM-vacatures op ${SITE.name}`,
      headers: listUnsubscribeHeaders(s.unsubscribe_token || ""),
      html: renderDigest(fresh, s.unsubscribe_token || ""),
    });
    db.prepare("UPDATE subscribers SET last_sent_at = datetime('now') WHERE id = ?").run(s.id);
    console.log(`${s.email}: ${fresh.length} vacatures (${res})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
