import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { computeCheckinActions, type ExistingCheckin } from "./pain-checkin-logic";

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

// Sends a "complete your assessment" reminder (email + push) ~1h before a
// paid, upcoming session. Runs every 15 minutes and picks up bookings whose
// sessionDate falls 55-65 minutes from now, so each booking is caught by
// exactly one run under normal conditions.
//
// Required config (functions runtime env, e.g. via `firebase functions:config`
// or `wrangler`/`.env` equivalent for this project's deploy target):
//   SITE_URL     - e.g. "https://physioonclick.co.uk" (no trailing slash)
//   CRON_SECRET  - shared secret checked by app/api/assessment/reminder-email
//
// Manual emulator smoke check (no functions test harness exists in this repo
// as of writing):
//   1. `npm run emulators` from repo root.
//   2. Seed a `bookings` doc with status:"upcoming", paid:true, and
//      sessionDate set to Timestamp.fromDate(new Date(Date.now()+60*60000)).
//   3. Trigger the scheduled function locally, e.g.
//      `curl -X POST http://localhost:5001/<project>/europe-west2/sendAssessmentReminders`
//      (or use the Emulator UI's "Run now" on the scheduled function).
//   4. Confirm: a `patients/{bookedBy}/notifications` doc was created, the
//      booking doc now has `reminders.assessmentDueSent: true`, and (if
//      SITE_URL/CRON_SECRET are set and the Next.js dev server is reachable)
//      the reminder-email endpoint was called.
export const sendAssessmentReminders = onSchedule(
  { schedule: "*/15 * * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const SITE_URL = process.env.SITE_URL;
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!SITE_URL || !CRON_SECRET) {
      console.error(
        "sendAssessmentReminders: missing SITE_URL and/or CRON_SECRET env config; " +
          "email reminders will be skipped this run"
      );
    }

    const now = Date.now();
    const lo = new Date(now + 50 * 60000);
    const hi = new Date(now + 65 * 60000);

    const snap = await db
      .collection("bookings")
      .where("status", "==", "upcoming")
      .where("paid", "==", true)
      .where("sessionDate", ">=", lo)
      .where("sessionDate", "<=", hi)
      .get();

    for (const doc of snap.docs) {
      try {
        const booking = doc.data();

        if (booking.assessmentCompletedAt) continue;
        if (booking.reminders?.assessmentDueSent === true) continue;

        if (SITE_URL && CRON_SECRET) {
          try {
            await fetch(`${SITE_URL}/api/assessment/reminder-email`, {
              method: "POST",
              headers: {
                "x-cron-secret": CRON_SECRET,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ bookingId: doc.id }),
            });
          } catch (emailErr) {
            console.error(
              "sendAssessmentReminders: reminder-email fetch failed",
              doc.ref.path,
              emailErr
            );
          }
        }

        const bookedBy: string | undefined = booking.bookedBy;
        if (bookedBy) {
          try {
            await db
              .collection("patients")
              .doc(bookedBy)
              .collection("notifications")
              .add({
                title: "Assessment due",
                body: `Please complete your pre-session assessment for your ${
                  booking.service ?? "appointment"
                } coming up in about an hour.`,
                kind: "appointment",
                read: false,
                createdAt: FieldValue.serverTimestamp(),
              });

            const userSnap = await db.doc(`users/${bookedBy}`).get();
            const fcmToken: string | undefined = userSnap.data()?.fcmToken;
            if (fcmToken) {
              await getMessaging().send({
                token: fcmToken,
                notification: {
                  title: "📝 Assessment due",
                  body: "Complete your pre-session assessment before your appointment in ~1h",
                },
                data: {
                  type: "assessment_due",
                  bookingId: doc.id,
                },
                apns: { payload: { aps: { sound: "default" } } },
                android: { notification: { sound: "default" } },
              });
            }
          } catch (pushErr) {
            console.error(
              "sendAssessmentReminders: FCM/notification write failed",
              doc.ref.path,
              pushErr
            );
          }
        }

        // Mark as sent even if email/push attempts above failed, so we don't
        // spam retries every 15 minutes for the same booking.
        await doc.ref.update({ "reminders.assessmentDueSent": true });
      } catch (err) {
        console.error("sendAssessmentReminders: failed to process doc", doc.ref.path, err);
      }
    }
  }
);

