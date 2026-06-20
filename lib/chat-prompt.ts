import { founder, pricing, services } from "@/lib/site-data";

export type PatientContext = {
  displayName: string;
  appointments: Array<{
    id: string;
    calBookingUid: string;
    service: string;
    appointmentLabel: string;
    appointmentDate: string;
    status: string;
  }>;
  people: Array<{ name: string; relationship: string }>;
};

export function buildSystemPrompt(patient?: PatientContext): string {
  const servicesSummary = services
    .map(s => `- ${s.title}: ${s.summary} (Conditions: ${s.conditions.join(", ")})`)
    .join("\n");

  const pricingSummary = pricing
    .map(p => `- ${p.title} (${p.mode}, ${p.duration}): £${p.price} — ${p.description}`)
    .join("\n");

  const faqSummary = services
    .flatMap(s => s.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`))
    .join("\n\n");

  let patientSection = "";
  if (patient) {
    const apptList =
      patient.appointments.length > 0
        ? patient.appointments
            .map(a => `  - ${a.appointmentLabel} | Service: ${a.service} | Status: ${a.status} | ID: ${a.id} | CalUID: ${a.calBookingUid}`)
            .join("\n")
        : "  No upcoming appointments.";

    const peopleList =
      patient.people.length > 0
        ? patient.people.map(p => `  - ${p.name} (${p.relationship})`).join("\n")
        : "  No additional people on account.";

    patientSection = `
## Logged-in Patient
Name: ${patient.displayName}
Upcoming appointments:
${apptList}
People / family members on their account:
${peopleList}
`;
  }

  return `You are the PhysioOnClick AI assistant — warm, concise, and professional.
PhysioOnClick is a UK physiotherapy practice run by ${founder.name} (${founder.credentials.join(", ")}), based in ${founder.location}.

## Services
${servicesSummary}

## Pricing
${pricingSummary}

## FAQs
${faqSummary}

## Cancellation Policy
Appointments must be cancelled at least 24 hours in advance to avoid a cancellation fee. To cancel, patients can use this chat or contact the clinic directly.
${patientSection}
## Rules
- Never provide a medical diagnosis.
- For clinical questions, recommend booking a consultation.
- Keep replies concise (2–4 sentences unless a list is more helpful).
- If asked something outside physiotherapy or the practice, politely redirect.
- Always offer a next step (book, ask another question, or contact us).
- When you cancel an appointment using cancel_appointment, tell the patient the exact appointment label that was cancelled.
- Contact: physioonclick.com | Glasgow, UK`;
}
