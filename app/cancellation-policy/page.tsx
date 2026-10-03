import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/cancellation-policy" },
  title: "Cancellation & Refund Policy | PhysioOnClick",
  description: "How to cancel or rearrange a PhysioOnClick appointment, when you get a full refund, package refunds, and your 14-day right to cancel."
};

export default function CancellationPolicyPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Cancellation &amp; refund policy</span>
          <h1>Clear, fair cancellation and refund terms.</h1>
        </div>
        <div className="page-hero-aside">
          <strong>Last updated</strong>
          <p className="muted">
            <time dateTime="2026-10">October 2026</time>
          </p>
        </div>
      </section>
      </Reveal>
      <section className="page-section two-col">
        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>How to cancel or rearrange</h2>
          <p>
            Use the cancel or reschedule link in your booking confirmation email, or email{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a> with your name and
            appointment time. We will confirm by email.
          </p>
        </article>
        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>24 hours&apos; notice or more: full refund</h2>
          <p>
            If you cancel at least 24 hours before your appointment, you can choose a full refund or move to
            another time at no cost.
          </p>
        </article>
        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Less than 24 hours&apos; notice or missed appointments</h2>
          <p>
            Cancellations made with less than 24 hours&apos; notice, and appointments that are missed, are not
            normally refunded because the time has been reserved for you. If something genuinely unavoidable
            happens, such as sudden illness or an emergency, please tell us and we will always consider
            rearranging.
          </p>
        </article>
        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>If we cancel or something goes wrong on our side</h2>
          <p>
            If we need to cancel, a technical problem on our side stops the session going ahead, or we cannot
            confirm the time you paid for, you will get a full refund or a new appointment, whichever you
            prefer.
          </p>
        </article>
        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Home visits</h2>
          <p>
            If we decline or cannot attend a home visit because your address is outside the area we cover or
            we have a safety concern at the address, you will get a full refund or a new appointment,
            whichever you prefer. The notice rules above apply to your own cancellations.
          </p>
        </article>
        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Session packages</h2>
          <p>
            Each session in a package follows the same 24-hour notice rule. If you decide to stop a package,
            we will refund the sessions you have not used, worked out as the package price divided by the
            number of sessions, multiplied by the sessions remaining. Package sessions are valid for 12 months
            from the date of purchase.
          </p>
        </article>
        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Your 14-day right to cancel</h2>
          <p>
            Because you book online, the Consumer Contracts Regulations 2013 give you the right to cancel within
            14 days of booking for a full refund. If you ask for your appointment to take place within those 14
            days and it goes ahead, you cannot cancel that appointment afterwards, and for a package you pay only
            for the sessions already used. This right is in addition to the 24-hour rule above.
          </p>
        </article>
        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>How refunds are paid</h2>
          <p>
            Refunds go back to the card you paid with, through Stripe, within 14 days of us agreeing the
            cancellation. Your bank usually shows the money within 5 to 10 working days after that.
          </p>
        </article>
      </section>
    </div>
  );
}
