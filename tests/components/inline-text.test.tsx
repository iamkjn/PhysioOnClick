import { render } from "@testing-library/react";
import { InlineText } from "@/components/inline-text";

describe("InlineText", () => {
  it("renders plain text unchanged", () => {
    const { container } = render(<p><InlineText text="No links here." /></p>);
    expect(container.textContent).toBe("No links here.");
    expect(container.querySelector("a")).toBeNull();
  });
  it("turns [label](/path) into an internal link", () => {
    const { container } = render(<p><InlineText text="See [our pricing](/pricing) first." /></p>);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/pricing");
    expect(a.textContent).toBe("our pricing");
    expect(container.textContent).toBe("See our pricing first.");
  });
  it("does not link external or protocol-relative targets", () => {
    const { container } = render(<p><InlineText text="[x](https://evil.example) and [y](//evil.example)" /></p>);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("x and y");
  });
});
