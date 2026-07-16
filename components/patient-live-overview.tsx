"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { subscribeUserCollection } from "@/lib/firestore-helpers";
import { SkeletonRow } from "@/components/skeleton";

type Booking = {
  id: string;
  service: string;
  email: string;
  appointmentLabel: string;
  status: string;
};

type Enquiry = {
  id: string;
  service: string;
  email: string;
  message: string;
};

export function PatientLiveOverview() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [userId, setUserId] = useState("");
  const [resolvedAuth, setResolvedAuth] = useState(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setEmail(user?.email || "");
      setUserId(user?.uid || "");
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!email && !userId) {
      setBookings([]);
      setEnquiries([]);
      return;
    }

    return subscribeUserCollection(
      "bookings",
      userId || email,
      (doc, id) => ({
        id,
        service: String(doc.service || "Assessment"),
        email: String(doc.email || email),
        appointmentLabel: String(doc.appointmentLabel || "Awaiting confirmation"),
        status: String(doc.status || "pending")
      }),
      setBookings,
      userId ? "bookedBy" : "email"
    );
  }, [email, userId]);

  useEffect(() => {
    if (!email) {
      setEnquiries([]);
      return;
    }

    return subscribeUserCollection(
      "enquiries",
      email,
      (doc, id) => ({
        id,
        service: String(doc.service || "General enquiry"),
        email: String(doc.email || email),
        message: String(doc.message || "")
      }),
      setEnquiries,
      "email"
    );
  }, [email, userId]);

  const accountGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.25rem"
  };

  if (!resolvedAuth) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)" }}>Account overview</h2>
        <div className="patient-account-grid" style={accountGridStyle}>
          <SkeletonRow count={2} />
          <SkeletonRow count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)" }}>Account overview</h2>
      {email ? <p className="muted">Signed in as {email}</p> : <p className="muted">Sign in to see your bookings and enquiries.</p>}
      <div className="patient-account-grid" style={accountGridStyle}>
        <div className="stack">
          <strong>Bookings</strong>
          {bookings.length ? (
            <div className="stack">
              {bookings.map((booking) => (
                <div className="list-card" key={booking.id}>
                  <strong>{booking.service}</strong>
                  <span>{booking.appointmentLabel}</span>
                  <span>Status: {booking.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No bookings yet. Once you book an appointment, it will show up here.</p>
          )}
        </div>

        <div className="stack">
          <strong>Enquiries</strong>
          {enquiries.length ? (
            <div className="stack">
              {enquiries.map((enquiry) => (
                <div className="list-card" key={enquiry.id}>
                  <strong>{enquiry.service}</strong>
                  <span>{enquiry.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No enquiries yet. Messages you send us will show up here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
