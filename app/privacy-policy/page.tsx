import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PhysioOnClick",
  description: "How PhysioOnClick collects, stores and uses your personal and clinical data in line with UK GDPR."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="site-shell">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Privacy policy</span>
          <h1>GDPR-conscious handling of patient and website data.</h1>
        </div>
        <div className="page-hero-aside">
          <strong>Last updated</strong>
          <p className="muted">June 2026</p>
        </div>
      </section>

      <section className="page-section two-col">

        <article className="panel stack soft-panel">
          <h2>Who we are</h2>
          <p>
            PhysioOnClick is operated by Shivaliba Zala (trading as PhysioOnClick), the data controller for
            all personal data collected through this website and associated services. Contact:{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack">
          <h2>What data we collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li><strong>Contact details:</strong> name, email address, phone number</li>
            <li><strong>Appointment data:</strong> preferred dates, times, and service type</li>
            <li><strong>Clinical information:</strong> condition notes, session records, progress data, and exercise assignments entered through the patient portal</li>
            <li><strong>Payment:</strong> payment is taken at the time of your appointment, not online, so we do not collect or store online payment data</li>
            <li><strong>Usage data:</strong> pages visited and session activity, collected anonymously via analytics</li>
          </ul>
        </article>

        <article className="panel stack soft-panel">
          <h2>Lawful basis for processing</h2>
          <ul>
            <li><strong>Contract performance:</strong> processing your name, email, and appointment details to deliver the service you have booked</li>
            <li><strong>Legal obligation:</strong> retaining clinical records for the period required by HCPC standards</li>
            <li><strong>Legitimate interests:</strong> maintaining secure systems, communicating about your care, and improving the service</li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>Third-party processors</h2>
          <p>Your data is processed by the following third parties on our behalf:</p>
          <ul>
            <li><strong>Google Firebase</strong> (Authentication, Firestore database, Storage) — used to store account, appointment, and clinical data securely</li>
            <li><strong>Cal.com</strong> — used for appointment scheduling; booking data is shared with Cal.com to manage your calendar appointment</li>
            <li><strong>Google Calendar / Google Meet</strong> — used to create appointment events and video consultation links; attendee details (name, email) are shared with Google to generate the meeting link</li>
          </ul>
        </article>

        <article className="panel stack soft-panel">
          <h2>Data retention</h2>
          <ul>
            <li><strong>Clinical records:</strong> retained for 8 years from the date of last contact, in line with HCPC record-keeping standards</li>
            <li><strong>Appointment and contact enquiries:</strong> retained for 12 months after the last interaction</li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>Your rights</h2>
          <p>Under UK GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Rectification</strong> of inaccurate data</li>
            <li><strong>Erasure</strong> of your data where there is no legal obligation to retain it</li>
            <li><strong>Restriction</strong> of processing in certain circumstances</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> to processing based on legitimate interests</li>
          </ul>
          <p>To exercise any of these rights, email{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Cookies</h2>
          <p>
            This website uses session cookies for authentication only. We do not use advertising,
            tracking, or third-party marketing cookies. Anonymous usage analytics may be collected
            to help us improve the service.
          </p>
        </article>

        <article className="panel stack">
          <h2>Complaints</h2>
          <p>
            If you have concerns about how we handle your data, you have the right to complain to the
            Information Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
          </p>
        </article>

      </section>
    </div>
  );
}
