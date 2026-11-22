# 16 new exercises: clinical review sheet

Prepared 22 November 2026 from the Codex expansion pack in this folder. For Shivaliba to review.

**Status: draft, dev site only.** The new exercises (ex-172 to ex-187) appear on
dev.physioonclick.co.uk once deployed there. Each page shows a "Draft - awaiting clinical review"
notice and says "Not yet reviewed" instead of the usual reviewed by-line. A prod build leaves all
16 out of every page, search, the sitemap, PDFs and the admin plan picker. Nothing goes live until
each one is signed off.

## What was checked

- **Duplicates.** Codex audited an older branch with 174 exercises. Re-checked against the current
  catalogue (178, including ex-168 to ex-171): none of the 16 duplicates an existing movement.
  Closest existing records, kept separate: ex-44 grip, ex-45 tendon glides, ex-60 ankle alphabet,
  ex-61 resisted eversion, ex-63 straight-knee calf stretch, ex-68 assisted Nordic, ex-158
  Copenhagen, ex-19/20/33 thoracic, ex-117/125/150 breathing, face-pucker.
- **Write-ups.** Every record has setup, steps, cues, common mistakes ending in a "Stop and message
  your physio if..." line, a starting dose, "what it works" anatomy (marked draft) and plain-language
  search names. Wording is original; NHS and hospital leaflets were used as references only.
- **Images.** All 16 Codex illustrations were inspected. Rejected originals were not used. The
  landscape thumb image (ex-174) was trimmed and padded to a square with the whole hand kept.

## Images: two need fixing or explicit sign-off

| Exercise | Image | Note |
|---|---|---|
| ex-172 Controlled Jaw Opening | **Fix** | Tongue lies low on the lower teeth. The technique needs the tongue tip on the roof of the mouth. Regenerate, or approve knowingly. |
| ex-185 Seated Thoracic Extension | **Fix** | Head tipped right back, eyes on the ceiling. The text says keep the head in line with the upper back. Regenerate with a neutral neck, or approve knowingly. |
| ex-179 Resisted Ankle Inversion | OK, check | Shows lying on the back (top-down view), so the text says lying, with sitting as an alternative. Confirm the band reads as anchored on the outside and the turn is at the ankle, not the hip. |
| ex-180 Resisted Ankle Dorsiflexion | OK, check | Shading sits on the outer front of the shin; confirm it reads as tibialis anterior. |
| ex-186 Gaze Stabilisation (VOR x1) | OK, check | Target looks further than arm's length; text says "about an arm's length away or at the distance your physio has set". |
| All other 11 | OK | Match the written technique. |

Correction prompts for Codex, if regenerating:

- ex-172: "Same illustration and framing. Mouth opened a small way, the tip of the tongue visibly
  touching the roof of the mouth just behind the upper front teeth (tongue raised, not lying on the
  lower teeth). Jaw central. Small downward arrow by the chin. No text."
- ex-185: "Same seated chair-back extension. Keep the head and neck in line with the upper back,
  eyes looking forwards or only slightly up - do not tip the head back. Arms crossed on the chest.
  Small range. No text."

## Per exercise: what to confirm

Dose is a conservative starting point unless stated; "notes" can be shortened or changed.

- **ex-172 Controlled Jaw Opening** (Jaw; new "Jaw" browse area, dev only). NHS Forth Valley TMJ.
  6 reps, 3 times a day, building to 6 times a day (source: 6 x 6). Confirm: no finger guidance
  on the jaw; "only after a dentist or physio has checked your jaw".
- **ex-173 Thumb Opposition** (Hand). Berkshire thumb OA + UH Sussex hand OA. 5 rounds, 3 s
  touches, twice a day, build to 10. Confirm: index-to-little order (matches the image); thumb
  middle-knuckle cue; recent hand surgery line.
- **ex-174 Thumb Palmar Abduction** (Hand). Berkshire + UH Sussex. 5 reps, 3 s hold, twice a day.
  Confirm: no resistance until physio advises.
- **ex-175 Finger Spread and Close** (Hand). UH Sussex supports the topic, not this exact
  table-top movement. Confirm the movement itself.
- **ex-176 Short Foot Exercise** (Ankle & foot). UW Medicine foot core. 10 reps, 5 s hold, twice
  a day (hold time is our choice). No flat-foot correction claim. Confirm the standing progression.
- **ex-177 Toe Yoga** (Ankle & foot). UW Medicine. 10 rounds, twice a day. Confirm hand assistance
  while learning.
- **ex-178 Seated Plantar Fascia Stretch** (Ankle & foot). CUH plantar fasciitis. 30 s x 3, twice
  a day, before first steps. Confirm the towel alternative and the "feel the band under your thumb" cue.
