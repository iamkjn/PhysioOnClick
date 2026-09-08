// Demo-video slot for an exercise page. Server component.
//
// Phase 1 has no structured video for any exercise, so `exerciseVideoObject`
// returns null for the whole catalogue and this renders nothing. When a real
// `videoObject` is added (Phase 4), this emits the VideoObject JSON-LD and, if
// the object carries a playable URL, an embedded player.

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
