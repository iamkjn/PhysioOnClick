# Glasgow Citations Sheet — PhysioOnClick

Source of truth: `lib/structured-data.ts` (PRACTICE_PHONE), `lib/site-data.ts` (invoiceIssuer, pricing), `lib/home-visit-pricing.ts` (video price + £15 travel). Use this block **character-for-character** on every listing.

## 1. Canonical NAP

```
PhysioOnClick
7 Springfield Gardens, Glasgow G31 4HS
07557 684395  (+44 7557 684395)
https://physioonclick.co.uk
```
- Service-area business: **hide the street address** wherever the platform allows; show service areas instead.
- Service areas: Glasgow (G1–G53), Paisley (PA1–PA3), Hamilton (ML3); video physiotherapy UK-wide.
- Practitioner: Shivaliba Zala, HCPC-registered physiotherapist, HCPC no. **PH155757**.
- Prices: initial assessment £40 (video) / £55 (home visit = video price + £15 travel).
- Hours: copy exactly from the GBP profile — do not invent.

### Description (≤750 chars)
PhysioOnClick is a Glasgow physiotherapy practice run by Shivaliba Zala, an HCPC-registered physiotherapist (PH155757). We offer home-visit physiotherapy across Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3), and video physiotherapy anywhere in the UK. We help with back, neck, shoulder, knee and tendon pain, sports injuries, post-operative rehab and neurological rehabilitation. Every patient gets a full assessment, a clear explanation of what is going on, and a personalised exercise plan you can follow in our app. Initial assessment £40 by video or £55 at home. Book online in minutes and pay securely; insurance-ready receipts are provided so you can claim from your insurer.

### Description (≤250 chars)
HCPC-registered physiotherapist offering home visits across Glasgow, Paisley and Hamilton, plus video physio UK-wide. Back, neck, sports and neuro rehab. Initial assessment from £40. Book online.

> Before posting, confirm every condition named (esp. neuro rehab, post-op) appears on the live site; trim any that don't.

### Categories (use the closest available on each platform)
Primary: **Physiotherapist**. Secondary (only if offered): Physical therapy clinic / Sports injury clinic / Rehabilitation service / Home health care service. Do not use "Chiropractor", "Osteopath", "Massage therapist" or "Hospital".

## 2. Directory priority list

Legend — Cost: Free / Paid / Membership. Hide addr: Y = address can be hidden (SAB), N = must show address, ? = not confirmable without signing up. **Verified 2026-10-06** column: `200` = URL loaded; `403-bot` = site live but blocks scripted checks (open in a browser); notes say what was confirmed by search. No accounts were created.

| ☐ | # | Directory | Sign-up URL | Cost | Hide addr | Verified 2026-10-06 | Notes |
|---|---|---|---|---|---|---|---|
| ☐ | 1 | Bing Places | https://www.bing.com/forbusiness/ | Free | Y | 200 (bingplaces.com redirects here) | Import from GBP; feeds Copilot/ChatGPT local answers |
| ☐ | 2 | Apple Business Connect | https://business.apple.com | Free | N for Maps place card | 200 (businessconnect.apple.com redirects here) | Maps listing needs a location; SABs can use the no-public-location brand path (Branded Mail etc.) instead. Don't publish the street address |
| ☐ | 3 | HCPC register (check) | https://www.hcpc-uk.org/check-the-register/ | Free | n/a | 200 | Not a listing — link to PH155757 result as trust proof |
| ☐ | 4 | CSP Physio2u directory | https://www.csp.org.uk/public-patient/find-physiotherapist (directory: https://mbf.csp.org.uk/physio2u, member login) | **Membership (CSP)** | Y | 200 (old /find-physio URL 404'd — fixed) | Members only; add home-visit + video |
| ☐ | 5 | Physio First | https://www.physiofirst.org.uk | **Membership (Physio First)** | ? | 403-bot | Members-only finder; only if membership held |
| ☐ | 6 | Facebook Page | https://www.facebook.com/pages/create | Free | Y | 200 | Set as service-area; enable reviews |
| ☐ | 7 | Yell | https://www.yell.com/free-listing/ | Free (paid upgrades) | Y | 403-bot | Decline upsell calls |
| ☐ | 8 | Thomson Local | https://www.thomsonlocal.com | Free basic | ? | 403-bot | |
| ☐ | 9 | Scoot | https://www.scoot.co.uk/add-listing | Free basic | ? | 200 (operating, Newfold/Web.com-owned) | Syndicates to partner sites |
| ☐ | 10 | FreeIndex | https://www.freeindex.co.uk/signup.htm | Free | Y | 200 | Strong reviews; service-area option |
| ☐ | 11 | Cylex UK | https://www.cylex-uk.co.uk | Free | ? | 403-bot | |
| ☐ | 12 | Hotfrog UK | https://www.hotfrog.co.uk | Free | ? | 403-bot | |
| ☐ | 13 | Yelp UK | https://biz.yelp.co.uk | Free | Y | 403-bot | Service-area businesses supported |
| ☐ | 14 | Nextdoor Business | https://business.nextdoor.com | Free | Y | 200 (redirects to /en-us/; UK supported) | Neighbourhood recommendations in G-postcodes |
| ☐ | 15 | Trustpilot (claim) | https://business.trustpilot.com | Free | n/a | 200 | Already collecting reviews — make sure profile NAP matches |
| ☐ | 16 | Doctify | https://www.doctify.com/uk | Free/Paid tiers | ? | 200 (practitioner sign-up path not public; use "For practitioners" link on site) | Lists physios; HCPC verification |
| ☐ | 17 | Top Doctors UK | https://www.topdoctors.co.uk | Paid / invite | ? | 200 | Skews consultant-level; low priority |
| ☐ | 18 | Foursquare | https://app.foursquare.com/venue/claim | Free | ? | 200 | Feeds many apps/data aggregators |
| ☐ | 19 | 192.com Business | https://www.192.com/business | Free basic | ? | 403-bot | UK data aggregator |

**Removed (2026-10-06):** old rows 18–19 placeholders. findaphysio.co.uk is a parked domain (redirects to a lander); no genuine free physio-finder accepting SAB listings was verified. Glasgow-specific directories found (bizhub365, find-open, npn.org.uk, WhatClinic) are aggregator/clinic-premises sites of unclear value — not added; revisit only if one shows real traffic.

**Order of work:** 1, 2, 6, 13, 10, 7 (free, high-trust) → 3 linked on site → 4/5 only if membership held → rest.

**Rules:** no NHS listings (private practice); never list as a clinic with premises; record login email + date in this sheet's checkbox column; don't create a second listing if one already exists — claim it.
