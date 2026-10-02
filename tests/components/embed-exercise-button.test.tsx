import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: vi.fn() }));

import { trackLibraryEvent } from "@/lib/analytics";
import { EmbedExerciseButton } from "@/components/exercise-library/embed-exercise-button";

const props = {
  slug: "clam-shell",
  title: "Clam Shell",
  snippet: '<iframe src="https://physioonclick.co.uk/embed/exercises/clam-shell"></iframe>',
  previewSrc: "/embed/exercises/clam-shell",
};

function setClipboard(writeText: unknown) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

beforeEach(() => {
  vi.mocked(trackLibraryEvent).mockClear();
  // jsdom lacks <dialog> methods
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("EmbedExerciseButton", () => {
  it("shows the snippet and licence link when opened", () => {
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    expect(screen.getByLabelText(/embed code/i)).toHaveValue(props.snippet);
    expect(screen.getByRole("link", { name: /embedding terms/i })).toHaveAttribute("href", "/terms#embedding");
  });

  it("copies the snippet and tracks the event", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/copied/i));
    expect(writeText).toHaveBeenCalledWith(props.snippet);
    expect(trackLibraryEvent).toHaveBeenCalledWith("library_embed_copy", "clam-shell");
  });

  it("falls back to manual copy when the clipboard is unavailable", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("no")));
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/ctrl\/cmd\+c/i));
  });

  it("closes when the backdrop (the dialog itself) is clicked, not its content", () => {
    const { container } = render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    fireEvent.click(screen.getByLabelText(/embed code/i));
    expect(HTMLDialogElement.prototype.close).not.toHaveBeenCalled();
    fireEvent.click(dialog);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
