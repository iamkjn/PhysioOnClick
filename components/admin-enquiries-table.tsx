import { getAdminDb } from "@/lib/firebase-admin";

type EnquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtLabel: string;
};

async function getEnquiries(): Promise<EnquiryRecord[]> {
  const db = getAdminDb();

  if (!db) {
    return [];
  }

  const snapshot = await db.collection("enquiries").orderBy("createdAt", "desc").limit(25).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt =
      typeof data.createdAt?.toDate === "function"
        ? data.createdAt.toDate().toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Just now";

    return {
      id: doc.id,
      name: String(data.name || ""),
      email: String(data.email || ""),
      phone: String(data.phone || "Not provided"),
      service: String(data.service || ""),
      message: String(data.message || ""),
      status: String(data.status || "new"),
      createdAtLabel: createdAt
    };
  });
}

export async function AdminEnquiriesTable() {
  const enquiries = await getEnquiries();

  return (
    <section className="page-section">
      <div className="panel stack">
        <div className="dashboard-table-head">
          <div>
            <span className="eyebrow">Enquiries</span>
            <h3>Latest contact form submissions</h3>
          </div>
          <span className="dashboard-table-count">{enquiries.length} shown</span>
        </div>

        {enquiries.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Name</th>
                  <th>Service</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((item) => (
                  <tr key={item.id}>
                    <td>{item.createdAtLabel}</td>
                    <td>{item.name}</td>
                    <td>{item.service}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td className="dashboard-message-cell">{item.message}</td>
                    <td>
                      <span className="dashboard-status-pill">{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            No enquiries are visible yet. If you have just configured Firebase admin credentials, refresh this page
            after the first form submission.
          </p>
        )}
      </div>
    </section>
  );
}
