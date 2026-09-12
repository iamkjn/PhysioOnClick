# PhysioOnClick — service & blog cover image prompt sheet

_Generated 2026-09-12, matching the style used for the 174-exercise illustration library (`docs/exercise-image-prompt-sheet.md`)._

## How to use this

- One image per entry. Save with the id given (e.g. `service-musculoskeletal-physiotherapy.png`, `blog-back-pain.png`) — filenames match what `serviceImagePath()` / the blog cover route expect once you wire the real image in.
- Square-ish, roughly **1200 x 800** (landscape works better than square for hero/cover use — say so to the model, e.g. "16:10 landscape").
- **Do not ask for any logo, wordmark, or caption** — the site overlays its own heading text on these.
- Brand palette (Clarity System): warm paper background `#FBF7F0`-ish, navy ink `#043246`, single sky-blue accent `#0EA5E9` graded down for legibility. Keep it to that palette — no unrelated colours.
- Services get one considered, realistic-illustration hero each (they're permanent, high-traffic pages — worth the polish). Blogs are prompted **per category** (9 categories cover all 108 templated articles) rather than one-off per article, since the articles within a category share a topic and a one-off image per post would be 108 near-duplicates for templated content anyway ([[project_blog_noindex_deliberate]]).
- Keep the **same illustration style and figure treatment across the whole set** so the services grid and the blog index both read as one coherent system.

---

# Part 1 — Service page hero images (6)

_Style: warm, human, editorial-illustration (not clinical-textbook like the exercise library) — a calm telehealth moment, one person on a video call with a physio, soft warm paper background, navy outlines, sky-blue accent used sparingly (a UI glow, a highlight line), no text, no logo, no stock-photo sheen._

### `service-musculoskeletal-physiotherapy` — Musculoskeletal Physiotherapy

```
Warm editorial illustration, soft flat colour with gentle shading, a person sitting at a home desk on a laptop video call gently rotating their shoulder while a physiotherapist on the screen watches and gestures with a coaching motion, a subtle glowing outline around the shoulder joint in sky-blue (#0EA5E9) showing where the movement is being assessed, warm paper background (#FBF7F0), navy (#043246) linework, calm and reassuring mood, no text, no logo, no watermark, landscape 16:10 composition with the figure slightly left of centre
```

### `service-post-surgical-rehabilitation` — Post-Surgical Rehabilitation

```
Warm editorial illustration, soft flat colour with gentle shading, a person recovering from knee surgery doing a gentle guided leg-raise on a supportive chair at home during a laptop video call, a small progress-milestone motif (three soft dots, one filled in sky-blue #0EA5E9) floating near the screen suggesting staged recovery, warm paper background (#FBF7F0), navy (#043246) linework, encouraging and steady mood, no text, no logo, no watermark, landscape 16:10 composition
```

### `service-neurological-rehabilitation` — Neurological Rehabilitation

```
Warm editorial illustration, soft flat colour with gentle shading, a person practising a supported standing balance exercise beside a chair at home, a family member nearby offering light support, a laptop open nearby showing a physiotherapist guiding the session, one sky-blue (#0EA5E9) balance-arc motif beneath the person's feet, warm paper background (#FBF7F0), navy (#043246) linework, patient and supportive mood, no text, no logo, no watermark, landscape 16:10 composition
```

### `service-paediatric-physiotherapy` — Paediatric Physiotherapy

```
Warm editorial illustration, soft flat colour with gentle shading, a parent and child playing a simple balance-and-reach game on a living room rug, guided by a physiotherapist visible on a nearby tablet screen, a playful sky-blue (#0EA5E9) star or dot trail showing the child's reaching movement, warm paper background (#FBF7F0), navy (#043246) linework, light and playful mood, no text, no logo, no watermark, landscape 16:10 composition
```

### `service-gait-and-mobility-assessment` — Gait & Mobility Assessment

```
Warm editorial illustration, soft flat colour with gentle shading, a person walking a short indoor path in a hallway with a phone propped up on a small stand filming their stride, a sky-blue (#0EA5E9) dotted footstep-path motif on the floor showing the walking line being assessed, warm paper background (#FBF7F0), navy (#043246) linework, focused and confident mood, no text, no logo, no watermark, landscape 16:10 composition
```

### `service-online-rehab-programmes` — Online Rehab Programmes

```
Warm editorial illustration, soft flat colour with gentle shading, a person at a home desk with a laptop showing a simple weekly exercise plan / calendar UI, a small stack of exercise cards and a phone with a progress-tracking chart nearby, one sky-blue (#0EA5E9) upward progress line motif, warm paper background (#FBF7F0), navy (#043246) linework, organised and motivating mood, no text, no logo, no watermark, landscape 16:10 composition
```

---

# Part 2 — Blog category cover images (9)

_Style: same warm editorial-illustration family as the services above, but simpler and more iconic — one clear visual metaphor per category rather than a full scene, since these run small as list thumbnails. Keep the same figure/linework treatment as Part 1 so blog and service art feel like one family._

### `blog-back-pain` — Back pain

```
Warm editorial illustration, soft flat colour, a simple side-profile figure standing tall doing a gentle standing back-extension stretch, hands supporting the lower back, one sky-blue (#0EA5E9) glowing arc along the lower spine showing the area of focus, warm paper background (#FBF7F0), navy (#043246) linework, minimal and calm, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-knee-injuries` — Knee injuries

```
Warm editorial illustration, soft flat colour, a simple figure seated doing a gentle straight-leg raise with a small cushion under the knee, one sky-blue (#0EA5E9) glowing outline around the knee joint, warm paper background (#FBF7F0), navy (#043246) linework, minimal and calm, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-shoulder-rehab` — Shoulder rehab

```
Warm editorial illustration, soft flat colour, a simple figure raising one arm in a slow overhead reaching motion, one sky-blue (#0EA5E9) glowing arc tracing the arm's arc of movement above the shoulder, warm paper background (#FBF7F0), navy (#043246) linework, minimal and calm, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-sciatica` — Sciatica

```
Warm editorial illustration, soft flat colour, a simple side-profile standing figure with a thin sky-blue (#0EA5E9) line tracing gently from the lower back down the back of one leg, suggesting nerve-path awareness without looking clinical or alarming, warm paper background (#FBF7F0), navy (#043246) linework, minimal and calm, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-sports-injuries` — Sports injuries

```
Warm editorial illustration, soft flat colour, a simple figure mid-stride in a light jog, relaxed and confident posture, one sky-blue (#0EA5E9) motion-trail arc behind the trailing leg, warm paper background (#FBF7F0), navy (#043246) linework, minimal and energetic, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-neurological-conditions` — Neurological conditions

```
Warm editorial illustration, soft flat colour, a simple standing figure beside a supportive chair, one hand resting lightly on the chair back, a sky-blue (#0EA5E9) balance-arc motif beneath the feet, warm paper background (#FBF7F0), navy (#043246) linework, minimal, patient and supportive mood, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-post-surgery-recovery` — Post-surgery recovery

```
Warm editorial illustration, soft flat colour, a simple seated figure doing a gentle guided movement with a soft knee or shoulder support visible, three small progress dots nearby with one filled in sky-blue (#0EA5E9), warm paper background (#FBF7F0), navy (#043246) linework, minimal and encouraging, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-home-exercise-advice` — Home exercise advice

```
Warm editorial illustration, soft flat colour, a simple figure on a mat at home doing a gentle floor exercise (e.g. bridge or bird-dog position), a laptop open nearby showing a video call, one sky-blue (#0EA5E9) accent highlight on the working muscle area, warm paper background (#FBF7F0), navy (#043246) linework, minimal and homely, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

### `blog-workplace-ergonomics` — Workplace ergonomics

```
Warm editorial illustration, soft flat colour, a simple figure at a home desk correcting their posture, sitting upright with a laptop raised to eye level, one sky-blue (#0EA5E9) glowing outline along the upright spine showing the corrected posture line, warm paper background (#FBF7F0), navy (#043246) linework, minimal and clear, no text, no logo, no watermark, landscape 16:10 composition, generous empty space around the figure for a heading overlay
```

---

## Notes

- If you want per-article variety within a category instead of one shared cover, reuse the category prompt and swap only the action clause (the bit after "a simple figure...") — the topic column in `lib/blog.ts` (Recovery planning, Exercise pacing, Morning stiffness, etc.) gives a natural set of variants to rotate through.
- These are meant to slot in the same way the exercise illustrations did: generate the PNGs, review, then point `service.image` / the blog cover route at the real files instead of the current generated SVGs in `lib/service-image-svg.ts` / `lib/blog-image-svg.ts`.
