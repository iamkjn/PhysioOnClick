import { ContactForm } from "@/components/contact-form";

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
        <div className="contact-info-column">
          <h2>Contact Information</h2>
          <div className="contact-info-list">
            <div><strong>Location</strong><span>Glasgow home visits and online consultations across the UK</span></div>
            <div><strong>Email</strong><span>hello@physioonclick.co.uk</span></div>
            <div><strong>Phone</strong><span>Contact via form</span></div>
            <div><strong>Hours</strong><span>Mon-Fri: 8am-6pm<br />Sat: 9am-1pm</span></div>
          </div>
          <div className="contact-map-card">
            <iframe title="Glasgow map" src="https://www.google.com/maps?q=Glasgow%20UK&output=embed" loading="lazy" />
          </div>
        </div>

        <ContactForm />
      </section>
    </div>
  );
}
