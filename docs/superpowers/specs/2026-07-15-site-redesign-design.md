# PhysioOnClick full-site design pass — spec

**Date:** 2026-07-15
**Goal:** Elevate the whole site (public pages, patient portal, admin) to a premium, coherent "$10k agency" standard in one day.

## Decisions (agreed with Manthan)

- **Scope:** everything — public marketing pages, patient portal, admin dashboard.
- **Visual direction:** Direction A — *Refined Clarity*. Keep the committed Clarity palette (sky `#0EA5E9` accent, warm paper `#F6F3EC`, DM Serif Display + DM Sans, dark teal rail). Invest in typography scale, spacing rhythm, hierarchy, and component consistency rather than a reskin.
- **Flaw list:** built by audit (dev server walkthrough + code review), not from a pre-existing list.
- **Finish line:** polished and verified locally on the dev server; deploy is a later, separate decision.
- **Execution:** manager + small crew of Sonnet subagents; work split by surface, foundation done before surfaces to avoid conflicts.

## Phases

- **Phase 0 — Audit.** Run dev server, walk every route (desktop + mobile). Parallel code audits: one agent on public pages/components, one on portal + admin. Review the three uncommitted files (`globals.css`, `layout.tsx`, `chat-widget.tsx`) — keep what's good, drop experiments. Output: single prioritized flaw list.
- **Phase 1 — Foundation.** One pass on `app/globals.css` design tokens and shared primitives: type scale, spacing rhythm, shadows, radii usage, button/card/form styles, header + footer. Done serially — everything else depends on it.
- **Phase 2 — Public pages.** Home, services, pricing, blog, contact, book, glasgow-physiotherapist, policies. Split across 2–3 agents by page group (disjoint files).
- **Phase 3 — Portal + admin.** Same component language applied to `app/patient/` and `app/admin/`; hierarchy, empty/loading states. 1–2 agents.
- **Phase 4 — Verify.** Browser sweep of every page at desktop + mobile, console clean, `npm run build` and `npm run test:run` pass.

## Constraints

- No palette change; derive any new colour from the Clarity rules documented in `globals.css`.
- Accessibility floors already encoded in `globals.css` comments (AA contrast mixes) must not regress.
- No new dependencies. No backend/logic changes — this is a design pass.
- Deployment target is Cloudflare Workers via OpenNext; nothing may break `npm run build`.

## Non-goals

- New features, content rewrites, SEO restructuring, mobile app, Firebase changes, deploy.
