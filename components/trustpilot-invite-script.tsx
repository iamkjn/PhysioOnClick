import Script from "next/script";

// Trustpilot Invitations JavaScript. Loading it exposes window.tp so
// components/trustpilot-invitations.tsx can call tp("createInvitation", …)
// after a completed session. Gated on the public integration key — nothing
// loads until NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY is set on the build.
const inviteKey = process.env.NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY;

export function TrustpilotInviteScript() {
  if (!inviteKey) return null;
  return (
    <Script id="trustpilot-invite" strategy="afterInteractive">
      {`(function(w,d,s,r,n){w.TrustpilotObject=n;w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
        var a=d.createElement(s);a.async=1;a.src=r;a.type='text/java'+s;var f=d.getElementsByTagName(s)[0];
        f.parentNode.insertBefore(a,f)})(window,document,'script','https://invitejs.trustpilot.com/tp.min.js','tp');
        tp('register','${inviteKey}');`}
    </Script>
  );
}
