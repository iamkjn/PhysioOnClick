import type { Metadata } from "next";

import { AdminChatLogs } from "@/components/admin-chat-logs";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = {
  title: "Chat Logs | Admin | PhysioOnClick",
};

export const dynamic = "force-dynamic";

export default function AdminChatLogsPage() {
  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Admin</span>
          <h1>Chat Logs</h1>
          <p className="lead">Browse and search all patient chat sessions.</p>
        </div>
      </section>

      <section className="page-section dashboard-grid">
        <AuthPanel role="admin" />
      </section>

      <section className="page-section">
        <AdminChatLogs />
      </section>
    </div>
  );
}
