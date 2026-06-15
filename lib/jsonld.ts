// schema.org JobPosting builder. Pure + testable. Produces Google-valid structured
// data for a single job, or null when there is no real description (in which case the
// page must not emit a JobPosting at all — Google requires a description that isn't the title).
import { sanitizeHtml } from "./format";
import { companyWebsiteUrl } from "./urls";
import { SITE } from "./site";
import type { JobRow } from "./types";

/** Normalize a stored date ("YYYY-MM-DD HH:MM:SS" from SQLite, or ISO) to ISO 8601, or null. */
function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value.trim().replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Add N days to a date string; returns ISO 8601 (or null on bad input). */
function addDaysIso(value: string | null | undefined, days: number): string | null {
  const iso = toIso(value);
  if (!iso) return null;
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** schema.org employmentType from a free-text source value. Defaults to FULL_TIME
 *  (the common case for GTM roles) so the recommended field is always present. */
export function employmentType(raw: string | null | undefined): string {
  const t = (raw || "").toLowerCase();
  if (/part|deeltijd/.test(t)) return "PART_TIME";
  if (/intern|stage/.test(t)) return "INTERN";
  if (/contract|tijdelijk|freelance|zzp|interim/.test(t)) return "CONTRACTOR";
  return "FULL_TIME";
}

/** ISO-2 country code → English country name (for applicantLocationRequirements). */
function countryName(code: string): string {
  if (code === "BE") return "Belgium";
  if (code === "DE") return "Germany";
  return "Netherlands";
}

/** Best-effort street + postal code from a raw location string (NL/BE). Most ATS
 *  feeds only carry a city, so these stay undefined for the majority of jobs. */
export function parseStreetPostcode(raw: string | null | undefined): {
  streetAddress?: string;
  postalCode?: string;
} {
  const out: { streetAddress?: string; postalCode?: string } = {};
  if (!raw) return out;
  const s = raw.replace(/\s+/g, " ").trim();
  const nl = s.match(/\b(\d{4})\s?([A-Za-z]{2})\b/); // Dutch postcode "1234 AB"
  if (nl) out.postalCode = `${nl[1]} ${nl[2].toUpperCase()}`;
  else {
    const be = s.match(/\b(\d{4})\b/); // Belgian postal codes are 4 digits
    if (be) out.postalCode = be[1];
  }
  // Street like "Keizersgracht 123" preceding a comma or a postcode.
  const street = s.match(/([A-Za-zÀ-ÿ.'\- ]+\s\d+[A-Za-z]?)(?=\s*,|\s+\d{4})/);
  if (street) {
    const cand = street[1].trim();
    if (/\d/.test(cand) && cand.length >= 4 && cand.length <= 80) out.streetAddress = cand;
  }
  return out;
}

/** Build the JobPosting JSON-LD for a job, or null when it lacks a usable description. */
export function buildJobPostingJsonLd(
  job: JobRow,
  opts: { siteUrl: string },
): Record<string, unknown> | null {
  // description is REQUIRED and must not equal the title — skip the whole block if absent.
  const descHtml = job.description_html ? sanitizeHtml(job.description_html) : null;
  const description = descHtml || job.description_text || null;
  if (!description) return null;

  const datePosted = toIso(job.posted_at) || toIso(job.first_seen_at);
  if (!datePosted) return null; // datePosted is required

  // validThrough: active jobs stay valid ~30d past last confirmation (always future while
  // the scraper keeps seeing them); expired jobs end at last_seen (past → Google drops them).
  const validThrough =
    job.status === "expired"
      ? toIso(job.last_seen_at)
      : addDaysIso(job.last_seen_at || job.first_seen_at, 30);

  const isRemote = job.work_mode === "remote" || job.country === "REMOTE";
  const country = job.country && job.country !== "REMOTE" ? job.country : "NL"; // never "REMOTE"
  const { streetAddress, postalCode } = parseStreetPostcode(job.location_raw);

  const address: Record<string, unknown> = { "@type": "PostalAddress", addressCountry: country };
  if (streetAddress) address.streetAddress = streetAddress;
  if (job.city) address.addressLocality = job.city;
  if (job.province) address.addressRegion = job.province;
  if (postalCode) address.postalCode = postalCode;
  const hasPlace = !!(job.city || job.province || streetAddress);
  const sameAs = companyWebsiteUrl(job.company_website); // normalize bare domains to a full https URL

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted,
    ...(validThrough ? { validThrough } : {}),
    employmentType: employmentType(job.employment_type),
    identifier: { "@type": "PropertyValue", name: SITE.name, value: String(job.id) },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      ...(job.company_logo ? { logo: job.company_logo } : {}),
      ...(sameAs ? { sameAs } : {}),
    },
    directApply: false,
    url: `${opts.siteUrl}/vacature/${job.slug}`,
  };

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = { "@type": "Country", name: countryName(country) };
    if (hasPlace) jsonLd.jobLocation = { "@type": "Place", address };
  } else {
    jsonLd.jobLocation = { "@type": "Place", address };
  }

  if (job.salary_disclosed && job.salary_min) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salary_currency || "EUR",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary_min,
        maxValue: job.salary_max || job.salary_min,
        unitText:
          job.salary_interval === "month" ? "MONTH" : job.salary_interval === "hour" ? "HOUR" : "YEAR",
      },
    };
  }

  return jsonLd;
}
