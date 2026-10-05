import { render } from "@testing-library/react";
import { FaqAccordion } from "@/components/exercise-library/faq-accordion";

describe("FaqAccordion", () => {
  it("renders an internal link from [label](/path)", () => {
    const { container } = render(<FaqAccordion faqs={[{ q: "Q?", a: "Read [our guide](/guides/x) first." }]} />);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/guides/x");
    expect(container.textContent).not.toContain("](");
  });
});
