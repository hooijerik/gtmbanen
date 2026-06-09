import { companyWebsiteUrl, glassdoorSearchUrl, linkedinCompanySearchUrl } from "@/lib/urls";

// External "link-out" row for a company: website (if known) + LinkedIn and
// Glassdoor search deep-links derived from the company name. No data is stored
// or fetched — these are plain links, so there's no API or ToS dependency.
export function CompanyLinks({
  name,
  website,
  labels,
}: {
  name: string;
  website?: string | null;
  labels: { website: string; linkedin: string; glassdoor: string };
}) {
  const site = companyWebsiteUrl(website);
  const links = [
    site ? { label: labels.website, href: site } : null,
    { label: labels.linkedin, href: linkedinCompanySearchUrl(name) },
    { label: labels.glassdoor, href: glassdoorSearchUrl(name) },
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
        >
          {l.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
