import type { Metadata } from "next";

import { AdminChatLogsGate } from "@/components/admin-chat-logs-gate";

export const metadata: Metadata = {
  title: "Chat Logs | Admin | PhysioOnClick",
};

export const dynamic = "force-dynamic";

export default function AdminChatLogsPage() {
  return <AdminChatLogsGate />;
}
