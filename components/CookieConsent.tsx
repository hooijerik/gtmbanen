"use client";
// Consent-gated analytics: GA4 + Microsoft Clarity load ONLY after the visitor accepts.
// Choice is stored in a 1st-party cookie; no analytics fire until consent === "granted".
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
  t: { message: string; accept: string; reject: string; policy: string };
  policyHref: string;
}) {
  // undefined = not yet read (SSR / pre-hydration): render nothing.
  const [consent, setConsent] = useState<"granted" | "denied" | null | undefined>(undefined);
  useEffect(() => setConsent(readConsent()), []);

  function choose(v: "granted" | "denied") {
    document.cookie = `${COOKIE}=${v}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
    setConsent(v);
  }

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        </>
      )}

      {consent === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {t.message}{" "}
              <a href={policyHref} className="font-medium text-brand-700 underline hover:text-brand-800">
                {t.policy}
              </a>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => choose("denied")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t.reject}
              </button>
              <button
                onClick={() => choose("granted")}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
