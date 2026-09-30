import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExerciseImage } from "@/components/exercise-image";
import { LibraryCopyrightNotice } from "@/components/exercise-library/library-copyright-notice";
import { exercises } from "@/lib/exercises";
import { hasUploadedImage } from "@/lib/exercise-image-prompts";
import { exerciseWebPage } from "@/lib/structured-data";

const illustrated = exercises.find((e) => hasUploadedImage(e.id))!;

describe("ExerciseImage protection", () => {
  it("watermarks large images and blocks drag + the save-image menu", () => {
    const { container } = render(
      <ExerciseImage exerciseId={illustrated.id} name={illustrated.title} size={640} />,
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("draggable")).toBe("false");
    expect(screen.getByText(/physioonclick\.co\.uk/)).toBeInTheDocument();

    const tile = container.querySelector(".protected-image")!;
    const notCancelled = fireEvent.contextMenu(tile);
    expect(notCancelled).toBe(false);
  });

  it("leaves thumbnails unwatermarked", () => {
    render(<ExerciseImage exerciseId={illustrated.id} name={illustrated.title} size={72} />);
    expect(screen.queryByText(/physioonclick\.co\.uk/)).toBeNull();
  });
});

describe("LibraryCopyrightNotice", () => {
  it("claims ownership and points professionals to contact + terms", () => {
    const { container } = render(<LibraryCopyrightNotice />);
    expect(container).toHaveTextContent(/© \d{4} PhysioOnClick/);
    expect(container.querySelector('a[href="/contact"]')).not.toBeNull();
    expect(container.querySelector('a[href="/terms#intellectual-property"]')).not.toBeNull();
  });
});

describe("exercise page schema", () => {
  it("names the practice as copyright holder", () => {
    const page = exerciseWebPage(illustrated, `/exercises/${illustrated.slug}`) as Record<string, unknown>;
    expect(page.copyrightHolder).toEqual({ "@id": expect.stringContaining("physioonclick") });
    expect(page.copyrightNotice).toMatch(/PhysioOnClick/);
  });
});

describe("ProtectedImageFrame", () => {
  it("blocks the save-image menu and watermarks only when asked", async () => {
    const { ProtectedImageFrame } = await import("@/components/image-protection");
    const { container, rerender } = render(
      <ProtectedImageFrame watermark>
        <img src="/cover.png" alt="" />
      </ProtectedImageFrame>,
    );
    expect(fireEvent.contextMenu(container.firstChild as Element)).toBe(false);
    expect(screen.getByText(/physioonclick\.co\.uk/)).toBeInTheDocument();

    rerender(
      <ProtectedImageFrame>
        <img src="/cover.png" alt="" />
      </ProtectedImageFrame>,
    );
    expect(screen.queryByText(/physioonclick\.co\.uk/)).toBeNull();
  });
});

describe("LibraryCopyrightNotice for blog articles", () => {
  it("names the article as the protected content", () => {
    const { container } = render(
      <LibraryCopyrightNotice content="This article and its images are" inset />,
    );
    expect(container).toHaveTextContent("This article and its images are our original work");
    expect(container.querySelector(".site-shell")).toBeNull();
  });
});
