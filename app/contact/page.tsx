import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { founder } from "@/lib/site-data";

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
            <div className="contact-info-list">
              <div><strong>Location</strong><span>Glasgow home visits and online consultations across the UK</span></div>
              <div><strong>Email</strong><span><a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a></span></div>
              <div><strong>Prefer to talk?</strong><span>Leave your number in the form and we&apos;ll call you back.</span></div>
              <div><strong>Hours</strong><span>Mon-Fri: 8am-6pm<br />Sat: 9am-1pm</span></div>
              <div><strong>Your Physiotherapist</strong><span>{founder.name} &middot; {founder.credentials[0]}</span></div>
            </div>
          </div>
        </Reveal>

        <Reveal direction="right">
          <ContactForm />
        </Reveal>
      </section>
    </div>
  );
}
