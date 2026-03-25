"use client";

import { useEffect, useState } from "react";

import { subscribeCollectionCount } from "@/lib/firestore-helpers";

export function AdminLiveStats() {
  const [counts, setCounts] = useState({
    blogs: 0,
    bookings: 0,
    enquiries: 0
  });

  useEffect(() => {
    const unsubBlogs = subscribeCollectionCount("blogs", (count) => setCounts((current) => ({ ...current, blogs: count })));
    const unsubBookings = subscribeCollectionCount("bookings", (count) =>
      setCounts((current) => ({ ...current, bookings: count }))
    );
    const unsubEnquiries = subscribeCollectionCount("enquiries", (count) =>
      setCounts((current) => ({ ...current, enquiries: count }))
    );

    return () => {
      unsubBlogs();
      unsubBookings();
      unsubEnquiries();
    };
  }, []);

  return (
    <>
      <article className="card stack info-card">
        <span className="eyebrow">Live blogs</span>
        <strong style={{ fontSize: "2rem" }}>{counts.blogs}</strong>
        <p className="muted">Live Firestore count from the `blogs` collection.</p>
      </article>
      <article className="card stack info-card">
        <span className="eyebrow">Live bookings</span>
        <strong style={{ fontSize: "2rem" }}>{counts.bookings}</strong>
        <p className="muted">Live Firestore count from the `bookings` collection.</p>
      </article>
      <article className="card stack info-card">
        <span className="eyebrow">Live enquiries</span>
        <strong style={{ fontSize: "2rem" }}>{counts.enquiries}</strong>
        <p className="muted">Live Firestore count from the `enquiries` collection.</p>
      </article>
    </>
  );
}
