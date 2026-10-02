import { describe, expect, it } from "vitest";

import { getExerciseBySlug } from "@/lib/exercise-library";
import type { Exercise } from "@/lib/exercises";
import {
  buildEmbedSnippet,
  embedHeight,
  embedPath,
  escapeHtml,
  renderEmbedDisabledHtml,
  renderEmbedHtml,
} from "@/lib/exercise-embed";
import { splitMistakes } from "@/lib/exercise-safety-line";

const clam = getExerciseBySlug("clam-shell") as Exercise;

describe("exercise embed", () => {
  it("builds the embed path", () => {
    expect(embedPath("clam-shell")).toBe("/embed/exercises/clam-shell");
  });

  it("snippet has the iframe AND a plain attribution link outside it", () => {
    const snippet = buildEmbedSnippet(clam);
    expect(snippet).toContain('src="https://physioonclick.co.uk/embed/exercises/clam-shell"');
    const afterIframe = snippet.split("</iframe>")[1];
    expect(afterIframe).toContain('<a href="https://physioonclick.co.uk/exercises/clam-shell">');
    expect(afterIframe).toContain('<a href="https://physioonclick.co.uk/">PhysioOnClick</a>');
  });

  it("snippet is pure ASCII for an ASCII title and sized to its content", () => {
    const snippet = buildEmbedSnippet({ ...clam, title: "Clam Shell" });
    expect(/^[\x00-\x7F]*$/.test(snippet)).toBe(true);
    expect(snippet).toContain(`height="${embedHeight(clam)}"`);
  });

  it("escapes hostile titles", () => {
    const evil = { ...clam, title: `A "b" <c> & d` };
    const snippet = buildEmbedSnippet(evil);
    expect(snippet).not.toContain("<c>");
    expect(snippet).toContain("A &quot;b&quot; &lt;c&gt; &amp; d");
    expect(escapeHtml(`'`)).toBe("&#39;");
  });

  it("renders a self-contained, noindexed, script-free document", () => {
    const html = renderEmbedHtml(clam);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('<link rel="canonical" href="https://physioonclick.co.uk/exercises/clam-shell">');
    expect(html).toContain("© physioonclick.co.uk");
    expect(html).toMatch(/<img src="\/exercise-images\//);
    expect(html).toContain("utm_source=embed");
    expect(html).toContain('target="_blank"');
    expect(html.toLowerCase()).not.toContain("<script");
    for (const step of clam.steps ?? []) {
      expect(html).toContain(escapeHtml(step));
    }
  });

  it("renders a disabled card linking to the exercise", () => {
    const html = renderEmbedDisabledHtml(clam);
    expect(html).toContain("View this exercise at PhysioOnClick");
    expect(html).toContain("https://physioonclick.co.uk/exercises/clam-shell");
    expect(html.toLowerCase()).not.toContain("<script");
  });
});

describe("splitMistakes", () => {
  it("pulls a trailing caution out as the safety line", () => {
    expect(splitMistakes(["Rushing", "Stop if pain spreads"])).toEqual({
      ordinary: ["Rushing"],
      safety: "Stop if pain spreads",
    });
  });

  it("falls back to the generic caution", () => {
    expect(splitMistakes(["Rushing"]).safety).toBe(
      "Stop and seek advice if an exercise causes sharp or lasting pain.",
    );
  });
});

describe("embedHeight", () => {
  // Rendered heights measured in a browser at a 360px-wide column.
  it.each([
    ["clam-shell", 665],
    ["sit-to-stand-control", 747],
    ["full-body-stretch-routine", 932],
  ])("leaves room for %s (%ipx at 360px wide)", (slug, measured) => {
    const h = embedHeight(getExerciseBySlug(slug) as Exercise);
    expect(h).toBeGreaterThanOrEqual(measured);
    expect(h).toBeLessThanOrEqual(measured + 120);
  });
});
