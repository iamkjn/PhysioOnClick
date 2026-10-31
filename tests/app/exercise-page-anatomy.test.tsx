import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const state = vi.hoisted(() => ({ entry: null as null | ExerciseAnatomy }));
vi.mock("@/lib/exercise-anatomy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/exercise-anatomy")>();
  return { ...actual, visibleAnatomy: () => state.entry };
});
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => true,
  loadBodyModel: vi.fn(() => new Promise(() => {})),
  onBodyModelProgress: () => () => {},
}));

import ExercisePage, { generateMetadata } from "@/app/exercises/[slug]/page";

const SLUG = "clam-shell";
const glute: ExerciseAnatomy = {
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
};

async function renderPage() {
  return render(await ExercisePage({ params: Promise.resolve({ slug: SLUG }) }));
}
const jsonLd = (c: HTMLElement) => [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.innerHTML);

afterEach(() => {
  state.entry = null;
});

describe("exercise page anatomy", () => {
  it("renders exactly today's hero and no section when nothing is visible", async () => {
    const { container } = await renderPage();
    const media = container.querySelector(".exlib-detail-hero__media")!;
    expect(media.children).toHaveLength(1);
    expect(media.firstElementChild!.classList.contains("exlib-detail-hero__image")).toBe(true);
    expect(container.querySelector(".exlib-hero-media")).toBeNull();
    expect(container.querySelector("[data-anatomy]")).toBeNull();
  });

  it("wraps the unchanged picture with the 3D switch and adds the section after the booking prompt", async () => {
    state.entry = glute;
    const { container } = await renderPage();
    const media = container.querySelector(".exlib-detail-hero__media .exlib-hero-media")!;
    expect(media.querySelector(".exlib-detail-hero__image")).not.toBeNull();
    expect(screen.getByRole("button", { name: "View in 3D" })).toBeInTheDocument();
    const section = container.querySelector("[data-anatomy]")!;
    const prompt = container.querySelector(".exlib-next-step")!;
    expect(prompt.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the section but no 3D switch when the muscles can't be drawn", async () => {
    state.entry = { ...glute, main: ["zygomaticus"], helpers: [] };
    const { container } = await renderPage();
    expect(container.querySelector(".exlib-hero-media")).toBeNull();
    expect(container.querySelector("[data-anatomy]")).not.toBeNull();
  });

  it("leaves metadata and structured data untouched", async () => {
    const params = { params: Promise.resolve({ slug: SLUG }) };
    const before = JSON.stringify(await generateMetadata(params));
    const plain = jsonLd((await renderPage()).container);
    state.entry = glute;
    expect(JSON.stringify(await generateMetadata({ params: Promise.resolve({ slug: SLUG }) }))).toBe(before);
    expect(jsonLd((await renderPage()).container)).toEqual(plain);
  });
});
