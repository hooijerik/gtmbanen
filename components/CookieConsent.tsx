"use client";
// Analytics consent. Google Analytics 4 is treated as essential (anonymous,
// privacy-friendly) and loads on every page — it fires before/independently of
// the banner. Microsoft Clarity is optional and loads ONLY after the visitor
// accepts. The choice is stored in a 1st-party cookie. The banner is a
// screen takeover so it can't be missed (incl. mobile).
import { useEffect, useState } from "react";
import Script from "next/script";

const COOKIE = "gtmb_consent";

function readConsent(): "granted" | "denied" | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)gtmb_consent=(granted|denied)/);
  return m ? (m[1] as "granted" | "denied") : null;
}

export function CookieConsent({
  gaId,
  clarityId,
  t,
  policyHref,
}: {
  gaId: string;
  clarityId: string;
  t: { title: string; message: string; accept: string; reject: string; policy: string };
  policyHref: string;
}) {
  // undefined = not yet read (SSR / pre-hydration).
  const [consent, setConsent] = useState<"granted" | "denied" | null | undefined>(undefined);
  useEffect(() => setConsent(readConsent()), []);

  // Lock background scroll while the takeover is open.
  useEffect(() => {
    if (consent !== null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [consent]);

  function choose(v: "granted" | "denied") {
    document.cookie = `${COOKIE}=${v}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
    setConsent(v);
  }

  return (
    <>
      {/* Google Analytics 4 — essential, loads on every page (before the banner). */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>

      {/* Microsoft Clarity — optional, loads only after consent. */}
      {consent === "granted" && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
        </Script>
      )}

      {/* Screen-takeover consent dialog — shown until a choice is made. */}
      {consent === null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 id="cookie-title" className="text-xl font-bold text-slate-900">
              {t.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t.message}{" "}
              <a href={policyHref} className="font-medium text-brand-700 underline hover:text-brand-800">
                {t.policy}
              </a>
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                onClick={() => choose("granted")}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {t.accept}
              </button>
              <button
                onClick={() => choose("denied")}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
