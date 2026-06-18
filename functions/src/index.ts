import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

export const onSummaryPublished = onDocumentCreated(
  "sessionSummaries/{summaryId}",
  async (event) => {
    const summary = event.data?.data();
    if (!summary) return;

    const db = getFirestore();

    const bookingSnap = await db.doc(`bookings/${summary.bookingId}`).get();
    if (!bookingSnap.exists) return;
    const booking = bookingSnap.data()!;

    const userSnap = await db.doc(`users/${booking.bookedBy}`).get();
    if (!userSnap.exists) return;
    const fcmToken: string | undefined = userSnap.data()?.fcmToken;
    if (!fcmToken) return;

    const date = booking.sessionDate?.toDate
      ? (booking.sessionDate.toDate() as Date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "your session";

    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: "📋 Session summary ready",
        body: `${summary.patientName}'s ${booking.service ?? "session"} summary from ${date} is now available`,
      },
      data: {
        type: "summary",
        bookingId: summary.bookingId as string,
        summaryId: event.params.summaryId,
      },
      apns: { payload: { aps: { sound: "default" } } },
      android: { notification: { sound: "default" } },
    });

    await event.data!.ref.update({ notificationSent: FieldValue.serverTimestamp() });
  }
);
