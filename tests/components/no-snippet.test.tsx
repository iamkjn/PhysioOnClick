import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noSnippetPrices } from "@/components/no-snippet";

describe("noSnippetPrices", () => {
  it("wraps every price and leaves the visible sentence unchanged", () => {
    const text = "From £80 (4 for £1,280) or 44 pounds.";
    const { container } = render(<p>{noSnippetPrices(text)}</p>);
    expect(container.textContent).toBe(text);
    expect([...container.querySelectorAll("[data-nosnippet]")].map((n) => n.textContent)).toEqual([
      "£80",
      "£1,280",
      "44 pounds",
    ]);
  });
});
