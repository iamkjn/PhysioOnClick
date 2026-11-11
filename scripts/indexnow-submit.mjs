#!/usr/bin/env node
// Tells Bing (and the other IndexNow engines) about every URL in the live
// sitemap, so new or changed pages are picked up in days rather than weeks.
// ChatGPT's search draws on Bing's index, so this is also how pages reach it.
//
// Usage, after a live deploy:  node scripts/indexnow-submit.mjs
// Optional: pass specific URLs instead of the whole sitemap.
//
// The key is the public/<key>.txt file (IndexNow's ownership proof): the file
// name and its contents are the same 32-character key. It is meant to be
// public. Protocol: https://www.indexnow.org/documentation
import { readdirSync, readFileSync } from "node:fs";

const HOST = "physioonclick.co.uk";
const keyFile = readdirSync(new URL("../public/", import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file (public/<32 hex>.txt) found.");
const key = readFileSync(new URL(`../public/${keyFile}`, import.meta.url), "utf8").trim();

let urls = process.argv.slice(2);
if (urls.length === 0) {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
urls = urls.filter((u) => new URL(u).host === HOST);
if (urls.length === 0) throw new Error("No URLs to submit.");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls.slice(0, 10000) }),
});
// 200 = accepted, 202 = accepted, key check pending. Anything else is a problem.
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URLs`);
if (res.status !== 200 && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
