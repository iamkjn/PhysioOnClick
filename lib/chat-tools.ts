import type { FunctionDeclaration } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";
import type { Firestore } from "firebase-admin/firestore";

export const GUEST_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "get_services",
    description: "Returns the list of PhysioOnClick services when the patient asks for recommendations or more detail.",
    parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
  },
  {
    name: "redirect",
    description: "Shows the patient a tappable button card to navigate to a specific screen or page.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        label: { type: SchemaType.STRING, description: "Button label, e.g. 'Book a session'" },
        url: { type: SchemaType.STRING, description: "Relative URL or deep link, e.g. '/book'" },
      },
      required: ["label", "url"],
    },
  },
  {
    name: "open_booking",
    description: "Navigates the patient to the booking screen, optionally for a specific service.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        service: { type: SchemaType.STRING, description: "Optional service name to pre-select" },
      },
      required: [],
    },
  },
];

export const AUTH_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  ...GUEST_TOOL_DECLARATIONS,
  {
    name: "get_appointments",
    description: "Returns the patient's upcoming appointments from the system. Call this when the patient asks about their bookings, next session, or schedule.",
    parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
  },
  {
    name: "cancel_appointment",
    description: "Cancels a specific appointment by its Cal.com booking UID. Only use this after confirming with the patient which appointment to cancel.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        calBookingUid: { type: SchemaType.STRING, description: "The Cal.com booking UID of the appointment to cancel" },
      },
      required: ["calBookingUid"],
    },
  },
];

export async function executeFunction(
  name: string,
  args: Record<string, string>,
  uid: string,
  db: Firestore
): Promise<string> {
  if (name === "get_services") {
    const { services } = await import("@/lib/site-data");
    return JSON.stringify(services.map(s => ({ title: s.title, summary: s.summary })));
  }

  if (name === "redirect" || name === "open_booking") {
    return JSON.stringify({ ok: true });
  }

  if (name === "get_appointments") {
    if (!uid) return JSON.stringify({ error: "Not authenticated" });
    const snap = await db
      .collection("bookings")
      .where("patientId", "==", uid)
      .where("status", "in", ["confirmed", "pending"])
      .orderBy("appointmentDate", "asc")
      .limit(10)
      .get();

    const appts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return JSON.stringify(appts);
  }

  if (name === "cancel_appointment") {
    const { calBookingUid } = args;
    if (!calBookingUid) return JSON.stringify({ error: "calBookingUid required" });

    const calApiKey = process.env.CAL_API_KEY;
    if (!calApiKey) return JSON.stringify({ error: "Cal.com API not configured" });

    const res = await fetch(`https://api.cal.com/v2/bookings/${calBookingUid}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${calApiKey}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancellationReason: "Cancelled by patient via chat" }),
    });

    if (!res.ok) {
      return JSON.stringify({ error: `Cancel failed: ${res.status}` });
    }

    await db
      .collection("bookings")
      .where("calBookingUid", "==", calBookingUid)
      .get()
      .then(snap => {
        snap.docs.forEach(d => d.ref.update({ status: "cancelled" }));
      });

    return JSON.stringify({ ok: true, cancelled: calBookingUid });
  }

  return JSON.stringify({ error: `Unknown function: ${name}` });
}
