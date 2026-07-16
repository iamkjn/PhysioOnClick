import Script from "next/script";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

// Google Consent Mode v2. Default everything to "denied" BEFORE gtag.js loads,
// so Analytics sets no cookies until the visitor accepts via the cookie banner
// (see components/cookie-consent.tsx). This is what makes GA lawful under UK
// PECR — non-essential cookies must not be set without prior consent.
export function Analytics() {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          try {
            if (localStorage.getItem('poc-cookie-consent') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="gtag-config" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
