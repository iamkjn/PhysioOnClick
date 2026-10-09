// Demo-video slot for an exercise page. Server component.
//
// Renders nothing until the exercise has an entry in lib/exercise-demo-videos.
// Then: a privacy-enhanced YouTube player plus the VideoObject JSON-LD.

import type { Exercise } from "@/lib/exercise-library";
import { exerciseVideoObject } from "@/lib/structured-data";

export function ExerciseVideo({ exercise }: { exercise: Exercise }) {
  const video = exerciseVideoObject(exercise);
  if (!video) return null;

  const { embedUrl, contentUrl, name } = video as {
    embedUrl?: string;
    contentUrl?: string;
    name?: string;
  };
  const src = embedUrl ?? contentUrl;

  return (
    <figure className="exlib-ex-video" data-exercise-video>
      {src ? (
        <iframe
          src={src}
          title={name ?? `${exercise.title} demonstration`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(video) }}
      />
    </figure>
  );
}
