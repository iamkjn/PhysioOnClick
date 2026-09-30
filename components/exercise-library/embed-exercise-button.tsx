"use client";

// "Embed this exercise": a dialog with a live preview and the copy-paste
// snippet. The snippet is built on the server (lib/exercise-embed.ts) and
// passed in, so no catalogue data ships to the client.

import Link from "next/link";
import { useRef, useState } from "react";

import { trackLibraryEvent } from "@/lib/analytics";

export function EmbedExerciseButton({
  slug,
  title,
  snippet,
  previewSrc,
}: {
  slug: string;
  title: string;
  snippet: string;
  previewSrc: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  function openDialog() {
    setStatus("");
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus("Copied - paste it into your website's HTML.");
    } catch {
      textRef.current?.select();
      setStatus("Code selected - press Ctrl/Cmd+C to copy.");
    }
    trackLibraryEvent("library_embed_copy", slug);
  }

  return (
    <>
      <button type="button" className="exlib-embed-btn" onClick={openDialog}>
        Embed this exercise<span className="sr-only">: {title}</span>
      </button>
      <dialog
        ref={dialogRef}
        className="exlib-embed-dialog"
        aria-labelledby="exlib-embed-title"
        onClose={() => setOpen(false)}
      >
        <div className="exlib-embed-dialog__head">
          <h2 id="exlib-embed-title">Embed this exercise on your website</h2>
          <button type="button" className="exlib-embed-dialog__close" onClick={closeDialog} aria-label="Close">
            ×
          </button>
        </div>
        <p className="muted">
          Free for clinics, gyms, clubs and blogs. Paste this code into your page&apos;s HTML.
        </p>
        {open ? (
          <iframe
            className="exlib-embed-dialog__preview"
            src={previewSrc}
            title={`Preview: ${title} embed`}
            loading="lazy"
          />
        ) : null}
        <label htmlFor="exlib-embed-code" className="exlib-embed-dialog__label">
          Embed code
        </label>
        <textarea id="exlib-embed-code" ref={textRef} readOnly rows={5} value={snippet} onFocus={(e) => e.currentTarget.select()} />
        <div className="exlib-embed-dialog__actions">
          <button type="button" className="button primary" onClick={copy}>
            Copy code
          </button>
          <span role="status" aria-live="polite">{status}</span>
        </div>
        <p className="muted exlib-embed-dialog__licence">
          Free to embed unchanged, with the credit link kept.{" "}
          <Link href="/terms#embedding">Embedding terms</Link>
        </p>
      </dialog>
    </>
  );
}
