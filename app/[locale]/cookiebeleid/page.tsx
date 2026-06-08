import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Cookie policy" : "Cookiebeleid",
    description: locale === "en" ? "How GTM Banen uses cookies and analytics." : "Hoe GTM Banen cookies en analytics gebruikt.",
    alternates: alternates(locale, "/cookiebeleid"),
    robots: { index: true, follow: true },
  };
}

const COPY = {
  nl: {
    title: "Cookiebeleid",
    updated: "Laatst bijgewerkt: juni 2026",
    intro:
      "GTM Banen (gtmbanen.nl), een initiatief van GTM AI, gebruikt cookies. Hieronder lees je welke en waarvoor. Analytische cookies plaatsen we alleen met jouw toestemming via de cookiebanner.",
    sections: [
      ["Wat zijn cookies?", "Cookies zijn kleine tekstbestanden die een website op je apparaat opslaat. We gebruiken ze zo beperkt mogelijk en zonder advertentie-trackers."],
      ["Functionele cookies (altijd actief)", "Eén strikt noodzakelijke cookie (gtmb_consent) onthoudt je cookiekeuze, zodat we je niet bij elk bezoek opnieuw vragen. Hiervoor is geen toestemming nodig."],
      ["Analytische cookies (alleen met toestemming)", "Na jouw akkoord laden we Google Analytics 4 (meet anoniem bezoek en gebruik) en Microsoft Clarity (geanonimiseerde gebruiksstatistieken/heatmaps). Zonder toestemming worden deze niet geladen en plaatsen ze niets."],
      ["Verwerkers & doorgifte", "Google Analytics wordt geleverd door Google Ireland Ltd. en Microsoft Clarity door Microsoft Ireland Operations Ltd. Gegevens kunnen naar de VS worden doorgegeven onder passende waarborgen (EU-modelcontractbepalingen / EU-US Data Privacy Framework). IP-adressen worden ingekort/geanonimiseerd."],
      ["Je toestemming intrekken", "Je kunt je keuze altijd wijzigen door de cookie 'gtmb_consent' in je browser te verwijderen; bij je volgende bezoek verschijnt de banner opnieuw. Je kunt cookies ook beheren via je browserinstellingen."],
      ["Contact", "Vragen over dit cookiebeleid of je gegevens? Mail info@gtmai.nl."],
    ],
    table: ["Cookie", "Doel", "Bewaartermijn"],
    rows: [
      ["gtmb_consent", "Onthoudt je cookiekeuze (functioneel)", "12 maanden"],
      ["_ga / _ga_*", "Google Analytics 4 — anonieme statistieken", "tot 24 maanden"],
      ["_clck / _clsk", "Microsoft Clarity — gebruiksstatistieken", "tot 12 maanden"],
    ],
  },
  en: {
    title: "Cookie policy",
    updated: "Last updated: June 2026",
    intro:
      "GTM Banen (gtmbanen.nl), an initiative by GTM AI, uses cookies. Below is what we use and why. Analytics cookies are only set after you consent via the cookie banner.",
    sections: [
      ["What are cookies?", "Cookies are small text files a website stores on your device. We use them sparingly and run no advertising trackers."],
      ["Functional cookies (always on)", "One strictly necessary cookie (gtmb_consent) remembers your cookie choice so we don't ask on every visit. No consent is required for this."],
      ["Analytics cookies (only with consent)", "After you accept, we load Google Analytics 4 (anonymous traffic and usage) and Microsoft Clarity (anonymised usage stats/heatmaps). Without consent these never load and set nothing."],
      ["Processors & transfers", "Google Analytics is provided by Google Ireland Ltd. and Microsoft Clarity by Microsoft Ireland Operations Ltd. Data may be transferred to the US under appropriate safeguards (EU Standard Contractual Clauses / EU-US Data Privacy Framework). IP addresses are truncated/anonymised."],
      ["Withdrawing consent", "You can change your choice anytime by deleting the 'gtmb_consent' cookie in your browser; the banner reappears on your next visit. You can also manage cookies via your browser settings."],
      ["Contact", "Questions about this policy or your data? Email info@gtmai.nl."],
    ],
    table: ["Cookie", "Purpose", "Retention"],
    rows: [
      ["gtmb_consent", "Remembers your cookie choice (functional)", "12 months"],
      ["_ga / _ga_*", "Google Analytics 4 — anonymous statistics", "up to 24 months"],
      ["_clck / _clsk", "Microsoft Clarity — usage statistics", "up to 12 months"],
    ],
  },
};

export default async function CookiePolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const c = COPY[locale === "en" ? "en" : "nl"];
  return (
    <Container className="py-12">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{c.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{c.updated}</p>
        <p className="mt-4 text-slate-700">{c.intro}</p>

        <div className="mt-6 space-y-5">
          {c.sections.map(([h, p], i) => (
            <div key={i}>
              <h2 className="mb-1 text-lg font-bold text-slate-900">{h}</h2>
              <p className="leading-relaxed text-slate-700">{p}</p>
            </div>
          ))}
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead className="text-left text-slate-400">
            <tr>{c.table.map((th) => <th key={th} className="border-b border-slate-200 py-2 pr-3">{th}</th>)}</tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                {r.map((td, j) => <td key={j} className="py-2 pr-3 text-slate-600">{td}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </Container>
  );
}
