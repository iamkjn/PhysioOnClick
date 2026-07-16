import { exercises } from "@/lib/site-data";
import { EmptyState } from "@/components/empty-state";

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.25rem 0.65rem",
  borderRadius: "var(--radius-chip)",
  background: "var(--color-primary-light)",
  color: "var(--primary)",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

export function ExerciseLibrary() {
  if (exercises.length === 0) {
    return (
      <EmptyState
        illustration="chart"
        title="No exercises available"
        body="We're building out the exercise library. Check back soon for rehab videos."
      />
    );
  }

  return (
    <div className="card-grid">
      {exercises.map((exercise) => (
        <article className="card" key={exercise.id}>
          <div className="badge-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={badgeStyle}>{exercise.bodyPart}</span>
            <span style={badgeStyle}>{exercise.stage}</span>
          </div>
          <h3>{exercise.title}</h3>
          <p>{exercise.description}</p>
          <p className="muted">{exercise.condition}</p>
          <div
            className="video-frame"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "var(--radius-chip)",
              overflow: "hidden",
              background: "var(--color-bg)"
            }}
          >
            <iframe
              src={exercise.videoUrl}
              title={exercise.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
