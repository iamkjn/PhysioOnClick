// components/saved-blogs-section.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonRow } from "@/components/skeleton";

interface SavedBlog {
  id: string;
  title: string;
  category: string;
}

export function SavedBlogsSection({ uid }: { uid: string }) {
  const [blogs, setBlogs] = useState<SavedBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    const q = query(
      collection(db, "patients", uid, "favoriteBlogs"),
      orderBy("savedAt", "desc")
    );
    getDocs(q)
      .then((snap) => {
        setBlogs(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedBlog))
        );
      })
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <SkeletonRow count={3} />;

  if (blogs.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ margin: 0, color: "#5E7A84" }}>
          No saved articles yet. Star a blog article to add it here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {blogs.map((b) => (
        <div
          key={b.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <span style={{ color: "#E0A106", fontSize: 18, lineHeight: 1 }}>★</span>
          <div>
            <strong style={{ display: "block", fontSize: 14, color: "#0C2A38" }}>
              {b.title}
            </strong>
            {b.category && (
              <span style={{ fontSize: 12, color: "#5E7A84" }}>{b.category}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
