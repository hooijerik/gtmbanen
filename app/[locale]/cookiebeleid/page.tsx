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
      "GTM Banen (gtmbanen.nl), een initiatief van GTM AI, gebruikt cookies. Hieronder lees je welke en waarvoor. We draaien geen advertentie-trackers.",
    sections: [
      ["Wat zijn cookies?", "Cookies zijn kleine tekstbestanden die een website op je apparaat opslaat. We gebruiken ze zo beperkt mogelijk en zonder advertentie- of profileringstrackers."],
      ["Noodzakelijke cookies (altijd actief)", "Een functionele cookie (gtmb_consent) onthoudt je cookiekeuze. Daarnaast gebruiken we Google Analytics 4 voor anonieme, privacyvriendelijke bezoekstatistieken (IP-adres ingekort, geen advertentie- of CRM-deling). Deze meting is noodzakelijk om de site te laten werken en te verbeteren, en wordt daarom zonder toestemming geplaatst."],
      ["Cookies met toestemming", "Microsoft Clarity (geanonimiseerde heatmaps en sessie-inzichten) laden we alléén nadat je op 'Alles accepteren' klikt. Kies je 'Alleen noodzakelijk', dan wordt Clarity niet geladen en plaatst het niets."],
      ["Verwerkers & doorgifte", "Google Analytics wordt geleverd door Google Ireland Ltd. en Microsoft Clarity door Microsoft Ireland Operations Ltd. Gegevens kunnen naar de VS worden doorgegeven onder passende waarborgen (EU-modelcontractbepalingen / EU-US Data Privacy Framework). IP-adressen worden ingekort/geanonimiseerd."],
      ["Je keuze wijzigen", "Je kunt je toestemming voor Clarity altijd intrekken of geven door de cookie 'gtmb_consent' in je browser te verwijderen; bij je volgende bezoek verschijnt de banner opnieuw. Je kunt cookies ook beheren of weigeren via je browserinstellingen."],
      ["Contact", "Vragen over dit cookiebeleid of je gegevens? Mail info@gtmai.nl."],
    ],
    table: ["Cookie", "Doel", "Bewaartermijn"],
    rows: [
      ["gtmb_consent", "Onthoudt je cookiekeuze (functioneel)", "12 maanden"],
      ["_ga / _ga_*", "Google Analytics 4 — anonieme statistiek (noodzakelijk)", "tot 24 maanden"],
      ["_clck / _clsk", "Microsoft Clarity — alleen met toestemming", "tot 12 maanden"],
    ],
  },
  en: {
    title: "Cookie policy",
    updated: "Last updated: June 2026",
    intro:
      "GTM Banen (gtmbanen.nl), an initiative by GTM AI, uses cookies. Below is what we use and why. We run no advertising trackers.",
    sections: [
      ["What are cookies?", "Cookies are small text files a website stores on your device. We use them sparingly and run no advertising or profiling trackers."],
      ["Necessary cookies (always on)", "A functional cookie (gtmb_consent) remembers your cookie choice. We also use Google Analytics 4 for anonymous, privacy-friendly visitor statistics (IP address truncated, no advertising or CRM sharing). This measurement is necessary to run and improve the site and is therefore set without consent."],
      ["Cookies with consent", "Microsoft Clarity (anonymised heatmaps and session insights) only loads after you click 'Accept all'. If you choose 'Necessary only', Clarity is not loaded and sets nothing."],
      ["Processors & transfers", "Google Analytics is provided by Google Ireland Ltd. and Microsoft Clarity by Microsoft Ireland Operations Ltd. Data may be transferred to the US under appropriate safeguards (EU Standard Contractual Clauses / EU-US Data Privacy Framework). IP addresses are truncated/anonymised."],
      ["Changing your choice", "You can withdraw or give consent for Clarity anytime by deleting the 'gtmb_consent' cookie in your browser; the banner reappears on your next visit. You can also manage or block cookies via your browser settings."],
      ["Contact", "Questions about this policy or your data? Email info@gtmai.nl."],
    ],
    table: ["Cookie", "Purpose", "Retention"],
    rows: [
      ["gtmb_consent", "Remembers your cookie choice (functional)", "12 months"],
      ["_ga / _ga_*", "Google Analytics 4 — anonymous statistics (necessary)", "up to 24 months"],
      ["_clck / _clsk", "Microsoft Clarity — only with consent", "up to 12 months"],
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
