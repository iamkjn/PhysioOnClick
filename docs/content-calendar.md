# Blog Content Calendar — 2 articles/week

**Goal**: consistent, genuinely high-quality publishing cadence so Google sees regular updates — explicitly quality over quantity. Every entry below is hand-authored, standalone content, never routed through `lib/blog.ts`'s combinatorial `categoryInfo`/`topicInfo`/`articleSections()` system (that machinery is reserved for the original 36 articles it was built for — reusing it for new content risks recreating the thin/duplicate-content problem that got the blog noindexed once already, see `[[project_blog_noindex_deliberate]]`).

Each new article must include: real clinical specificity (mechanism, assessment, red flags, home guidance), "online physiotherapy for X" framing in title/H1/meta (matching the Sep 15 retitling fix), author byline (Shivaliba Zala, HCPC PH155757), computed `readTime`, a `lastReviewedAt` of the actual writing date, and a `category` reusing an existing `Category` value so internal linking to services keeps working. Source keyword research: `physioonclick.co.uk-audit/findings/keywords.md`.

## Status

| Week of | Topic 1 | Topic 2 | Status |
|---|---|---|---|
| 2026-09-27 | Frozen shoulder — "online physiotherapy for frozen shoulder" | ACL reconstruction — "online physio after ACL surgery" | In progress |
| 2026-10-04 | Tennis elbow — "video physio consultation for tennis elbow" | Hip replacement — "remote rehab after hip replacement" | Backlog |
| 2026-10-11 | Runner's knee — "online physio for runner's knee" | Ankle sprain — "video physio consultation for ankle sprain" | Backlog |
| 2026-10-18 | Rotator cuff / shoulder surgery — "online physiotherapy after shoulder surgery" | Achilles tendinopathy — "online physiotherapy for tendonitis" | Backlog |
| 2026-10-25 | Posture assessment — "online posture assessment UK" | Gait analysis — "remote gait analysis physiotherapy" | Backlog |
| 2026-11-01 | Hip pain (non-surgical) — "online physiotherapy for hip pain" | Neck pain — "video physio consultation for neck pain" | Backlog |

Beyond week 6: revisit `findings/keywords.md` Clusters 4-6 for more candidates (sports injury/gym injury, recovery-tracking angle, neuro/paediatric — lower priority, lower volume) rather than reusing any topic above.

## Process each week

1. Pick the next 2 topics from this table (or re-derive from `findings/keywords.md` once this list runs out).
2. Write each as a fully standalone `BlogArticle` object appended directly to the exported array in `lib/blog.ts` — do not touch `articlePlan`/`categoryInfo`/`topicInfo`.
3. Verify: `npm run lint`, `npm run test:run`, `npm run build` — confirm the new slugs appear in the static blog paths and in `app/sitemap.ts` output (it reads from the same exported array, so this should be automatic — verify, don't assume).
4. Commit, deploy, then request indexing on the new URLs in Search Console once live (same pattern as the Sep 2026 crawler-block recovery work).
5. Update the Status column in this table.

## Why this file exists

So a future session doesn't have to re-derive the keyword gap analysis from scratch each week — the backlog is already prioritized and ready to hand to a writing pass.