- **ex-179 Resisted Ankle Inversion** (Ankle & foot). UHS factsheet 3961 + North Cheshire and
  Mersey (the UCSF protocol in sources.json blocked access). 2 x 12, 4 days a week, build to 3 x 15.
  Confirm: start lighter than ex-61; the tibialis posterior "after assessment" line.
- **ex-180 Resisted Ankle Dorsiflexion** (Ankle & foot). Same sources. 2 x 12, 4 days a week.
  Confirm the new-foot-drop / worsening-weakness warning is strong enough.
- **ex-181 Calf Stretch (Soleus)** (Ankle & foot). CUH + DynamicHealth. 30 s x 3, twice a day
  (same as ex-63). Confirm the insertional Achilles caution.
- **ex-182 Hamstring Heel Dig Hold** (Knee area, hamstring). Utah Health. 10 x 5 s, twice a day.
  Confirm crook lying (Utah describes sitting) and the "pop, large bruising, suspected tear" screen.
- **ex-183 Prone Hamstring Curl with Band** (Knee area, hamstring). Healthwise zm5028 (the Hartford
  link failed; Kaiser hosts the same article). 2 x 10, 3 days a week. Confirm the post-op clearance line.
- **ex-184 Adductor Squeeze** (Hip & groin). Berkshire groin strain leaflet BH1165h (Feb 2026; the
  old link in sources.json is a 404). 10 x 5 s, twice a day, build to 20. Confirm the red-flag screen.
- **ex-185 Seated Thoracic Extension** (Upper back). CUH thoracic exercises (reps left blank there).
  5 x 3 s, twice a day. Confirm the osteoporosis-with-fracture / recent fall / unexplained chest pain screen.
- **ex-186 Gaze Stabilisation (VOR x1)** (Balance & falls). ANPT patient card + 2022 CPG. **No dose
  set**: "your vestibular physiotherapist will set...". Confirm: who-it-is-for wording (assessed
  vestibular hypofunction only, not undiagnosed dizziness, not BPPV); add the ANPT "symptoms lasting
  more than 20 minutes" figure?; horizontal turns only (the card also has up/down); 999 stroke-sign line.
  Consider whether this belongs on a public page at all, or only in patient plans.
- **ex-187 Pursed-Lip Breathing** (General fitness & pain). CUH breathing techniques. 5 minutes a
  day of calm practice plus use as needed (no source schedule). Confirm "as if about to whistle"
  (CUH uses a candle-flicker image) and that it is clear it is not emergency treatment.

## Not changed (proposals only)

Existing condition programmes were left exactly as they are. Possible additions once signed off:

- hamstring-strain: ex-182 in "Settle", ex-183 in "Build strength".
- ankle-sprain and chronic-ankle-instability: ex-179 and ex-180 in "Build strength".
- achilles-tendinopathy: ex-181 alongside ex-63, mid-portion only.

The 30 new condition hubs in `category-plan.md` (TMD, thumb and hand OA, plantar heel pain, groin
pain, thoracic stiffness, vestibular, COPD and the specialist topics) are **not built yet**. Most
of these 16 exercises have no hub until those exist.

## Source links to fix in sources.json

- `groin`: 404. Current leaflet: https://www.berkshirehealthcare.nhs.uk/media/w13npqcr/bh1165h-groin-strain-v1-feb-2026.pdf
- `curl`: TLS error. Same article: https://healthy.kaiserpermanente.org/health-wellness/health-encyclopedia/he.zm5028
- `ankleband`: UCSF PDF returns 403 to automated fetches.

## Release steps (after sign-off)

1. In `lib/exercises-expansion-2026-11-22.ts`, for each approved record delete `draft: true` and
   add `reviewedOn: "<sign-off date>"`. In `lib/exercise-anatomy/entries/expansion-2026-11-22.ts`
   set its `status: "approved"`. Leave unapproved ones as drafts.
2. If ex-172 is approved, remove `draft: true` from the `jaw` area in `lib/body-areas.ts`.
3. Upload the images to **prod** Storage before deploying (create-only; refuses to overwrite):
   `npx tsx --env-file=.env.production scripts/upload-exercise-images-expansion-2026-11-22.ts --src=output/imagegen/physioonclick-expansion-2026-11-22 --upload --bucket=<prod bucket>`
   Replace any regenerated image in the script's list with its new file and hash first.
4. Update the catalogue counts in the tests (178 published), run the suite, deploy from a fresh
   worktree of origin/master, and check each new page shows its real image.

Rollback: revert the commit; the uploaded Storage objects are new files only (listed by the
upload script) and can be deleted without touching existing images.
