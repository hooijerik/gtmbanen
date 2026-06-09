import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Chip } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompanyLogo } from "@/components/CompanyLogo";
import { CompanyLinks } from "@/components/CompanyLinks";
import { JobCard } from "@/components/JobCard";
import { getCompanyBySlug, listJobs } from "@/lib/queries";
import { getDictionary, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";
import { withLocale } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const c = getCompanyBySlug(slug);
  if (!c) return { title: dict.companies.notFound };
  return {
    title: dict.companies.jobsAt(c.name),
    description: dict.companies.jobsAt(c.name),
    alternates: alternates(locale, `/bedrijven/${c.slug}`),
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();
  const dict = await getDictionary(locale);

  const jobs = listJobs(
    { company: slug, lang: locale === "en" ? "en" : undefined },
    { sort: "newest", perPage: 100 },
  );

  return (
    <Container className="py-8">
      <Breadcrumbs
        ariaLabel={dict.breadcrumbs.aria}
        items={[
          { label: dict.breadcrumbs.home, href: withLocale(locale, "/") },
          { label: dict.nav.companies, href: withLocale(locale, "/bedrijven") },
          { label: company.name },
        ]}
      />

      {company.featured_live && company.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.banner_url}
          alt={company.name}
          className="mt-4 h-40 w-full rounded-2xl border border-amber-200 object-cover"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <CompanyLogo src={company.logo_url} name={company.name} size={64} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{company.name}</h1>
            {company.featured_live ? <Chip tone="premium">{dict.premium.companyTitle}</Chip> : null}
          </div>
          {company.featured_live && company.tagline ? (
            <p className="mt-0.5 text-slate-600">{company.tagline}</p>
          ) : null}
          <p className="mt-0.5 text-slate-500">{dict.companies.openRoles(jobs.length)}</p>
          <CompanyLinks
            name={company.name}
            website={company.website}
            labels={{
              website: dict.companies.website,
              linkedin: dict.companies.linkedin,
              glassdoor: dict.companies.glassdoor,
            }}
          />
        </div>
      </div>

      {company.featured_live && company.description ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 leading-relaxed text-slate-700">
          {company.description}
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} locale={locale} />
        ))}
      </div>
    </Container>
  );
}