// Doctor-interval pain check-ins: a low-pressure, FCM-only nudge (no email —
// this is an engagement nicety, not a clinical gate; the doctor follows up on
// pain trends in person after the streak completes). Runs daily, mirrors the
// streak day count against each patient's doctor-set interval, and applies
// whatever computeCheckinActions decides (create/expire/bumpRun). See
// functions/src/pain-checkin-logic.ts for the pure decision rules and its
// manual verification steps.
//
// Manual emulator smoke check (same pattern as sendAssessmentReminders above):
//   1. `npm run emulators` from repo root.
//   2. Seed patients/{uid}/people/{personId}/goals/current with
//      { streakTarget: 18, painCheckinInterval: 3, currentRun: 0 }.
//   3. Seed exerciseLogs docs for 3 consecutive days ending today so the live
//      streak equals 3 (see computeStreakDays in lib/recovery.ts for the
//      exact date-key scheme this must match).
//   4. Trigger the scheduled function via the Emulator UI's "Run now", or:
//      `curl -X POST http://localhost:5001/<project>/europe-west2/sendPainCheckinReminders`
//   5. Confirm a `painCheckins/0_3` doc was created with status "pending",
//      and (if a fake fcmToken is set on users/{uid}) an FCM send was
//      attempted in the emulator logs.
export const sendPainCheckinReminders = onSchedule(
  { schedule: "0 9 * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const dateKeyDaysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return fmt(d);
    };

    // Only patients with the feature enabled at all (painCheckinInterval > 1
    // covers every valid interval, since 1 and the target itself are rejected
    // at write time).
    const goalsSnap = await db.collectionGroup("goals").where("painCheckinInterval", ">", 1).get();

    for (const goalDoc of goalsSnap.docs) {
      try {
        const goal = goalDoc.data();
        const interval = goal.painCheckinInterval as number;
        const currentRun = typeof goal.currentRun === "number" ? goal.currentRun : 0;

        const personRef = goalDoc.ref.parent.parent;
        const patientRef = personRef?.parent.parent;
        if (!personRef || !patientRef) continue;
        const personId = personRef.id;
        const patientUid = patientRef.id;

        // Live streak: consecutive days (counting back from today, allowing
        // today itself to be un-logged) with at least one exercise completion.
        // Mirrors computeStreakDays in lib/recovery.ts exactly.
        const exerciseLogsSnap = await personRef.collection("exerciseLogs").get();
        const completedDates = new Set<string>();
        exerciseLogsSnap.forEach((d) => {
          const completions = d.data().completions as Record<string, boolean> | undefined;
          if (completions && Object.values(completions).some(Boolean)) completedDates.add(d.id);
        });
        let streak = 0;
        const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
        for (let i = startOffset; i < 400; i += 1) {
          if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
          else break;
        }

        const checkinsSnap = await personRef.collection("painCheckins").get();
        const existingForRun: ExistingCheckin[] = checkinsSnap.docs
          .filter((d) => d.data().runNumber === currentRun)
          .map((d) => ({ streakDay: d.data().streakDay as number, status: d.data().status as ExistingCheckin["status"] }));

        const actions = computeCheckinActions(streak, interval, currentRun, existingForRun);
        if (actions.length === 0) continue;

        let fcmToken: string | undefined;
        let createdStreakDay: number | null = null;

        for (const action of actions) {
          if (action.type === "expire") {
            await personRef
              .collection("painCheckins")
              .doc(`${currentRun}_${action.streakDay}`)
              .set({ status: "missed" }, { merge: true });
          } else if (action.type === "bumpRun") {
            await goalDoc.ref.set({ currentRun: FieldValue.increment(1) }, { merge: true });
          } else if (action.type === "create") {
            await personRef
              .collection("painCheckins")
              .doc(`${action.runNumber}_${action.streakDay}`)
              .set({
                runNumber: action.runNumber,
                streakDay: action.streakDay,
                status: "pending",
                createdAt: FieldValue.serverTimestamp(),
              });
            createdStreakDay = action.streakDay;
          }
        }

        if (createdStreakDay !== null) {
          try {
            const userSnap = await db.doc(`users/${patientUid}`).get();
            fcmToken = userSnap.data()?.fcmToken;
            if (fcmToken) {
              await getMessaging().send({
                token: fcmToken,
                notification: {
                  title: "A quick, optional check-in",
                  body: `Day ${createdStreakDay} — want to log how your pain feels today?`,
                },
                data: {
                  type: "pain-checkin-reminder",
                  personId,
                  streakDay: String(createdStreakDay),
                },
                apns: { payload: { aps: { sound: "default" } } },
                android: { notification: { sound: "default" } },
              });
            }
          } catch (fcmErr) {
            console.error("sendPainCheckinReminders: FCM send failed", goalDoc.ref.path, fcmErr);
          }
        }
      } catch (err) {
        console.error("sendPainCheckinReminders: failed to process doc", goalDoc.ref.path, err);
      }
    }
  }
);
