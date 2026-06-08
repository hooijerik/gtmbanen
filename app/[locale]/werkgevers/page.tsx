import type { Metadata } from "next";
import Link from "next/link";
import { Container, Card } from "@/components/ui";
import { PackagesGrid } from "@/components/PackagesGrid";
import { countLongOpenJobs } from "@/lib/queries";
import { withLocale } from "@/lib/urls";
import { getDictionary, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const e = (await getDictionary(locale)).employers;
  return {
    title: `${e.titlePre} ${e.titleHighlight}${e.titleSuffix ? ` ${e.titleSuffix}` : ""}`,
    description: e.subtitle,
    alternates: alternates(locale, "/werkgevers"),
  };
}

export default async function EmployersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const e = dict.employers;
  const p = dict.premium;
  const longOpen = countLongOpenJobs(30);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          {e.titlePre} <span className="text-brand-600">{e.titleHighlight}</span>
          {e.titleSuffix ? ` ${e.titleSuffix}` : ""}
        </h1>
        <p className="mt-3 text-lg text-slate-600">{e.subtitle}</p>
        <Link
          href={withLocale(locale, "/plaats-vacature")}
          className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {e.postJob}
        </Link>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
        {e.steps.map((s, i) => (
          <Card key={i} className="p-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
              {i + 1}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{s.t}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.d}</p>
          </Card>
        ))}
      </div>

      {/* Paid placement options (Plaatsingsopties) */}
      <div className="mt-16">
        <PackagesGrid
          packages={p.packages}
          title={p.packagesTitle}
          subtitle={p.packagesSubtitle}
          ctaLabel={p.packageCta}
          ctaHref={withLocale(locale, "/plaats-vacature")}
          popularLabel={p.popularBadge}
        />
      </div>

      {/* Interim proposition (GTM AI) for long-open roles */}
      <Card className="mx-auto mt-14 max-w-4xl border-brand-700 bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white sm:p-10">
        <span className="text-sm font-medium text-brand-200">{e.interimLabel}</span>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{e.interimTitle}</h2>
        <p className="mt-3 max-w-2xl text-brand-100">
          {longOpen > 0 ? e.interimBody(longOpen) : e.interimBodyZero}
        </p>
        <p className="mt-3 max-w-2xl text-brand-100">{e.interimPitch}</p>
        <a
          href={locale === "en" ? "https://gtmai.nl/en/interim" : "https://gtmai.nl/interim/"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
        >
          {e.interimCta}
        </a>
      </Card>
    </Container>
  );
}
