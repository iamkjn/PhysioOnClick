import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SpecialtyLanding } from "@/components/specialty-landing";
import { showContactBar } from "@/components/contact-bar";
import ServicesPage from "@/app/services/page";
import sitemap from "@/app/sitemap";
import { topicForPath } from "@/lib/practice-contact";
import { specialtyImagePath, specialtyPages } from "@/lib/specialty-pages";

describe("specialty landing pages", () => {
  it.each(specialtyPages)("$path has search-sized metadata, safety copy and no promises", (page) => {
    expect(page.metaTitle.length).toBeLessThanOrEqual(60);
    expect(page.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(page.metaDescription.length).toBeLessThanOrEqual(160);
    const { container } = render(<SpecialtyLanding page={page} />);
    const text = container.textContent ?? "";
    expect(text).toContain(page.urgent);
    expect(existsSync(`public${specialtyImagePath(page)}`)).toBe(true);
    expect(container.querySelector(`img[alt="${page.imageAlt}"]`)).not.toBeNull();
    expect(text).toContain("GP or specialist team must confirm");
    expect(text).not.toMatch(/guarantee|manipulation|needling|acupuncture|travel fee/i);
    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(3);
    expect(showContactBar(page.path)).toBe(true);
    expect(topicForPath(page.path)).toBe("condition");
    expect(readFileSync("components/site-footer.tsx", "utf8")).toContain(`href="${page.path}"`);
  });

  it("are linked from the services page", () => {
    const hrefs = [...render(<ServicesPage />).container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    for (const page of specialtyPages) expect(hrefs).toContain(page.path);
  });

  it("are all in the sitemap", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    for (const page of specialtyPages) expect(urls.some((u) => u.endsWith(page.path))).toBe(true);
  });
});
