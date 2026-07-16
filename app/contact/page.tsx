import type { Metadata } from "next";
import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { founder } from "@/lib/site-data";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
};

export const metadata: Metadata = {
  title: "Contact | PhysioOnClick",
  description: "Get in touch with PhysioOnClick to book an appointment, ask a question or enquire about our online physiotherapy services across the UK today."
};

export default function ContactPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Get in <span>Touch</span>
        </h1>
        <p>Book an appointment, ask a question or enquire about our services.</p>
      </section>

      <section className="page-section contact-layout">
        <Reveal direction="left">
          <div className="contact-info-column">
            <h2>Contact Information</h2>
            <ul className="contact-info-list">
              <li>
                <span className="contact-info-icon">
                  <svg {...iconProps}><path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                </span>
                <div>
                  <strong>Location</strong>
                  <span>Online consultations across the UK</span>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">
                  <svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                </span>
                <div>
                  <strong>Email</strong>
                  <a className="contact-info-link" href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">
                  <svg {...iconProps}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l2 5v1a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2Z" /></svg>
                </span>
                <div>
                  <strong>Callback</strong>
                  <span>Leave your number in the form and we&apos;ll call you back.</span>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">
                  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
                </span>
                <div>
                  <strong>Hours</strong>
                  <span>Mon-Fri: 8am-6pm<br />Sat: 9am-1pm</span>
                </div>
              </li>
            </ul>

            <div className="contact-physio">
              <Avatar name={founder.name} size={52} color="var(--color-primary-dark)" />
              <div>
                <span className="contact-physio-label">Your Physiotherapist</span>
                <strong>{founder.name}</strong>
                <span>{founder.credentials[0]}</span>
              </div>
            </div>

            <Link className="button primary full-width contact-cta" href="/book">
              Book an appointment
            </Link>
          </div>
        </Reveal>

        <Reveal direction="right">
          <ContactForm />
        </Reveal>
      </section>
    </div>
  );
}
