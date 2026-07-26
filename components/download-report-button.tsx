// components/download-report-button.tsx
"use client";

import { useState } from "react";
import {
  getPainLogs,
  getClinicalAssessments,
  getAssignedExercises,
  getExerciseLogs,
  dateKeyDaysAgo,
} from "@/lib/recovery";
import { getMotionSessions, type MotionSession } from "@/lib/motion";
import { getStreakGoal } from "@/lib/goals";
import { exercises as allExercises } from "@/lib/site-data";

interface Props {
  uid: string;
  personId: string;
  personName: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
}

// Clarity System palette as literal hex — jsPDF runs outside the DOM and can't
// resolve CSS custom properties. Kept together so the report reads as one
// branded document rather than ad-hoc greys.
const PALETTE = {
  brand: "#0EA5E9", // sky accent
  brandDark: "#0B7FB2",
  ink: "#23201B", // navy ink
  muted: "#6B655B",
  paper: "#FBF7F0", // warm paper
  band: "#F0EAE0", // section-header wash
  rule: "#E3DAcc",
  good: "#2E9E6B",
  warn: "#C9822E",
  zebra: "#F6F1E8",
};

const COMPANY = "PhysioOnClick";

// Current daily streak: consecutive days back from today with ≥1 completion.
// Mirrors components/streak-card.tsx (today-not-yet-logged doesn't break it).
function computeStreak(completedDates: Set<string>): number {
  let streak = 0;
  const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
  for (let i = startOffset; i < 400; i += 1) {
    if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
    else break;
  }
  return streak;
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

      const [painLogs, assessments, assignedExercises, exerciseLogs, motionSessions, streakGoal] =
        await Promise.all([
          getPainLogs(uid, personId, 56),
          getClinicalAssessments(uid, personId, 56),
          getAssignedExercises(uid, personId),
          getExerciseLogs(uid, personId, 56),
          getMotionSessions(uid, personId, 60),
          getStreakGoal(uid, personId).catch(() => null),
        ]);

      const streak = computeStreak(
        new Set(
          exerciseLogs
            .filter((log) => Object.values(log.completions).some(Boolean))
            .map((log) => log.date)
        )
      );

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ---- low-level helpers -------------------------------------------------
      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 20) {
          pdf.addPage();
          y = margin;
        }
      };

      const sectionHeader = (title: string) => {
        ensureSpace(16);
        pdf.setFillColor(PALETTE.band);
        pdf.roundedRect(margin, y, contentW, 9, 1.5, 1.5, "F");
        pdf.setFillColor(PALETTE.brand);
        pdf.roundedRect(margin, y, 2.5, 9, 1.2, 1.2, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(PALETTE.ink);
        pdf.text(title, margin + 6, y + 6.2);
        pdf.setFont("helvetica", "normal");
        y += 14;
      };

      // Horizontal progress bar with an optional target-band overlay.
      // pct/targetPct are 0–100. Draws label above, bar below; advances y.
      const progressBar = (
        label: string,
        valueText: string,
        pct: number,
        color: string,
        bandFrom?: number,
        bandTo?: number
      ) => {
        ensureSpace(11);
        const barW = contentW;
        const barH = 4;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(PALETTE.muted);
        pdf.text(label, margin, y);
        pdf.setTextColor(PALETTE.ink);
        pdf.text(valueText, margin + barW, y, { align: "right" });
        y += 2;
        // track
        pdf.setFillColor(PALETTE.rule);
        pdf.roundedRect(margin, y, barW, barH, 1, 1, "F");
        // target band (e.g. desired ROM window)
        if (bandFrom !== undefined && bandTo !== undefined) {
          const bx = margin + (Math.max(0, Math.min(100, bandFrom)) / 100) * barW;
          const bw = ((Math.max(0, Math.min(100, bandTo)) - Math.max(0, Math.min(100, bandFrom))) / 100) * barW;
          pdf.setFillColor("#CDE9F6");
          pdf.roundedRect(bx, y, Math.max(0.5, bw), barH, 1, 1, "F");
        }
        // fill
        const clamped = Math.max(0, Math.min(100, pct));
        if (clamped > 0) {
          pdf.setFillColor(color);
          pdf.roundedRect(margin, y, (clamped / 100) * barW, barH, 1, 1, "F");
        }
        y += barH + 5;
      };

      const bodyText = (text: string, size = 9, color = PALETTE.muted) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(color);
        const lines = pdf.splitTextToSize(text, contentW) as string[];
        lines.forEach((line) => {
          ensureSpace(6);
          pdf.text(line, margin, y);
          y += 5;
        });
      };

      // Simple zebra-striped two/three-column row printer.
      const tableRows = (rows: string[][], colX: number[], rowIndexStart = 0) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        rows.forEach((cells, i) => {
          ensureSpace(7);
          if ((i + rowIndexStart) % 2 === 0) {
            pdf.setFillColor(PALETTE.zebra);
            pdf.rect(margin, y - 3.5, contentW, 6, "F");
          }
          pdf.setTextColor(PALETTE.ink);
          cells.forEach((c, ci) => {
            const align = ci === cells.length - 1 && colX[ci] >= margin + contentW - 2 ? "right" : "left";
            pdf.text(c, colX[ci], y, align === "right" ? { align: "right" } : undefined);
          });
          y += 6;
        });
        y += 3;
      };

      // ---- branded header band ----------------------------------------------
      pdf.setFillColor(PALETTE.ink);
      pdf.rect(0, 0, pageW, 30, "F");
      pdf.setFillColor(PALETTE.brand);
      pdf.rect(0, 30, pageW, 1.6, "F");
      // logo mark: a small sky dot + wordmark
      pdf.setFillColor(PALETTE.brand);
      pdf.circle(margin + 2.2, 13, 2.4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor("#FFFFFF");
      pdf.text(COMPANY, margin + 7, 15);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor("#C9D8E0");
      pdf.text("Personalised Recovery Report", margin + 7, 21);
      pdf.text(
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        pageW - margin,
        15,
        { align: "right" }
      );
      y = 40;

      // ---- patient detail card ----------------------------------------------
      const rangeEnd = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const rangeStart = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 55);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      })();
      const cardH = 24;
      pdf.setFillColor(PALETTE.paper);
      pdf.roundedRect(margin, y, contentW, cardH, 2, 2, "F");
      pdf.setDrawColor(PALETTE.rule);
      pdf.roundedRect(margin, y, contentW, cardH, 2, 2, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(PALETTE.ink);
      pdf.text(personName, margin + 5, y + 9);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(PALETTE.muted);
      pdf.text(`Report period: ${rangeStart} – ${rangeEnd}`, margin + 5, y + 15);
      pdf.text(`Assigned exercises: ${assignedExercises.length}`, margin + 5, y + 20);
      // streak pill on the right
      const pillW = 46;
      const pillX = margin + contentW - pillW - 5;
      pdf.setFillColor(streak > 0 ? PALETTE.brand : PALETTE.rule);
      pdf.roundedRect(pillX, y + 5, pillW, cardH - 10, 6, 6, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor("#FFFFFF");
      pdf.text(`${streak}`, pillX + pillW / 2, y + 12.5, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(
        streakGoal ? `day streak · goal ${streakGoal}` : "day streak",
        pillX + pillW / 2,
        y + 16.5,
        { align: "center" }
      );
      y += cardH + 8;

      // ---- recovery trend chart ---------------------------------------------
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const imgH = (canvas.height / canvas.width) * contentW;
        ensureSpace(imgH + 6);
        sectionHeader("Recovery Trend");
        pdf.addImage(imgData, "PNG", margin, y, contentW, imgH);
        y += imgH + 8;
      }

      // ---- motion performance (targets + progress) --------------------------
      if (motionSessions.length > 0) {
        sectionHeader("Motion Performance");
        bodyText(
          "Camera-measured movement quality. Each exercise shows your best recent session against its target — range of motion for body exercises, and left/right symmetry for facial exercises.",
          8.5
        );
        y += 1;

        // Best (most recent) session per exercise.
        const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
        const latestByExercise = new Map<string, MotionSession>();
        for (const s of motionSessions) {
          if (!latestByExercise.has(s.exerciseId)) latestByExercise.set(s.exerciseId, s);
        }

        for (const s of latestByExercise.values()) {
          const ex = exerciseMap.get(s.exerciseId);
          const title = ex?.title ?? s.exerciseId;
          ensureSpace(30);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(PALETTE.ink);
          pdf.text(`${title}`, margin, y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(s.passed ? PALETTE.good : PALETTE.warn);
          pdf.text(s.passed ? "On target" : "Building up", margin + contentW, y, { align: "right" });
          y += 5;

          // Reps vs target — shared by both kinds.
          const repPct = s.repTarget > 0 ? (s.reps / s.repTarget) * 100 : 0;
          progressBar(
            "Reps completed",
            `${s.reps} / ${s.repTarget}`,
            repPct,
            s.reps >= s.repTarget ? PALETTE.good : PALETTE.brand
          );

          if (s.kind === "face") {
            const sym = s.symmetryAvg ?? 0;
            progressBar(
              "Left / right symmetry",
              `${sym}%`,
              sym,
              sym >= 75 ? PALETTE.good : PALETTE.warn
            );
            progressBar("Left side range", `${s.leftRangePct ?? 0}%`, s.leftRangePct ?? 0, PALETTE.brand);
            progressBar("Right side range", `${s.rightRangePct ?? 0}%`, s.rightRangePct ?? 0, PALETTE.brand);
            if (s.weakerSide && s.weakerSide !== "even") {
              bodyText(`Focus area: strengthen the ${s.weakerSide} side to even out the movement.`, 8, PALETTE.warn);
            }
          } else {
            // Body: achieved ROM against the target window.
            const denom = s.targetRomMax || 1;
            const achievedPct = (s.romMax / denom) * 100;
            const bandFrom = (s.targetRomMin / denom) * 100;
            const bandTo = (s.targetRomMax / denom) * 100;
            progressBar(
              "Range of motion (peak vs target band)",
              `${s.romMax}° (target ${s.targetRomMin}–${s.targetRomMax}°)`,
              achievedPct,
              PALETTE.brand,
              bandFrom,
              bandTo
            );
            progressBar(
              "Movement quality",
              `${s.avgQuality}%`,
              s.avgQuality,
              s.avgQuality >= 60 ? PALETTE.good : PALETTE.warn
            );
          }
          y += 3;
        }
      }

      // ---- self-reported pain log -------------------------------------------
      if (painLogs.length > 0) {
        sectionHeader("Self-Reported Pain Log");
        tableRows(
          painLogs.slice(-20).map((log) => [
            log.date,
            `Score ${log.score}/10`,
            log.note ? log.note : "",
          ]),
          [margin + 2, margin + 40, margin + 78]
        );
      }

      // ---- clinical assessments ---------------------------------------------
      if (assessments.length > 0) {
        sectionHeader("Physio Clinical Assessments");
        assessments.forEach((a) => {
          ensureSpace(8);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(PALETTE.ink);
          pdf.text(`${a.date}`, margin, y);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(PALETTE.muted);
          pdf.text(`Pain ${a.painScore}/10   ·   Mobility ${a.mobilityScore}/10`, margin + 30, y);
          y += 5;
          if (a.physioNotes) bodyText(`Notes: ${a.physioNotes}`, 8.5);
          y += 1;
        });
      }

      // ---- exercise adherence -----------------------------------------------
      if (exerciseLogs.length > 0) {
        sectionHeader("Exercise Adherence");
        exerciseLogs.forEach((log) => {
          const count = Object.values(log.completions).filter(Boolean).length;
          const total = Object.keys(log.completions).length || 1;
          progressBar(log.date, `${count}/${total} completed`, (count / total) * 100, PALETTE.brand);
        });
      }

      // ---- assigned exercises -----------------------------------------------
      if (assignedExercises.length > 0) {
        sectionHeader("Assigned Exercises");
        const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
        tableRows(
          assignedExercises
            .map((ae) => exerciseMap.get(ae.exerciseId))
            .filter((ex): ex is NonNullable<typeof ex> => !!ex)
            .map((ex) => [ex.title, ex.bodyPart, ex.stage]),
          [margin + 2, margin + 78, margin + 130]
        );
      }

      // ---- footer on every page ---------------------------------------------
      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i += 1) {
        pdf.setPage(i);
        pdf.setDrawColor(PALETTE.rule);
        pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(PALETTE.muted);
        pdf.text(
          `${COMPANY} · Personalised recovery report for ${personName}`,
          margin,
          pageH - 7
        );
        pdf.text(`Page ${i} of ${total}`, pageW - margin, pageH - 7, { align: "right" });
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
      aria-label={generating ? "Generating PDF report" : "Download recovery report as PDF"}
      aria-busy={generating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        minHeight: 46,
        background: generating ? "var(--color-border)" : "var(--color-text-primary)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius-input)",
        padding: "0.6rem 1.25rem",
        fontWeight: 700,
        fontSize: "var(--text-sm)",
        cursor: generating ? "not-allowed" : "pointer",
      }}
    >
      {generating ? "Generating PDF…" : "Download PDF report"}
    </button>
  );
}
