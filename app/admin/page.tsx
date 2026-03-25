import type { Metadata } from "next";

import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminLiveStats } from "@/components/admin-live-stats";
import { AdminEnquiriesTable } from "@/components/admin-enquiries-table";
import { AuthPanel } from "@/components/auth-panel";
import { blogArticles } from "@/lib/blog";
import { pricing, testimonials } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard | PhysioOnClick",
  description: "Admin dashboard for blogs, bookings, patients, rehab programmes and revenue analytics."
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="site-shell">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Admin dashboard</span>
          <h1>Manage bookings, content, rehab plans and revenue from one place.</h1>
          <p className="lead">
            The admin area is prepared for Firebase Authentication, Firestore-backed operations and Stripe-supported
            payment workflows including refunds and booking management.
          </p>
        </div>
        <div className="page-hero-aside dashboard-preview">
          <div className="dashboard-chip">Admin focus</div>
          <strong>Content, bookings and patient operations</strong>
          <p className="muted">Built for clear oversight without clutter.</p>
          <div className="progress-pill-row">
            <span>Blogs</span>
            <span>Bookings</span>
            <span>Revenue</span>
          </div>
        </div>
      </section>

      <section className="page-section dashboard-grid">
        <AuthPanel role="admin" />
        <div className="panel stack checklist-panel">
          <h3>Admin capabilities</h3>
          <ul className="clean-list">
            <li>Manage 100+ blog posts with add, edit, delete and scheduling workflows</li>
            <li>Review bookings, patient records and uploaded documents</li>
            <li>Assign rehab programmes and exercise videos</li>
            <li>Manage testimonials and revenue analytics</li>
            <li>Process Stripe refunds and monitor package sales</li>
          </ul>
        </div>
      </section>

      <section className="page-section card-grid">
        <AdminLiveStats />
        <article className="card stack info-card">
          <span className="eyebrow">Blogs</span>
          <strong style={{ fontSize: "2rem" }}>{blogArticles.length}</strong>
          <p className="muted">Ready-to-publish SEO articles with category coverage and generated routes.</p>
        </article>
        <article className="card stack info-card">
          <span className="eyebrow">Pricing products</span>
          <strong style={{ fontSize: "2rem" }}>{pricing.length}</strong>
          <p className="muted">Service and package products prepared for Stripe checkout mapping.</p>
        </article>
        <article className="card stack info-card">
          <span className="eyebrow">Testimonials</span>
          <strong style={{ fontSize: "2rem" }}>{testimonials.length}</strong>
          <p className="muted">Database-ready testimonial blocks for the homepage and local landing pages.</p>
        </article>
        <article className="card stack info-card">
          <span className="eyebrow">Projected bundle revenue</span>
          <strong style={{ fontSize: "2rem" }}>{formatCurrency(520)}</strong>
          <p className="muted">Sample analytics card representing package and assessment sales.</p>
        </article>
      </section>

      <AdminEnquiriesTable />
      <AdminBookingsTable />
    </div>
  );
}
