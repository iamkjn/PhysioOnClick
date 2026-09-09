import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToPlanButton } from "@/components/exercise-library/add-to-plan-button";
import { PlanTray } from "@/components/exercise-library/plan-tray";
import { LibrarySearch } from "@/components/exercise-library/library-search";
import type { SearchItem } from "@/lib/exercise-library";

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe("AddToPlanButton", () => {
  it("flips its label and aria-pressed when clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddToPlanButton exerciseSlug="clam-shell" exerciseTitle="Clam Shell" />,
    );

    const button = await screen.findByRole("button", { name: /add to my plan/i });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    const pressed = screen.getByRole("button", { name: /in your plan/i });
    expect(pressed).toHaveAttribute("aria-pressed", "true");

    await user.click(pressed);
    expect(
      screen.getByRole("button", { name: /add to my plan/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("a second instance for the same slug reflects the shared state", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AddToPlanButton exerciseSlug="glute-bridge" exerciseTitle="Glute Bridge" />
        <AddToPlanButton exerciseSlug="glute-bridge" exerciseTitle="Glute Bridge" />
      </>,
    );

    const buttons = await screen.findAllByRole("button");
    await user.click(buttons[0]);

    for (const b of screen.getAllByRole("button")) {
      expect(b).toHaveAttribute("aria-pressed", "true");
    }
  });
});

describe("PlanTray", () => {
  it("renders nothing when the plan is empty", () => {
    const { container } = render(<PlanTray />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a singular count and a link to the library after one add", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AddToPlanButton exerciseSlug="clam-shell" exerciseTitle="Clam Shell" />
        <PlanTray />
      </>,
    );

    await user.click(
      await screen.findByRole("button", { name: /add to my plan/i }),
    );

    const link = screen.getByRole("link", { name: /1 exercise · view plan/i });
    expect(link).toHaveAttribute("href", "/exercises#my-plan");
  });

  it("pluralises the count", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AddToPlanButton exerciseSlug="clam-shell" exerciseTitle="Clam Shell" />
        <AddToPlanButton exerciseSlug="glute-bridge" exerciseTitle="Glute Bridge" />
        <PlanTray />
      </>,
    );

    const buttons = await screen.findAllByRole("button", {
      name: /add to my plan/i,
    });
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(
      screen.getByRole("link", { name: /2 exercises · view plan/i }),
    ).toBeInTheDocument();
  });
});

describe("LibrarySearch", () => {
  const items: SearchItem[] = [
    {
      kind: "exercise",
      slug: "clam-shell",
      title: "Clam Shell",
      terms: "clam shell clamshell gluteal weakness hip and groin",
    },
    {
      kind: "exercise",
      slug: "glute-bridge",
      title: "Glute Bridge",
      terms: "glute bridge hip and groin",
    },
    {
      kind: "condition",
      slug: "hip-oa",
      name: "Hip osteoarthritis",
      terms: "hip osteoarthritis hip arthritis wear and tear hip and groin",
    },
  ];

  it("shows a link to a matching exercise while typing", async () => {
    const user = userEvent.setup();
    render(<LibrarySearch items={items} />);

    await user.type(screen.getByRole("searchbox"), "clam");

    expect(
      screen.getByRole("link", { name: /clam shell/i }),
    ).toHaveAttribute("href", "/exercises/clam-shell");
  });

  it("matches conditions on their synonym terms too", async () => {
    const user = userEvent.setup();
    render(<LibrarySearch items={items} />);

    await user.type(screen.getByRole("searchbox"), "arthritis");

    expect(
      screen.getByRole("link", { name: /hip osteoarthritis/i }),
    ).toHaveAttribute("href", "/exercises/for/hip-oa");
  });

  it("shows a no-matches line for a query that matches nothing", async () => {
    const user = userEvent.setup();
    render(<LibrarySearch items={items} />);

    await user.type(screen.getByRole("searchbox"), "zzzz");

    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it("shows neither results nor a no-matches line for an empty query", () => {
    render(<LibrarySearch items={items} />);

    expect(screen.queryByText(/no matches/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
