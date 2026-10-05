"use client";

const BLOG_STORAGE_KEY = "pooc:saved-blogs";
const BLOG_CHANGE_EVENT = "pooc:saved-blogs-change";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function readList(key: string): string[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((value): value is string => typeof value === "string")),
    );
  } catch {
    return [];
  }
}

function broadcast(key: string, eventName: string, slugs: string[]): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    // Storage may be blocked in private browsers. The page should still work.
  }
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: slugs }));
  } catch {
    // Very old browsers only: ignore and rely on the next read.
  }
}

export function getSavedBlogs(): string[] {
  return readList(BLOG_STORAGE_KEY);
}

export function addSavedBlog(slug: string): string[] {
  const next = getSavedBlogs();
  if (!next.includes(slug)) next.push(slug);
  broadcast(BLOG_STORAGE_KEY, BLOG_CHANGE_EVENT, next);
  return next;
}

export function removeSavedBlog(slug: string): string[] {
  const next = getSavedBlogs().filter((item) => item !== slug);
  broadcast(BLOG_STORAGE_KEY, BLOG_CHANGE_EVENT, next);
  return next;
}

export function onSavedBlogsChange(cb: (slugs: string[]) => void): () => void {
  if (!hasWindow()) return () => {};

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    cb(
      Array.isArray(detail)
        ? detail.filter((value): value is string => typeof value === "string")
        : getSavedBlogs(),
    );
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== BLOG_STORAGE_KEY) return;
    cb(getSavedBlogs());
  };

  window.addEventListener(BLOG_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(BLOG_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
