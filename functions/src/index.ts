import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
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

export const onFollowUpCreated = onDocumentCreated(
  "patients/{userId}/followUps/{followUpId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const db = getFirestore();

    const userSnap = await db.doc(`users/${event.params.userId}`).get();
    if (!userSnap.exists) return;
    const fcmToken: string | undefined = userSnap.data()?.fcmToken;
    if (!fcmToken) return;

    const parsedDate = data.dueDate ? new Date(data.dueDate) : null;
    const prettyDate =
      parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "soon";

    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: "📅 Follow-up scheduled",
        body: `Your physio scheduled a follow-up for ${prettyDate}`,
      },
      data: {
        type: "followup",
        followUpId: event.params.followUpId,
        dueDate: String(data.dueDate ?? ""),
      },
      apns: { payload: { aps: { sound: "default" } } },
      android: { notification: { sound: "default" } },
    });

    await event.data!.ref.update({ notificationSent: FieldValue.serverTimestamp() });
  }
);

export const sendFollowUpReminders = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const now = new Date();
    const todayStr = fmt(now);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = fmt(tomorrow);

    const snap = await db
      .collectionGroup("followUps")
      .where("dueDate", "in", [todayStr, tomorrowStr])
      .get();

    for (const doc of snap.docs) {
      try {
        const data = doc.data();
        const patientUid = doc.ref.parent.parent?.id;
        if (!patientUid) continue;

        const isToday = data.dueDate === todayStr;
        const flag = isToday ? "dayOf" : "dayBefore";
        if (data.reminders?.[flag]) continue;

        const parts = typeof data.dueDate === "string" ? data.dueDate.split("-") : [];
        let pretty = String(data.dueDate ?? "");
        if (parts.length === 3) {
          const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (!isNaN(parsed.getTime())) {
            pretty = parsed.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }
        }

        await db
          .collection("patients")
          .doc(patientUid)
          .collection("notifications")
          .add({
            title: isToday ? "Follow-up today" : "Follow-up tomorrow",
            body: `Reminder: your physiotherapy follow-up is ${
              isToday ? "today" : "tomorrow"
            } (${pretty}).${data.note ? " " + data.note : ""}`,
            kind: "appointment",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });

        try {
          const userSnap = await db.doc(`users/${patientUid}`).get();
          const fcmToken: string | undefined = userSnap.data()?.fcmToken;
          if (fcmToken) {
            await getMessaging().send({
              token: fcmToken,
              notification: {
                title: isToday ? "📅 Follow-up today" : "📅 Follow-up tomorrow",
                body: `Your follow-up is ${isToday ? "today" : "tomorrow"} (${pretty})`,
              },
              data: {
                type: "followup-reminder",
                dueDate: String(data.dueDate),
              },
              apns: { payload: { aps: { sound: "default" } } },
              android: { notification: { sound: "default" } },
            });
          }
        } catch (fcmErr) {
          console.error("sendFollowUpReminders: FCM send failed", doc.ref.path, fcmErr);
        }

        await doc.ref.set(
          { reminders: { [flag]: FieldValue.serverTimestamp() } },
          { merge: true }
        );
      } catch (err) {
        console.error("sendFollowUpReminders: failed to process doc", doc.ref.path, err);
      }
    }
  }
);
