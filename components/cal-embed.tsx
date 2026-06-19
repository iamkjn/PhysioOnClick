"use client";

export function CalEmbed() {
  const username = process.env.NEXT_PUBLIC_CAL_USERNAME;

  if (!username) {
    return (
      <p style={{ color: "#5E7A84", padding: "2rem 0" }}>
        Booking calendar is not configured. Please contact us to book an appointment.
      </p>
    );
  }

  return (
    <iframe
      src={`https://cal.com/${username}`}
      style={{ width: "100%", height: "700px", border: "none", borderRadius: 12 }}
      title="Book an appointment"
    />
  );
}
