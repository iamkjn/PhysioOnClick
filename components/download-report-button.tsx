// components/download-report-button.tsx
"use client";

import { useState } from "react";
import {
  getPainLogs,
  getClinicalAssessments,
  getAssignedExercises,
  getExerciseLogs,
} from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";

interface Props {
  uid: string;
  personId: string;
  personName: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
}

export function DownloadReportButton({ uid, personId, personName, chartRef }: Props) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const [html2canvas, { jsPDF }] = await Promise.all([
        import("html2canvas").then((m) => m.default),
        import("jspdf"),
      ]);

      const [painLogs, assessments, assignedExercises, exerciseLogs] = await Promise.all([
        getPainLogs(uid, personId, 56),
        getClinicalAssessments(uid, personId, 56),
        getAssignedExercises(uid, personId),
        getExerciseLogs(uid, personId, 56),
      ]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // jsPDF runs outside the DOM, so it can't resolve CSS custom properties —
      // these are the literal Clarity palette hex values instead of var(--token).
      const brand = "#0EA5E9";
      const dark = "#23201B";
      const muted = "#6B655B";

      // Suppress unused variable warning
      void brand;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(dark);
      pdf.text("PhysioOnClick Recovery Report", margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(muted);
      pdf.text(`Patient: ${personName}`, margin, y);
      y += 6;
      pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        margin,
        y
      );
      y += 10;

      // Chart image
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const imgH = (canvas.height / canvas.width) * contentW;
        pdf.addImage(imgData, "PNG", margin, y, contentW, imgH);
        y += imgH + 8;
      }

      // Pain log table
      if (painLogs.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Self-Reported Pain Log", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        painLogs.slice(-20).forEach((log) => {
          if (y > 270) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(
            `${log.date}  Score: ${log.score}/10${log.note ? `  Note: ${log.note}` : ""}`,
            margin,
            y
          );
          y += 5;
        });
        y += 4;
      }

      // Clinical assessments table
      if (assessments.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Physio Clinical Assessments", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        assessments.forEach((a) => {
          if (y > 270) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(
            `${a.date}  Pain: ${a.painScore}/10  Mobility: ${a.mobilityScore}/10`,
            margin,
            y
          );
          y += 5;
          if (a.physioNotes) {
            const lines = pdf.splitTextToSize(`Notes: ${a.physioNotes}`, contentW);
            pdf.text(lines as string[], margin, y);
            y += (lines as string[]).length * 5;
          }
        });
        y += 4;
      }

      // Adherence summary
      if (exerciseLogs.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Exercise Adherence", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        exerciseLogs.forEach((log) => {
          if (y > 270) {
            pdf.addPage();
            y = margin;
          }
          const count = Object.values(log.completions).filter(Boolean).length;
          const total = Object.keys(log.completions).length;
          pdf.text(`${log.date}  ${count}/${total} exercises completed`, margin, y);
          y += 5;
        });
        y += 4;
      }

      // Assigned exercises list
      if (assignedExercises.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Assigned Exercises", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
        assignedExercises.forEach((ae) => {
          if (y > 270) {
            pdf.addPage();
            y = margin;
          }
          const ex = exerciseMap.get(ae.exerciseId);
          if (ex) {
            pdf.text(`• ${ex.title} (${ex.bodyPart})`, margin, y);
            y += 5;
          }
        });
      }

      pdf.save(`${personName.replace(/\s+/g, "_")}_recovery_report.pdf`);
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
      {generating ? "Generating PDF…" : "Download PDF report"}
    </button>
  );
}
