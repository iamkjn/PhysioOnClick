import Link from "next/link";
import { Fragment } from "react";

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Renders copy that may contain markdown-style `[label](/path)` links. Only
 *  site-relative targets become links; anything else (external, `//host`)
 *  renders as plain label text, so content data can't inject outbound links. */
export function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    const internal = href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\");
    parts.push(internal ? <Link key={start} href={href}>{label}</Link> : label);
    last = start + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
