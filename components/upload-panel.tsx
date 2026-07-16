"use client";

import { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes } from "firebase/storage";
import { useEffect } from "react";

import { auth, firebaseEnabled, storage } from "@/lib/firebase";

type MessageTone = "neutral" | "success" | "error";

export function UploadPanel() {
  const [message, setMessage] = useState("Upload MRI reports, X-rays, GP letters or discharge summaries securely.");
  const [tone, setTone] = useState<MessageTone>("neutral");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || "");
    });

    return () => unsubscribe();
  }, []);

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    if (!firebaseEnabled || !storage) {
      setMessage("Uploads aren't available right now. Please try again later or contact us for help.");
      setTone("error");
      return;
    }

    if (!userId) {
      setMessage("Please sign in before uploading documents.");
      setTone("error");
      return;
    }

    setUploading(true);
    setTone("neutral");
    setMessage(`Uploading ${file.name}…`);
    try {
      const fileRef = ref(storage, `patient-uploads/${userId}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      setMessage("File uploaded successfully.");
      setTone("success");
    } catch {
      setMessage("Upload failed. Please try again.");
      setTone("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)" }}>Secure document upload</h2>
      <p className="muted">Your files are stored securely and only accessible to your care team once you have signed in.</p>
      <label
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          border: `1.5px dashed ${isFocused ? "var(--primary)" : "var(--line)"}`,
          borderRadius: "var(--radius-card)",
          background: "var(--color-bg)",
          padding: "1.75rem 1rem",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.7 : 1,
          boxShadow: isFocused ? "0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent)" : "none",
          transition: "border-color 140ms ease, box-shadow 140ms ease"
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
          {uploading ? "Uploading…" : "Click to choose a file"}
        </span>
        <span className="muted" style={{ fontSize: "0.85em" }}>PDF, PNG, JPG or Word document</span>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          disabled={uploading}
          aria-label="Choose a document to upload"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => {
            void handleUpload(event.target.files);
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: uploading ? "not-allowed" : "pointer"
          }}
        />
      </label>
      <div
        className={`form-note${tone === "error" ? " error" : tone === "success" ? " success" : ""}`}
        role={tone === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        <p className="muted">{message}</p>
      </div>
    </div>
  );
}
