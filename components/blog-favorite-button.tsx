"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import type { BlogArticle } from "@/lib/blog";
import { auth, db } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import { SkeletonCircle } from "@/components/skeleton";

export function BlogFavoriteButton({
  article,
  compact = false
}: {
  article: BlogArticle;
  compact?: boolean;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }

    return onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setUserId(user?.uid || "");
    });
  }, []);

  useEffect(() => {
    if (!db || !userId) {
      setIsFavourite(false);
      return;
    }

    return onSnapshot(doc(db, "patients", userId, "favoriteBlogs", article.slug), (snapshot) => {
      setIsFavourite(snapshot.exists());
    });
  }, [article.slug, userId]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus("");
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [status]);

  async function toggleFavourite() {
    if (!db || !auth?.currentUser) {
      setStatus("Sign in to save blogs.");
      window.setTimeout(() => {
        router.push("/patient");
      }, 180);
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      await ensurePatientRecord(auth.currentUser);
      const ref = doc(db, "patients", auth.currentUser.uid, "favoriteBlogs", article.slug);

      if (isFavourite) {
        await deleteDoc(ref);
        setStatus("Removed from saved blogs.");
      } else {
        await setDoc(ref, {
          slug: article.slug,
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          image: article.image,
          publishedAt: article.publishedAt,
          userId: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          savedAt: serverTimestamp()
        });
        setStatus("Saved to your account.");
      }
    } catch {
      setStatus("We could not update saved blogs right now.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!resolvedAuth) {
    return (
      <div className={`blog-favorite-wrap ${compact ? "compact" : ""}`}>
        <SkeletonCircle size="24px" />
      </div>
    );
  }

  return (
    <div className={`blog-favorite-wrap ${compact ? "compact" : ""}`}>
      <button
        aria-label={isFavourite ? "Remove from saved blogs" : "Save blog"}
        className={`blog-favorite-button ${isFavourite ? "active" : ""}`}
        disabled={isSaving}
        onClick={toggleFavourite}
        title={status || (isFavourite ? "Remove from saved blogs" : "Save to your account")}
        type="button"
      >
        <svg aria-hidden="true" fill={isFavourite ? "currentColor" : "none"} height="20" viewBox="0 0 24 24" width="20">
          <path
            d="M11.998 3.85l2.524 5.113 5.64.82-4.082 3.98.964 5.617-5.046-2.654-5.046 2.654.964-5.617-4.082-3.98 5.64-.82 2.524-5.113z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>
      {status ? <span className={`blog-favorite-status ${compact ? "compact" : ""}`}>{status}</span> : null}
    </div>
  );
}
