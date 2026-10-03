# SEO Phase B/C go-live checklist

Run this after Shivaliba Zala has signed off `docs/seo/phase-b-clinical-review.md`. Nothing on this branch may reach production before then. Work from the worktree `/Users/iamkjn/Documents/Playground/.worktrees/seo-phase-b` (branch `feat/seo-phase-b`) until step 6.

## 1. Apply the clinical corrections

1. Apply each of Shivaliba's corrections to `lib/guides.ts` and `lib/online-physio-pages.ts` (copy rules: `.git/worktrees/seo-phase-b/sdd/global-constraints.md` and `content-lessons.md`).
2. Where a correction changes a fact, update `docs/seo/phase-b-sources.md` in the same commit.
3. Regenerate the review pack so it matches the final copy, and commit it.
4. `npx vitest run tests/lib/guides.test.ts tests/lib/online-physio-pages.test.ts tests/lib/structured-data.test.ts`

## 2. Set the sign-off date

1. Edit `lib/clinical-signoff.ts` and set `PHASE_BC_REVIEWED_ON` to the real sign-off date (YYYY-MM-DD). It drives bylines, JSON-LD `lastReviewed` and sitemap `lastModified` for every guide and landing page.
2. `npx vitest run tests/lib/clinical-signoff.test.ts`
3. Commit: `git commit -am "content: record clinical sign-off date"`

## 3. Re-check external facts

1. Competitor prices in the choosing guide: Nuffield Health Glasgow, Complete Physio, PhysioFast Online, Ascenti. Source URLs and last-checked date are in the "Competitor re-verification" entry of `docs/seo/phase-b-sources.md`. If any price moved, change the guide copy and the entry.
2. NHS pages with a past review date: `grep -n "last reviewed\|next review" docs/seo/phase-b-sources.md`. Re-open each page. Known: the NHS neck pain page's next-review date (27 April 2026) has passed and the content was unchanged on 2026-10-03. Never make routing less urgent than the NHS page.
3. Update the "checked" dates in the fact sheet and commit.

## 4. Merge origin/master

1. `git fetch origin`
2. `git merge origin/master` (resolve conflicts; re-run the sitemap and analytics registry tests afterwards).
3. Verify:
   ```
   npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"      # must print nothing
   npm run lint
   npx vitest run tests 2>&1 | grep -E "^ *×|Tests "
   ```
4. Only these 11 known failures are allowed: body-chart; booking-flow (x2); exercise-library-interactive (x2); start-session-flow-status; condition-hub "from" price; exercise-page dose string; checkout-create (x3). Anything else is a regression.

## 5. Deploy dev and verify the 25 URLs

1. Deploy to the dev site using the dev deploy procedure (dev Firebase project, test Stripe keys).
2. List the 25 paths (1 guides index + 9 guides + 15 landing pages), derived from data:
   ```
   node -e 'const fs=require("fs");const s=(f)=>[...fs.readFileSync(f,"utf8").matchAll(/^    slug: "([^"]+)"/gm)].map(m=>m[1]);const u=["/guides",...s("lib/guides.ts").map(x=>"/guides/"+x),...s("lib/online-physio-pages.ts").map(x=>"/online-physiotherapy-for/"+x)];console.log(u.join("\n"));console.error(u.length+" urls")'
   ```
3. Check every one returns 200:
   ```
   BASE=https://<dev-host>; node -e '...(as above)...' 2>/dev/null | while read p; do echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE$p) $p"; done
   ```
4. Spot-check one page of each kind in a browser: byline date equals the sign-off date, prices come from site-data, 999/111 routing block is present.

## 6. Merge to master and push

1. Confirm the branch first: `git branch --show-current` (a parallel session can switch branches in the main checkout).
2. From the main checkout, with a clean tree: `git checkout master && git pull --ff-only && git merge --no-ff feat/seo-phase-b && git push origin master`
3. Note: a push to master may trigger Cloudflare git auto-build, which builds without `NEXT_PUBLIC_*` and breaks booking. Check the Cloudflare dashboard and roll back immediately if it deploys.

## 7. Build and deploy PROD (fresh worktree only)

Never build prod from a worktree with a symlinked `node_modules` (it 500s the whole Worker). Use a fresh worktree with real modules.

```
cd /Users/iamkjn/Documents/Playground
git fetch origin
git worktree add .worktrees/prod-release origin/master --detach
cd .worktrees/prod-release
npm ci
cp /Users/iamkjn/Documents/Playground/.env.production .env.production
npx wrangler deployments list        # record the CURRENT version id first (rollback target)
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

- Make sure no `.env.local` exists and no emulator flags are set.
- Write the previous version id in the release notes. Rollback (the owner runs it): `npx wrangler rollback <id> -y`
- Coordinate first: other Claude sessions also deploy prod. Check with them (and `git log origin/master -3`) so you do not overwrite a newer deploy.

## 8. Verify live

1. All 25 URLs return 200 (step 5 loop with `BASE=https://physioonclick.co.uk`).
2. Sitemap includes them: `curl -s https://physioonclick.co.uk/sitemap.xml | grep -c "<loc>"` (compare with the count before this release plus 25), and `grep -c localhost` on it is 0.
3. No localhost anywhere: `for p in / /guides /pricing; do curl -s https://physioonclick.co.uk$p | grep -c localhost; done` all 0.
4. `/pricing` shows £120 and £225.
5. `/exercises` contains "All exercises by body area".
6. `/embed` returns 200.
7. Booking slots return 200: `curl -s -o /dev/null -w '%{http_code}\n' "https://physioonclick.co.uk/api/cal/slots?..."` (use the same query the booking page makes).
8. Remove the temporary worktree when done: `git worktree remove .worktrees/prod-release`.

## 9. Search Console

1. In Search Console, URL Inspection, request indexing for the top pages first: `/online-physiotherapy-for/sciatica`, `/online-physiotherapy-for/low-back-pain`, `/online-physiotherapy-for/neck-pain`, `/online-physiotherapy-for/knee-replacement-rehab`, `/online-physiotherapy-for/stroke-rehabilitation`, `/guides`, and the choosing guide.
2. Resubmit `sitemap.xml`.
3. Re-check indexing after about a week.
