import { exercises } from "@/lib/site-data";

export function ExerciseLibrary() {
  return (
    <div className="card-grid">
      {exercises.map((exercise) => (
        <article className="card" key={exercise.id}>
          <div className="badge-row">
            <span>{exercise.bodyPart}</span>
            <span>{exercise.stage}</span>
          </div>
          <h3>{exercise.title}</h3>
          <p>{exercise.description}</p>
          <p className="muted">{exercise.condition}</p>
          <div className="video-frame">
            <iframe
              src={exercise.videoUrl}
              title={exercise.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </article>
      ))}
    </div>
  );
}
