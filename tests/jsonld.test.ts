// Lightweight test runner (no framework). Run with: npm test
import { buildJobPostingJsonLd, employmentType, parseStreetPostcode } from "../lib/jsonld";
import type { JobRow } from "../lib/types";

let pass = 0;
const fails: string[] = [];
function check(name: string, cond: boolean) {
  if (cond) pass++;
  else fails.push(name);
}

// Minimal JobRow with sensible defaults; override per test.
function jobRow(extra: Partial<JobRow> = {}): JobRow {
  return {
    id: 1, source: "greenhouse", source_id: "x", company_id: 1,
    company_name: "Acme", company_slug: "acme", company_logo: null,
    title: "Account Executive", title_norm: "account executive", slug: "acme-account-executive",
    url: "https://x", apply_url: null,
    description_html: "<p>Een mooie rol met veel verantwoordelijkheden in ons team.</p>",
    description_text: null,
    location_raw: "Amsterdam", city: "Amsterdam", city_slug: "amsterdam", province: "Noord-Holland",
    country: "NL", work_mode: "onsite", category: "sales", seniority: "senior",
    employment_type: null,
    salary_min: null, salary_max: null, salary_currency: null, salary_interval: null,
    salary_min_eur: null, salary_max_eur: null, salary_disclosed: 0,
    comp_structure: null, equity_type: null, tools_json: null, reports_to: null, ai_required: 0,
    lang: "nl", featured: 0, featured_until: null,
    posted_at: "2026-06-01T09:00:00Z", first_seen_at: "2026-06-01 09:00:00",
    last_seen_at: "2026-06-08 09:00:00", status: "active", hash: "h",
    ...extra,
  };
}
const OPTS = { siteUrl: "https://gtmbanen.nl" };
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- employmentType: signal mapping + default ----
check("emp: deeltijd -> PART_TIME", employmentType("Deeltijd") === "PART_TIME");
check("emp: freelance/zzp -> CONTRACTOR", employmentType("Freelance / ZZP") === "CONTRACTOR");
check("emp: stage -> INTERN", employmentType("Stage") === "INTERN");
check("emp: null -> FULL_TIME (default)", employmentType(null) === "FULL_TIME");
check("emp: unknown -> FULL_TIME (default)", employmentType("weird value") === "FULL_TIME");

// ---- validThrough ----
const active = buildJobPostingJsonLd(jobRow(), OPTS)!;
check("active: has validThrough", typeof active.validThrough === "string");
check(
  "active: validThrough in the future vs last_seen",
  new Date(active.validThrough as string).getTime() > new Date("2026-06-08T09:00:00Z").getTime(),
);
check("active: employmentType always set", active.employmentType === "FULL_TIME");
check("active: has identifier", !!active.identifier);
const withSite = buildJobPostingJsonLd(jobRow({ company_website: "acme.com" }), OPTS)!;
check("sameAs: bare domain normalized to https URL", (withSite.hiringOrganization as any).sameAs === "https://acme.com");
const expired = buildJobPostingJsonLd(jobRow({ status: "expired" }), OPTS)!;
check(
  "expired: validThrough earlier than active (no +30)",
  new Date(expired.validThrough as string).getTime() < new Date(active.validThrough as string).getTime(),
);

// ---- location: onsite ----
const onsiteAddr = (active.jobLocation as any).address;
check("onsite: addressLocality", onsiteAddr.addressLocality === "Amsterdam");
check("onsite: addressRegion", onsiteAddr.addressRegion === "Noord-Holland");
check("onsite: addressCountry NL", onsiteAddr.addressCountry === "NL");
check("onsite: no jobLocationType", active.jobLocationType === undefined);

// ---- location: remote (country must never be "REMOTE") ----
const remote = buildJobPostingJsonLd(
  jobRow({ work_mode: "remote", country: "REMOTE", city: null, province: null, location_raw: "Remote" }),
  OPTS,
)!;
check("remote: TELECOMMUTE", remote.jobLocationType === "TELECOMMUTE");
check("remote: applicantLocationRequirements present", !!remote.applicantLocationRequirements);
check("remote: no jobLocation when no real place", remote.jobLocation === undefined);
const remoteBE = buildJobPostingJsonLd(jobRow({ work_mode: "remote", country: "BE" }), OPTS)!;
check(
  "remote+BE: country not REMOTE",
  (remoteBE.jobLocation as any)?.address.addressCountry === "BE",
);
check(
  "remote+BE: applicant country name = Belgium",
  (remoteBE.applicantLocationRequirements as any).name === "Belgium",
);

// ---- description ----
check("desc: never equals title", active.description !== active.title);
check(
  "desc: null builder when no description",
  buildJobPostingJsonLd(jobRow({ description_html: null, description_text: null }), OPTS) === null,
);

// ---- baseSalary ----
const sal = buildJobPostingJsonLd(
  jobRow({ salary_disclosed: 1, salary_min: 60000, salary_max: 80000, salary_currency: "EUR", salary_interval: "year" }),
  OPTS,
)!;
check("salary: baseSalary present when disclosed", !!sal.baseSalary);
check("salary: unitText YEAR", (sal.baseSalary as any).value.unitText === "YEAR");
check("salary: absent when not disclosed", active.baseSalary === undefined);

// ---- parseStreetPostcode ----
check("postcode: NL '1015 CJ'", parseStreetPostcode("Keizersgracht 123, 1015 CJ Amsterdam").postalCode === "1015 CJ");
check("postcode: normalizes spacing/case", parseStreetPostcode("1015cj Amsterdam").postalCode === "1015 CJ");
check("postcode: none for bare city", parseStreetPostcode("Amsterdam").postalCode === undefined);
check("street: parsed when present", parseStreetPostcode("Keizersgracht 123, 1015 CJ Amsterdam").streetAddress === "Keizersgracht 123");
check("street: none for bare city", parseStreetPostcode("Amsterdam").streetAddress === undefined);

// ---- summary ----
console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFailures:\n - " + fails.join("\n - "));
  process.exit(1);
}
