"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile
} from "firebase/auth";

import { auth, firebaseEnabled } from "@/lib/firebase";
import { ensureAppUserRecord, ensurePatientRecord } from "@/lib/patient-account";

export function AuthPanel({ role }: { role: "patient" | "admin" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "magic-link">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    firebaseEnabled ? "Use Firebase Authentication to sign in securely." : "Firebase Authentication is not configured yet."
  );
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">(firebaseEnabled ? "info" : "error");
  const isPatient = role === "patient";
  const isSignup = mode === "signup";

  function setStatus(nextMessage: string, tone: "info" | "success" | "error") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  function parseAuthError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
      return "Authentication failed. Please try again.";
    }

    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Your email or password is incorrect.";
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in instead.";
      case "auth/weak-password":
        return "Use a stronger password with at least 8 characters.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled before it completed.";
      case "auth/popup-blocked":
      case "auth/operation-not-supported-in-this-environment":
        return "Popup sign-in is blocked here. We are redirecting you to Google instead.";
      case "auth/unauthorized-domain":
        return "This website domain is not yet authorised in Firebase Authentication.";
      case "auth/network-request-failed":
        return "We could not reach Firebase. Check your connection and try again.";
      case "auth/too-many-requests":
        return "Too many attempts were made. Please wait a moment and try again.";
      default:
        return "Authentication failed. Check Firebase settings and try again.";
    }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const fullName = String(formData.get("fullName") || "").trim();

    if (!auth) {
      setStatus("Firebase Authentication is not configured. Add your environment variables first.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Checking your credentials securely…", "info");
      if (mode === "signup" && role === "patient") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(credential.user, { displayName: fullName });
        }
        await ensurePatientRecord(credential.user, fullName);
        setStatus("Patient account created. Redirecting you to your portal…", "success");
        router.push("/patient");
        router.refresh();
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (role === "admin") {
        await ensureAppUserRecord(credential.user, credential.user.displayName || "", "admin");
        setStatus("Admin sign-in successful. Redirecting…", "success");
        router.push("/admin");
      } else {
        await ensurePatientRecord(credential.user);
        setStatus("Patient sign-in successful. Redirecting you to your portal…", "success");
        router.push("/patient");
      }
      router.refresh();
    } catch (error) {
      setStatus(parseAuthError(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    if (!email) return;
    try {
      setIsSubmitting(true);
      setStatus("Sending your sign-in link…", "info");
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Could not send the link. Please try again.", "error");
      } else {
        setStatus(`Sign-in link sent to ${email}. Check your inbox.`, "success");
      }
    } catch {
      setStatus("Could not send the link. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth) {
      setStatus("Firebase Authentication is not configured. Add your environment variables first.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Opening Google sign-in…", "info");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await ensurePatientRecord(credential.user);
      setStatus("Google sign-in successful. Redirecting you to your portal…", "success");
      router.push("/patient");
      router.refresh();
    } catch (error) {
      if (error instanceof FirebaseError && (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment")) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, provider);
        return;
      }

      setStatus(parseAuthError(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel auth-panel">
      <div className="auth-panel-header">
        <span className="auth-panel-eyebrow">{role === "admin" ? "Secure admin access" : "Patient access"}</span>
        <h3>
          {role === "admin"
            ? "Admin login"
            : isSignup
            ? "Create your account"
            : mode === "magic-link"
            ? "Sign in with a link"
            : "Sign in to continue"}
        </h3>
        <p className="muted">
          {role === "admin"
            ? "Use your secure admin credentials to access bookings, enquiries and patient operations."
            : mode === "magic-link"
            ? "Enter your booking email and we will send you a sign-in link. No password needed."
            : "Use the same email you want to use for bookings, saved blogs, rehab updates and secure uploads."}
        </p>
      </div>

      {isPatient && mode !== "magic-link" ? (
        <div className="auth-provider-stack">
          <button className="auth-provider-button auth-provider-google" disabled={isSubmitting} onClick={handleGoogleSignIn} type="button">
            <span className="auth-provider-icon" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </button>
          <div className="auth-divider">
            <span>or use email &amp; password</span>
          </div>
        </div>
      ) : null}

      {mode === "magic-link" ? (
        <form className="auth-form" onSubmit={handleMagicLink}>
          <label>
            Email
            <input type="email" name="email" required placeholder="patient@example.com" />
          </label>
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleAuth}>
          {isSignup && isPatient ? (
            <label>
              Full name
              <input type="text" name="fullName" required minLength={2} placeholder="Your full name" />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" name="email" required placeholder={role === "admin" ? "admin@physioonclick.co.uk" : "patient@example.com"} />
          </label>
          <label>
            Password
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="button primary" type="submit">
            {isSubmitting ? "Please wait..." : isSignup ? "Create patient account" : "Continue"}
          </button>
        </form>
      )}

      {isPatient ? (
        <div className="auth-panel-footer">
          {mode === "magic-link" ? (
            <>
              <span className="muted">Prefer a password?</span>
              <button className="text-button" onClick={() => setMode("signin")} type="button">Sign in with password</button>
            </>
          ) : (
            <>
              <span className="muted">{isSignup ? "Already have an account?" : "Need a patient account?"}</span>
              <button className="text-button" onClick={() => setMode(isSignup ? "signin" : "signup")} type="button">
                {isSignup ? "Use sign in" : "Create account"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {isPatient && mode !== "magic-link" ? (
        <div className="auth-panel-footer" style={{ marginTop: "0.5rem" }}>
          <span className="muted">Booked before? No password?</span>
          <button className="text-button" onClick={() => setMode("magic-link")} type="button">
            Send me a sign-in link
          </button>
        </div>
      ) : null}

      <p className={`auth-status auth-status-${messageTone}`}>{message}</p>
    </div>
  );
}
