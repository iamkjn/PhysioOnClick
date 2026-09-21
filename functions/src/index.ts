import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, FieldPath } from "firebase-admin/firestore";
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

    // 1. FCM push — best-effort and guarded by a token check, so a patient
    //    with no registered device no longer aborts the plan-email step below.
    try {
      const userSnap = await db.doc(`users/${booking.bookedBy}`).get();
      const fcmToken: string | undefined = userSnap.data()?.fcmToken;
      if (fcmToken) {
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

        await event.data!.ref.update({
          notificationSent: FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("onSummaryPublished: push failed", err);
    }

    // 2. Exercise-plan handout: fire the cron-guarded generate route, which
    //    builds the illustrated PDF, stores it, emails it and stamps
    //    `planEmailedAt` (best-effort, idempotent on its own side).
    try {
      const SITE_URL = process.env.SITE_URL;
      const CRON_SECRET = process.env.CRON_SECRET;
      if (SITE_URL && CRON_SECRET) {
        await fetch(`${SITE_URL}/api/exercise-plan/generate`, {
          method: "POST",
          headers: { "x-cron-secret": CRON_SECRET, "content-type": "application/json" },
          body: JSON.stringify({ summaryId: event.params.summaryId }),
        });
      } else {
        console.error(
          "onSummaryPublished: missing SITE_URL and/or CRON_SECRET env config; " +
            "exercise-plan email will be skipped"
        );
      }
    } catch (err) {
      console.error("onSummaryPublished: plan generate failed", err);
    }
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

// NOTE: the pre-session "complete your assessment" reminder function
// (sendAssessmentReminders) was removed 2026-09-13 — the self-assessment is
// now collected in the booking flow BEFORE payment (see
// components/booking-step-time.tsx and app/api/payments/webhook/route.ts),
// so a patient can no longer reach a paid, upcoming booking without one.

// Daily monitoring nudge for the gap between "follow-up scheduled" and the
// follow-up's dueDate (see components/admin-follow-up.tsx / scheduleFollowUp
// in app/admin/actions.ts, which write patients/{userId}/followUps/{id} with
// a plain "YYYY-MM-DD" dueDate). sendFollowUpReminders above already covers
// the day-before/day-of reminders off the same dueDate field, so this only
// fires for followUps whose dueDate is more than a day out, to avoid a
// duplicate notification on those two days. Runs once/day; a followUp doc
// only ever gets one send per calendar day via lastDailyReminderDate.
export const sendDailyMonitoringReminders = onSchedule(
  { schedule: "30 9 * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const now = new Date();
    const todayStr = fmt(now);
    const tomorrowStr = fmt(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    const snap = await db
      .collectionGroup("followUps")
      .where("dueDate", ">", tomorrowStr)
      .get();

    for (const doc of snap.docs) {
      try {
        const data = doc.data();
        if (data.lastDailyReminderDate === todayStr) continue;

        const patientUid = doc.ref.parent.parent?.id;
        if (!patientUid) continue;

        const parts = typeof data.dueDate === "string" ? data.dueDate.split("-") : [];
        let pretty = String(data.dueDate ?? "");
        let daysLeft: number | null = null;
        if (parts.length === 3) {
          const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (!isNaN(due.getTime())) {
            pretty = due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            daysLeft = Math.round((due.getTime() - new Date(`${todayStr}T00:00:00`).getTime()) / 86_400_000);
          }
        }
        const daysLeftLabel = daysLeft && daysLeft > 0 ? `${daysLeft} days` : "a few days";

        await db
          .collection("patients")
          .doc(patientUid)
          .collection("notifications")
          .add({
            title: "Recovery check-in",
            body: `${daysLeftLabel} until your follow-up (${pretty}). How's it going?${
              data.note ? " " + data.note : ""
            }`,
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
                title: "📋 Recovery check-in",
                body: `${daysLeftLabel} until your follow-up (${pretty}). How's it going?`,
              },
              data: {
                type: "daily-monitoring-reminder",
                followUpId: doc.id,
                dueDate: String(data.dueDate),
              },
              apns: { payload: { aps: { sound: "default" } } },
              android: { notification: { sound: "default" } },
            });
          }
        } catch (fcmErr) {
          console.error("sendDailyMonitoringReminders: FCM send failed", doc.ref.path, fcmErr);
        }

        await doc.ref.set({ lastDailyReminderDate: todayStr }, { merge: true });
      } catch (err) {
        console.error("sendDailyMonitoringReminders: failed to process doc", doc.ref.path, err);
      }
    }
  }
);

// Post-session review request: runs hourly and looks a day back, since
// (unlike the pre-appointment reminders above) there's no useful narrower
// window — sessionDate is only stamped once, and any run that lands 23-25h
// after it is equally "the day after" from the patient's perspective.
// Despite the function name, this is the Trustpilot invite pipeline (see
// app/api/reviews/request-email/route.ts and project_trustpilot_reviews) —
// not Google-review-specific and not gated on GBP verification.
export const sendReviewRequests = onSchedule(
  { schedule: "0 * * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const SITE_URL = process.env.SITE_URL;
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!SITE_URL || !CRON_SECRET) {
      console.error(
        "sendReviewRequests: missing SITE_URL and/or CRON_SECRET env config; skipping this run"
      );
      return;
    }

    const now = Date.now();
    const lo = new Date(now - 25 * 60 * 60000);
    const hi = new Date(now - 23 * 60 * 60000);

    // Every session — free or paid — gets a review request ~24h after.
    const snap = await db
      .collection("bookings")
      .where("sessionDate", ">=", lo)
      .where("sessionDate", "<=", hi)
      .get();

    for (const doc of snap.docs) {
      try {
        const booking = doc.data();

        if (booking.status === "cancelled") continue;
        if (booking.reminders?.reviewRequestSent === true) continue;

        try {
          await fetch(`${SITE_URL}/api/reviews/request-email`, {
            method: "POST",
            headers: {
              "x-cron-secret": CRON_SECRET,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ bookingId: doc.id }),
          });
        } catch (emailErr) {
          console.error("sendReviewRequests: request-email fetch failed", doc.ref.path, emailErr);
        }

        // Mark as sent even if the email attempt above failed, so we don't
        // retry every hour for the same booking.
        await doc.ref.update({ "reminders.reviewRequestSent": true });
      } catch (err) {
        console.error("sendReviewRequests: failed to process doc", doc.ref.path, err);
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
        const lastStreak = typeof goal.lastStreak === "number" ? goal.lastStreak : 0;

        const personRef = goalDoc.ref.parent.parent;
        const patientRef = personRef?.parent.parent;
        if (!personRef || !patientRef) continue;
        const personId = personRef.id;
        const patientUid = patientRef.id;

        // Live streak: consecutive days (counting back from today, allowing
        // today itself to be un-logged) with at least one exercise completion.
        // Mirrors computeStreakDays in lib/recovery.ts exactly.
        // Bound to the most recent 60 days, same window as getExerciseLogs in
        // lib/recovery.ts. A >= cutoff filter on the document ID, ascending, is
        // a genuine query-level bound (Firestore only returns matching docs) —
        // NOT limitToLast/orderBy(...).desc(), which the Firestore emulator
        // rejects as "does not support descending key scans" (confirmed
        // against a running emulator; also why recentByDateKey in
        // lib/recovery.ts reads ascending and slices in memory instead).
        // Ascending + a documentId() lower bound has no such restriction.
        const exerciseLogsSnap = await personRef
          .collection("exerciseLogs")
          .where(FieldPath.documentId(), ">=", dateKeyDaysAgo(59))
          .orderBy(FieldPath.documentId())
          .get();
        const completedDates = new Set<string>();
        exerciseLogsSnap.docs.forEach((d) => {
          const completions = d.data().completions as Record<string, boolean> | undefined;
          if (completions && Object.values(completions).some(Boolean)) completedDates.add(d.id);
        });
        let streak = 0;
        const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
        for (let i = startOffset; i < 400; i += 1) {
          if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
          else break;
        }

        // Bounded to the current run — that's genuinely all this function
        // needs to look at (unlike exerciseLogs, which needs a fixed window).
        const checkinsSnap = await personRef
          .collection("painCheckins")
          .where("runNumber", "==", currentRun)
          .get();
        const existingForRun: ExistingCheckin[] = checkinsSnap.docs.map((d) => ({
          streakDay: d.data().streakDay as number,
          status: d.data().status as ExistingCheckin["status"],
        }));

        const actions = computeCheckinActions(streak, interval, currentRun, existingForRun, lastStreak);

        // Always persist the newly observed streak so the next day's run has
        // an accurate lastStreak, regardless of whether any other action fired.
        await goalDoc.ref.set({ lastStreak: streak }, { merge: true });

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

// Admin "upcoming session" alerts (components/admin-notification-bell.tsx):
// runs every 5 minutes and flags any booking whose appointment starts in the
// next 5-15 minutes, writing an in-app adminNotifications doc and (if the
// single admin account has registered a token — see lib/admin-notifications.ts)
// pushing FCM. Idempotency mirrors sendDailyMonitoringReminders/
// sendPainCheckinReminders above: stamp `adminNotifiedAt` on the booking once
// notified so a later run in the same 5-15 minute window doesn't re-fire.
export const notifyAdminUpcomingSessions = onSchedule(
  { schedule: "every 5 minutes" },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const windowStart = new Date(now + 5 * 60_000);
    const windowEnd = new Date(now + 15 * 60_000);

    const snap = await db
      .collection("bookings")
      .where("status", "==", "upcoming")
      .where("sessionDate", ">=", windowStart)
      .where("sessionDate", "<=", windowEnd)
      .get();

    for (const bookingDoc of snap.docs) {
      try {
        const booking = bookingDoc.data();
        if (booking.adminNotifiedAt) continue;

        await db.collection("adminNotifications").add({
          bookingId: bookingDoc.id,
          patientName: booking.patientName ?? "Patient",
          personId: booking.patientId ?? "",
          sessionDate: booking.sessionDate,
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        });

        try {
          const configSnap = await db.doc("admin/config").get();
          const fcmToken: string | undefined = configSnap.data()?.fcmToken;
          if (fcmToken) {
            const time = booking.sessionDate?.toDate
              ? (booking.sessionDate.toDate() as Date).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/London",
                })
              : "shortly";
            await getMessaging().send({
              token: fcmToken,
              notification: {
                title: "Upcoming session",
                body: `${booking.patientName ?? "A patient"}'s ${booking.service ?? "session"} starts at ${time}`,
              },
              data: {
                type: "admin-upcoming-session",
                bookingId: bookingDoc.id,
              },
            });
          }
        } catch (fcmErr) {
          console.error("notifyAdminUpcomingSessions: FCM send failed", bookingDoc.ref.path, fcmErr);
        }

        await bookingDoc.ref.set({ adminNotifiedAt: FieldValue.serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("notifyAdminUpcomingSessions: failed to process doc", bookingDoc.ref.path, err);
      }
    }
  }
);
