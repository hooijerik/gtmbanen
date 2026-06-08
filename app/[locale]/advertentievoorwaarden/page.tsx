import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/meta";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Advertising terms" : "Advertentievoorwaarden",
    description:
      locale === "en"
        ? "Terms for paid placements (premium jobs and featured companies) on GTM Banen."
        : "Voorwaarden voor betaalde plaatsingen (premium vacatures en uitgelichte bedrijven) op GTM Banen.",
    alternates: alternates(locale, "/advertentievoorwaarden"),
  };
}

const ENTITY = "GTM AI, KvK 97159751, BTW NL867933914B01, Willibrordweg 18, 3911 CC Rhenen";

const COPY = {
  nl: {
    title: "Advertentievoorwaarden",
    updated: "Versie juni 2026",
    intro: `Deze voorwaarden gelden voor elke betaalde plaatsing op GTM Banen (gtmbanen.nl), een dienst van ${ENTITY}.`,
    clauses: [
      ["1. Definities", `"GTM Banen" is de vacaturebank op gtmbanen.nl, een dienst van ${ENTITY}. "Adverteerder" is de partij die een betaalde plaatsing afneemt. "Plaatsing" is een premium vacature en/of een uitgelicht bedrijfsprofiel.`],
      ["2. Toepasselijkheid", "Deze voorwaarden zijn van toepassing op elke betaalde plaatsing en gaan vóór eventuele inkoop- of advertentievoorwaarden van de adverteerder."],
      ["3. Totstandkoming", "Een overeenkomst komt tot stand na schriftelijke bevestiging of offerte door GTM Banen en akkoord van de adverteerder. Een plaatsing start na ontvangst van betaling, tenzij schriftelijk anders is afgesproken."],
      ["4. Tarieven & betaling", "Prijzen zijn in euro's en exclusief 21% btw. Voor zakelijke afnemers in België wordt de btw verlegd (intracommunautaire dienst). De betaaltermijn is 14 dagen. Bij niet-tijdige betaling mag GTM Banen de plaatsing opschorten of verwijderen."],
      ["5. Looptijd", "De plaatsing loopt gedurende de overeengekomen periode (bijvoorbeeld 30 of 60 dagen, of per maand/kwartaal/jaar) en eindigt daarna automatisch. Verlenging gebeurt op aanvraag tegen het dan geldende tarief."],
      ["6. Inhoud & verantwoordelijkheid", "De adverteerder staat in voor de juistheid en rechtmatigheid van de aangeleverde inhoud (vacaturetekst, logo, banner) en garandeert dat het om echte, actuele vacatures gaat en dat hij over de benodigde rechten beschikt. Inhoud mag niet misleidend, discriminerend of in strijd met de wet zijn."],
      ["7. Redactioneel recht", "GTM Banen mag plaatsingen weigeren, redactioneel inkorten of verwijderen die niet passen bij het go-to-market profiel van het platform of die in strijd zijn met deze voorwaarden, zonder restitutieplicht bij schending door de adverteerder."],
      ["8. Geen resultaatsgarantie", "GTM Banen spant zich in voor zichtbaarheid, maar geeft geen garantie op een aantal weergaven, kliks of sollicitanten."],
      ["9. Annulering & restitutie", "Annuleren kan kosteloos tot publicatie. Na publicatie is geen restitutie mogelijk, omdat de dienst dan is geleverd."],
      ["10. Beschikbaarheid", "GTM Banen streeft naar continue beschikbaarheid maar is niet aansprakelijk voor tijdelijke onderbrekingen of overmacht. Dagen die door een storing verloren gaan, worden waar redelijk gecompenseerd in looptijd."],
      ["11. Aansprakelijkheid", "De aansprakelijkheid van GTM Banen is beperkt tot het voor de betreffende plaatsing betaalde bedrag. Indirecte of gevolgschade is uitgesloten."],
      ["12. Privacy & transparantie", "Persoonsgegevens worden verwerkt conform het privacy- en cookiebeleid. Betaalde plaatsingen worden herkenbaar gelabeld als “Uitgelicht”."],
      ["13. Toepasselijk recht", "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter van de Rechtbank Midden-Nederland."],
    ],
    contact: "Vragen over deze voorwaarden? Mail info@gtmai.nl.",
  },
  en: {
    title: "Advertising terms",
    updated: "Version June 2026",
    intro: `These terms apply to every paid placement on GTM Banen (gtmbanen.nl), a service of ${ENTITY}. The Dutch version is binding.`,
    clauses: [
      ["1. Definitions", `"GTM Banen" is the job board at gtmbanen.nl, a service of ${ENTITY}. "Advertiser" is the party purchasing a paid placement. "Placement" is a premium job and/or a featured company profile.`],
      ["2. Scope", "These terms apply to every paid placement and prevail over any purchasing or advertising terms of the advertiser."],
      ["3. Formation", "An agreement is formed after written confirmation or quote by GTM Banen and acceptance by the advertiser. A placement starts upon receipt of payment unless agreed otherwise in writing."],
      ["4. Pricing & payment", "Prices are in euros, excluding 21% VAT. For business customers in Belgium VAT is reverse-charged (intra-EU service). Payment term is 14 days. On late payment GTM Banen may suspend or remove the placement."],
      ["5. Term", "The placement runs for the agreed period (e.g. 30 or 60 days, or per month/quarter/year) and then ends automatically. Renewal is on request at the then-current rate."],
      ["6. Content & responsibility", "The advertiser is responsible for the accuracy and lawfulness of submitted content (job text, logo, banner) and warrants that the jobs are real and current and that it holds the necessary rights. Content may not be misleading, discriminatory or unlawful."],
      ["7. Editorial rights", "GTM Banen may refuse, shorten or remove placements that do not fit the platform's go-to-market profile or breach these terms, without a refund obligation in case of breach by the advertiser."],
      ["8. No performance guarantee", "GTM Banen makes reasonable efforts for visibility but gives no guarantee of impressions, clicks or applicants."],
      ["9. Cancellation & refunds", "Cancellation is free until publication. After publication no refund is possible, as the service has then been delivered."],
      ["10. Availability", "GTM Banen aims for continuous availability but is not liable for temporary interruptions or force majeure. Days lost to an outage are reasonably compensated in run time."],
      ["11. Liability", "GTM Banen's liability is limited to the amount paid for the relevant placement. Indirect or consequential damages are excluded."],
      ["12. Privacy & transparency", "Personal data is processed per the privacy and cookie policy. Paid placements are clearly labelled “Featured”."],
      ["13. Governing law", "Dutch law applies. Disputes are submitted to the competent court of the Rechtbank Midden-Nederland."],
    ],
    contact: "Questions about these terms? Email info@gtmai.nl.",
  },
};

export default async function AdvertisingTermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const c = COPY[locale === "en" ? "en" : "nl"];
  return (
    <Container className="py-12">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{c.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{c.updated}</p>
        <p className="mt-4 text-slate-700">{c.intro}</p>
        <div className="mt-6 space-y-4">
          {c.clauses.map(([h, p], i) => (
            <div key={i}>
              <h2 className="mb-0.5 font-bold text-slate-900">{h}</h2>
              <p className="leading-relaxed text-slate-700">{p}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">{c.contact}</p>
      </article>
    </Container>
  );
}
