"use client";
import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** A password <input> with a show/hide toggle so users can verify what they typed. */
export function PasswordInput({ style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const labelId = useId();

  return (
    <div style={{ position: "relative", display: "flex" }}>
      <input {...props} type={visible ? "text" : "password"} style={{ ...style, paddingRight: "2.5rem", width: "100%" }} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-describedby={labelId}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          color: "var(--color-text-secondary, #6b7280)",
        }}
      >
        <span id={labelId} className="sr-only">{visible ? "Hide password" : "Show password"}</span>
        {visible ? (
          // eye-off
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          // eye
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
