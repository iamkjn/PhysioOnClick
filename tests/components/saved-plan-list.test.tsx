import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SavedPlanList } from "@/components/exercise-library/saved-plan-list";
import { addToPlan } from "@/lib/exercise-plan-store";

// A stand-in for the full library index the server page hands down.
const ITEMS = [
  { slug: "clam-shell", title: "Clam Shell" },
  { slug: "glute-bridge", title: "Glute Bridge" },
  { slug: "dead-bug", title: "Dead Bug" },
];

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe("SavedPlanList", () => {
  it("shows the empty-state line and no list when nothing is saved", async () => {
    render(<SavedPlanList items={ITEMS} />);

    expect(
      await screen.findByText(/haven't saved any exercises yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists saved exercises in plan order and drops slugs not in items", async () => {
    addToPlan("glute-bridge");
    addToPlan("not-a-real-slug");
    addToPlan("clam-shell");

    render(<SavedPlanList items={ITEMS} />);

    const exerciseLinks = (await screen.findAllByRole("link")).filter((a) =>
      a.getAttribute("href")?.startsWith("/exercises/"),
    );
    expect(exerciseLinks.map((a) => a.getAttribute("href"))).toEqual([
      "/exercises/glute-bridge",
      "/exercises/clam-shell",
    ]);

    // The book CTA is always present when the list is non-empty.
    expect(
      screen.getByRole("link", { name: /book an assessment/i }),
    ).toHaveAttribute("href", "/book");
  });

  it("removes an item when its Remove button is clicked", async () => {
    const user = userEvent.setup();
    addToPlan("clam-shell");
    addToPlan("glute-bridge");

    render(<SavedPlanList items={ITEMS} />);

    expect(
      await screen.findByRole("link", { name: "Clam Shell" }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /remove/i })[0]);

    expect(
      screen.queryByRole("link", { name: "Clam Shell" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Glute Bridge" }),
    ).toBeInTheDocument();
  });

  it("falls back to the empty state after the last item is removed", async () => {
    const user = userEvent.setup();
    addToPlan("dead-bug");

    render(<SavedPlanList items={ITEMS} />);

    await user.click(await screen.findByRole("button", { name: /remove/i }));

    expect(
      screen.getByText(/haven't saved any exercises yet/i),
    ).toBeInTheDocument();
  });
});
