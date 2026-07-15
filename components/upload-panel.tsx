"use client";

import { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes } from "firebase/storage";
import { useEffect } from "react";

import { auth, firebaseEnabled, storage } from "@/lib/firebase";

export function UploadPanel() {
  const [message, setMessage] = useState("Upload MRI reports, X-rays, GP letters or discharge summaries securely.");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setMessage("Firebase Storage is not configured yet. Add your Firebase environment variables to enable uploads.");
      return;
    }

    if (!userId) {
      setMessage("Please sign in before uploading documents.");
      return;
    }

    setUploading(true);
    setMessage(`Uploading ${file.name}…`);
    try {
      const fileRef = ref(storage, `patient-uploads/${userId}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      setMessage("File uploaded successfully.");
    } catch {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="panel stack">
      <h3>Secure document upload</h3>
      <p className="muted">Files are stored in a patient-specific Firebase Storage folder after sign-in.</p>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          border: "1.5px dashed var(--line)",
          borderRadius: "var(--radius-card)",
          background: "var(--color-bg)",
          padding: "1.75rem 1rem",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--ink)" }}>
          {uploading ? "Uploading…" : "Click to choose a file"}
        </span>
        <span className="muted" style={{ fontSize: "0.85em" }}>PDF, PNG, JPG or Word document</span>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          disabled={uploading}
          onChange={(event) => {
            void handleUpload(event.target.files);
          }}
          style={{ display: "none" }}
        />
      </label>
      <p className="muted">{message}</p>
    </div>
  );
}
