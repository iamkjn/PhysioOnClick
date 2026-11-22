/**
 * Plain-English titles for the contact events (phone, WhatsApp and email taps,
 * and each step of the "Request a home visit" form) in the admin Growth tab.
 * Shared by the dashboard and the per-metric pages so they read the same.
 */

type LabelledEvent = { event: string; params?: Record<string, unknown> };

const FIELD_NAMES: Record<string, string> = {
  name: "name",
  phone: "phone number",
  postcode: "postcode",
  note: "note",
};

/** "phone:invalid,postcode:missing" → "phone number not accepted, postcode missing". */
function describeBlockedFields(fields: string): string {
  return fields
    .split(",")
    .map((entry) => {
      const [field = "", problem = ""] = entry.split(":");
      const name = FIELD_NAMES[field];
      if (!name) return "";
      return problem === "missing" ? `${name} missing` : `${name} not accepted`;
    })
    .filter(Boolean)
    .join(", ");
}

export function contactEventTitle(event: LabelledEvent): string | null {
  switch (event.event) {
    case "call_click":
      return "Phone number tapped";
    case "whatsapp_click":
      return "WhatsApp tapped";
    case "email_click":
      return "Email tapped";
    case "visit_request_started":
      return "Started the call-back form";
    case "visit_request_sent":
      return "Call-back requested";
    case "visit_request_error": {
      const fields = event.params?.fields;
      const problems = typeof fields === "string" ? describeBlockedFields(fields) : "";
      return problems ? `Call-back form stopped: ${problems}` : "Call-back form stopped";
    }
    case "visit_request_failed": {
      const status = event.params?.status;
      if (typeof status === "number" && status > 0) return `Call-back form didn't send (server error ${status})`;
      return "Call-back form didn't send (no connection)";
    }
    default:
      return null;
  }
}
