"use client";

type CalEmbedProps = {
  name?: string | null;
  email?: string | null;
};

export function CalEmbed({ name, email }: CalEmbedProps = {}) {
  const username = process.env.NEXT_PUBLIC_CAL_USERNAME;

  if (!username) {
    return (
      <p style={{ color: "#5E7A84", padding: "2rem 0" }}>
        Booking calendar is not configured. Please contact us to book an appointment.
      </p>
    );
  }

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  const query = params.toString();
  // ponytail: prefill only narrows the mismatch window between the signed-in
  // account and the Cal.com attendee email — the field stays editable inside
  // the iframe, so /api/appointments/sync still does the real self-healing.
  const src = `https://cal.com/${username}${query ? `?${query}` : ""}`;

  return (
    <iframe
      src={src}
      style={{ width: "100%", height: "700px", border: "none", borderRadius: 12 }}
      title="Book an appointment"
    />
  );
}
