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

type FavouriteBlog = {
  id: string;
  title: string;
  category: string;
};

export function PatientLiveOverview() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [favouriteBlogs, setFavouriteBlogs] = useState<FavouriteBlog[]>([]);
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

  useEffect(() => {
    if (!userId) {
      setFavouriteBlogs([]);
      return;
    }

    return subscribeUserCollection(
      `patients/${userId}/favoriteBlogs`,
      "",
      (doc, id) => ({
        id,
        title: String(doc.title || "Saved blog"),
        category: String(doc.category || "General")
      }),
      setFavouriteBlogs,
      false
    );
  }, [userId]);

  if (!resolvedAuth) {
    return (
      <div className="panel stack">
        <h3>Account overview</h3>
        <div className="patient-account-grid">
          <SkeletonRow count={2} />
          <SkeletonRow count={2} />
          <SkeletonRow count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h3>Account overview</h3>
      {email ? <p className="muted">Signed in as {email}</p> : <p className="muted">Sign in to load your live bookings from Firebase.</p>}
      <div className="patient-account-grid">
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
            <p className="muted">No live bookings found yet.</p>
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
            <p className="muted">No saved enquiries found yet.</p>
          )}
        </div>

        <div className="stack">
          <strong>Saved blogs</strong>
          {favouriteBlogs.length ? (
            <div className="stack">
              {favouriteBlogs.map((blog) => (
                <div className="list-card" key={blog.id}>
                  <strong>{blog.title}</strong>
                  <span>{blog.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No saved blogs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
