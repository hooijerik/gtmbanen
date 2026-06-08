import type { Metadata } from "next";
import { Container, Card } from "@/components/ui";
import { EmployerForm } from "@/components/EmployerForm";
import { PackagesGrid } from "@/components/PackagesGrid";
import { getDictionary, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return { title: dict.postJob.title, description: dict.postJob.subtitle, alternates: alternates(locale, "/plaats-vacature") };
}

export default async function PostJobPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const p = dict.premium;
  const packages = p.packages.map((pk) => ({
    value: pk.id,
    label: pk.id === "standaard" ? pk.name : `${pk.name} — ${pk.price}`,
  }));
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.postJob.title}</h1>
        <p className="mt-2 text-slate-600">{dict.postJob.subtitle}</p>
        <Card className="mt-6 p-6">
          <EmployerForm t={dict.forms.employer} packages={packages} packageLabel={dict.forms.employer.package} />
        </Card>
        <p className="mt-4 text-sm text-slate-500">{dict.postJob.atsNote}</p>
      </div>
      <div className="mt-16">
        <PackagesGrid
          packages={p.packages}
          title={p.packagesTitle}
          subtitle={p.packagesSubtitle}
          popularLabel={p.popularBadge}
        />
      </div>
    </Container>
  );
}
