// "Where does it hurt?" - the primary way into the exercise library.
//
// Professional physio sites (NHS, CSP) let a visitor in by body region when
// they don't know the name of their condition. This is that entry point: a
// clean, responsive grid of large tap targets, one per curated body area,
// rendered high on `/exercises` above the search. Deliberately not an SVG
// silhouette - a labelled card grid is simpler, accessible, and keyboard-first.
//
// Server component. Reads the static `BODY_AREAS` taxonomy directly. The
// opt-in 3D picker (`BodyMap3D`) is a client island that adds nothing to the
// server HTML; the cards stay the accessible, crawlable route.

import Link from "next/link";

import { BodyMap3D } from "@/components/exercise-library/body-map-3d";
import { BODY_AREAS } from "@/lib/exercise-library";

export function BodyMap() {
  return (
    <section className="exlib-index-section exlib-bodymap" data-body-map>
      <div className="section-heading">
        <h2>Where does it hurt?</h2>
        <p>
          Pick the part of the body your problem is in. Not sure? Browse the
          conditions below or use the search.
        </p>
      </div>
      {/* Client island: renders nothing on the server or without WebGL. */}
      <BodyMap3D />
      <div className="exlib-bodymap__grid">
        {BODY_AREAS.map((area) => (
          <Link
            key={area.key}
            href={`/exercises/area/${area.key}`}
            className="exlib-bodymap__card"
          >
            <span className="exlib-bodymap__label">{area.label}</span>
            <span className="exlib-bodymap__blurb">{area.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
