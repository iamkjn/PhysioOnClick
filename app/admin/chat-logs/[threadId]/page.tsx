import type { Metadata } from "next";

import { AdminChatLogDetailGate } from "@/components/admin-chat-log-detail-gate";

export const metadata: Metadata = {
  title: "Chat Detail | Admin | PhysioOnClick",
};

export const dynamic = "force-dynamic";

export default async function AdminChatLogDetailPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <AdminChatLogDetailGate threadId={threadId} />;
}
