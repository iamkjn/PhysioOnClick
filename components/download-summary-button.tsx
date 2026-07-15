// components/download-summary-button.tsx
"use client";

import { useState } from "react";
import type { SessionSummary } from "@/lib/session-summaries";

interface Props {
  summary: SessionSummary;
}

export function DownloadSummaryButton({ summary }: Props) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const margin = 15;
      const contentW = 210 - margin * 2;
      // jsPDF runs outside the DOM, so it can't resolve CSS custom properties —
      // these are the literal Clarity palette hex values instead of var(--token).
      const dark = "#23201B";
      const muted = "#6B655B";
      let y = margin;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      pdf.setFontSize(18);
      pdf.setTextColor(dark);
      pdf.text("PhysioOnClick Session Summary", margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(muted);
      pdf.text(
        `${summary.patientName} · ${summary.publishedAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        margin,
        y
      );
      y += 12;

      const section = (title: string, body: string) => {
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text(title, margin, y);
        y += 6;
        pdf.setFontSize(10);
        pdf.setTextColor(muted);
        const lines = pdf.splitTextToSize(body || "—", contentW) as string[];
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 6;
      };

      section("What we worked on", summary.workedOn);
      section("Exercises assigned", summary.exercises);
      section("Next steps & advice", summary.nextSteps);

      if (summary.followUpWeeks > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(dark);
        pdf.text(
          `Follow-up recommended in ${summary.followUpWeeks} week${summary.followUpWeeks > 1 ? "s" : ""}`,
          margin,
          y
        );
      }

      pdf.save(`${summary.patientName.replace(/\s+/g, "_")}_session_summary.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={() => void handleDownload()}
      disabled={generating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: generating ? "var(--color-border)" : "var(--color-text-primary)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "0.6rem 1.25rem",
        fontWeight: 700,
        fontSize: 14,
        cursor: generating ? "not-allowed" : "pointer",
      }}
    >
      {generating ? "Generating PDF…" : "Download summary"}
    </button>
  );
}
