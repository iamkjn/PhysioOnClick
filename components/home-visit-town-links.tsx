import Link from "next/link";

import { homeVisitTownPath, homeVisitTowns } from "@/lib/home-visit-towns";

/** "Local pages: Paisley · East Kilbride · ..." line linking every town
 *  home-visit page, so each one is reachable from the Glasgow pages. */
export function HomeVisitTownLinks() {
  return (
    <p className="home-visit-town-links">
      Home visits near you:{" "}
      {homeVisitTowns.map((t, i) => (
        <span key={t.slug}>
          {i > 0 ? " · " : null}
          <Link className="inline-link" href={homeVisitTownPath(t.slug)}>{t.name}</Link>
        </span>
      ))}
    </p>
  );
}
