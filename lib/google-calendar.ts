import { JWT } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function getClient(): JWT | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    return new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: SCOPES,
    });
  } catch {
    return null;
  }
}

export type CalendarEvent = {
  summary: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDurationMinutes: number;
  attendeeEmail: string;
};

export type CalendarResult = {
  eventId: string;
  meetLink: string;
  htmlLink: string;
};

export async function createEventWithMeet(event: CalendarEvent): Promise<CalendarResult | null> {
  const client = getClient();
  if (!client) return null;

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return null;

  try {
    const token = await client.getAccessToken();
    if (!token.token) return null;

    const start = new Date(event.startDateTime);
    const end = new Date(start.getTime() + event.endDurationMinutes * 60 * 1000);

    const body = {
      summary: event.summary,
      description: event.description,
      start: { dateTime: start.toISOString(), timeZone: "Europe/London" },
      end: { dateTime: end.toISOString(), timeZone: "Europe/London" },
      attendees: [{ email: event.attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `physio-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[google-calendar] event creation failed:", err);
      return null;
    }

    const data = await res.json();
    const meetLink =
      data.conferenceData?.entryPoints?.find(
        (ep: { entryPointType: string; uri: string }) => ep.entryPointType === "video"
      )?.uri ?? "";

    return {
      eventId: data.id,
      meetLink,
      htmlLink: data.htmlLink ?? "",
    };
  } catch (err) {
    console.error("[google-calendar] error:", err);
    return null;
  }
}
