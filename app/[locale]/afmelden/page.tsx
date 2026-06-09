import type { Metadata } from "next";
import Link from "next/link";
import { Container, Card } from "@/components/ui";
import { withLocale } from "@/lib/urls";
import { getDictionary, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const u = (await getDictionary(locale)).unsubscribe;
  return { title: u.title, alternates: alternates(locale, "/afmelden"), robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { locale } = await params;
  const { token, done } = await searchParams;
  const u = (await getDictionary(locale)).unsubscribe;
  const prefsHref = withLocale(locale, "/vacature-alert");

  // After the POST: success / failure confirmation.
  if (done === "1" || done === "0") {
    const ok = done === "1";
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="text-3xl">{ok ? "👋" : "⚠️"}</div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{ok ? u.doneTitle : u.failTitle}</h1>
          <p className="mt-2 text-slate-600">{ok ? u.doneBody : u.failBody}</p>
          <Link
            href={prefsHref}
            className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {u.prefsCta}
          </Link>
        </Card>
      </Container>
    );
  }

  // Confirm step: a button that POSTs to the API (avoids accidental unsubscribe by link scanners).
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{u.title}</h1>
        <p className="mt-2 text-slate-600">{u.confirm}</p>
        {token ? (
          <form method="POST" action="/api/alerts/unsubscribe" className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {u.button}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-red-600">{u.failBody}</p>
        )}
      </Card>
    </Container>
  );
}
