"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { updatePassword, type User } from "firebase/auth";
import { PasswordInput } from "@/components/password-input";
import { LIMITS } from "@/lib/validation";

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or "" when the pair is acceptable. */
export function checkNewPassword(password: string, confirm: string): string {
  if (password.length < MIN_PASSWORD_LENGTH) return `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > LIMITS.password) return "That password is too long.";
  if (password !== confirm) return "The two passwords don't match. Please type them again.";
  return "";
}

function messageFor(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  if (code === "auth/requires-recent-login") {
    return "For your safety, please sign out, sign in again with a fresh email link, then set your password straight away.";
  }
  if (code === "auth/weak-password") return "That password is too easy to guess. Please choose a longer one.";
  if (code === "auth/network-request-failed") return "No internet connection. Please check it and try again.";
  return "We couldn't save your password. Please try again.";
}

/**
 * Create or change the signed-in user's password. Used after an emailed-link
 * sign-in (app/auth/verify) and on the account page, so people who aren't
 * confident online can sign in later with email + password instead of waiting
 * for a new link.
 */
export function SetPasswordForm({
  user,
  submitLabel = "Save password",
  onSaved,
}: {
  user: User;
  submitLabel?: string;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkNewPassword(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updatePassword(user, password);
      setPassword("");
      setConfirm("");
      onSaved();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ gap: "0.75rem" }} noValidate>
      <label>
        New password
        <PasswordInput
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={LIMITS.password}
          required
          style={{ marginTop: "0.5rem" }}
        />
      </label>
      <label>
        Type it again
        <PasswordInput
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={LIMITS.password}
          required
          style={{ marginTop: "0.5rem" }}
        />
      </label>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        At least {MIN_PASSWORD_LENGTH} characters. Tap the eye to see what you typed.
      </p>
      {error ? (
        <p className="auth-status auth-status-error" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      ) : null}
      <button className="button primary full-width" type="submit" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
