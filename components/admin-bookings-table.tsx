import { getAdminDb } from "@/lib/firebase-admin";

type BookingRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentLabel: string;
  status: string;
  notes: string;
};

async function getBookings(): Promise<BookingRecord[]> {
  const db = getAdminDb();

  if (!db) {
    return [];
  }

  const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").limit(25).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      fullName: String(data.fullName || data.name || ""),
      email: String(data.email || ""),
      phone: String(data.phone || "Not provided"),
      service: String(data.service || ""),
      appointmentLabel: String(
        data.appointmentLabel ||
          (data.appointmentDate && data.appointmentTime ? `${data.appointmentDate} ${data.appointmentTime}` : "TBC")
      ),
      status: String(data.status || "pending"),
      notes: String(data.notes || "")
    };
  });
}

export async function AdminBookingsTable() {
  const bookings = await getBookings();

  return (
    <section className="page-section">
      <div className="panel stack">
        <div className="dashboard-table-head">
          <div>
            <span className="eyebrow">Bookings</span>
            <h3>Latest appointment requests</h3>
          </div>
          <span className="dashboard-table-count">{bookings.length} shown</span>
        </div>

        {bookings.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Appointment</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fullName}</td>
                    <td>{item.service}</td>
                    <td>{item.appointmentLabel}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td className="dashboard-message-cell">{item.notes || "No notes provided."}</td>
                    <td>
                      <span className="dashboard-status-pill">{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No booking records are visible yet. New appointments will appear here after submission.</p>
        )}
      </div>
    </section>
  );
}
