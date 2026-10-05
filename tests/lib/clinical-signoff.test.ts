import { PHASE_BC_REVIEWED_ON } from "@/lib/clinical-signoff";
import { guides } from "@/lib/guides";
import { onlinePhysioPages } from "@/lib/online-physio-pages";

describe("phase B/C clinical sign-off date", () => {
  it("is an ISO date", () => {
    expect(PHASE_BC_REVIEWED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is the reviewedOn of every guide and landing page", () => {
    for (const g of guides) expect(g.reviewedOn, g.slug).toBe(PHASE_BC_REVIEWED_ON);
    for (const p of onlinePhysioPages) expect(p.reviewedOn, p.slug).toBe(PHASE_BC_REVIEWED_ON);
  });
});
