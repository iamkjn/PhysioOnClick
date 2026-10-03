import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import { services } from '@/lib/site-data'

const slugSet = new Set(exercises.map((e) => e.slug))
const condSlugs = new Set(conditions.map((c) => c.slug))
const words = (s: string) => s.split(/\s+/).filter(Boolean)

describe('conditions', () => {
  it('has 12+ conditions, all with unique kebab-case slugs', () => {
    expect(conditions.length).toBeGreaterThanOrEqual(12)
    expect(new Set(conditions.map((c) => c.slug)).size).toBe(conditions.length)
    for (const c of conditions) expect(c.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
  it('every program stage references only real exercise slugs and is non-empty', () => {
    for (const c of conditions) {
      expect(c.program.length).toBeGreaterThanOrEqual(2)
      for (const st of c.program) {
        expect(st.exerciseSlugs.length).toBeGreaterThan(0)
        for (const s of st.exerciseSlugs) expect(slugSet.has(s), `${c.slug}/${s}`).toBe(true)
      }
    }
  })
  it('serviceSlug and relatedConditionSlugs resolve', () => {
    const svc = new Set(services.map((s) => s.slug))
    for (const c of conditions) {
      if (c.serviceSlug) expect(svc.has(c.serviceSlug), c.slug).toBe(true)
      for (const r of c.relatedConditionSlugs ?? []) expect(condSlugs.has(r), `${c.slug}->${r}`).toBe(true)
    }
  })
  it('every condition has intro, redFlags, recoveryTimeline, 3+ faqs, reviewedBy, reviewedOn', () => {
    for (const c of conditions) {
      expect(c.intro.trim().length).toBeGreaterThan(60)
      expect(c.redFlags.length).toBeGreaterThan(0)
      expect(c.recoveryTimeline.trim().length).toBeGreaterThan(10)
      expect(c.faqs.length).toBeGreaterThanOrEqual(3)
      expect(c.reviewedBy).toBe('Shivaliba Zala')
      expect(c.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
  it('every intro has the depth a condition hub needs', () => {
    for (const c of conditions) {
      expect(words(c.intro).length, `${c.slug} intro word count`).toBeGreaterThanOrEqual(220)
      expect(words(c.intro).length, `${c.slug} intro word count`).toBeLessThanOrEqual(320)
      // 3+ paragraphs, split on a blank line, as the hub page renders them.
      const paras = c.intro.split('\n\n').filter((p) => p.trim().length > 0)
      expect(paras.length, `${c.slug} intro paragraphs`).toBeGreaterThanOrEqual(3)
      expect(words(c.whoItHelps).length, `${c.slug} whoItHelps word count`).toBeGreaterThanOrEqual(40)
    }
  })
  it('every seoTitle fits the SERP and keeps the brand suffix', () => {
    for (const c of conditions) {
      expect(c.seoTitle.length, `${c.slug} seoTitle length`).toBeLessThanOrEqual(60)
      expect(c.seoTitle.endsWith(' | PhysioOnClick'), `${c.slug} seoTitle suffix`).toBe(true)
    }
  })
  it('every seoDescription fits the SERP snippet', () => {
    for (const c of conditions) {
      expect(c.seoDescription.length, `${c.slug} seoDescription length`).toBeGreaterThanOrEqual(120)
      expect(c.seoDescription.length, `${c.slug} seoDescription length`).toBeLessThanOrEqual(158)
    }
  })
  it('the programmes are untouched by copy passes', () => {
    // Snapshot of the Task 6 programme wiring - copy edits must not disturb it.
    expect(conditions.length).toBe(25)
    expect(conditions.reduce((n, c) => n + c.program.length, 0)).toBe(82)
    expect(
      conditions.reduce((n, c) => n + c.program.reduce((m, s) => m + s.exerciseSlugs.length, 0), 0),
    ).toBe(289)
  })
  it('no smart punctuation or non-Latin-1 characters', () => {
    const blob = JSON.stringify(conditions)
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
    for (const c of conditions) {
      for (const field of [c.intro, c.seoTitle, c.seoDescription, c.whoItHelps]) {
        expect(field, c.slug).not.toMatch(/[‘’“”–—…]/)
        expect(field, c.slug).not.toMatch(/[^\x00-\xFF]/)
      }
    }
  })

  it('urgentFlags are copy-clean and every item names 999 or A&E', () => {
    for (const c of conditions) {
      for (const flag of c.urgentFlags ?? []) {
        expect(flag, c.slug).toMatch(/999|A&E/)
        expect(flag, c.slug).not.toMatch(/[^\x00-\xFF]/)
      }
    }
  })
})

// SAFETY: the hub renders `redFlags` under "Get checked by a clinician first
// if" (non-urgent). Anything the NHS / NICE CKS routes to 999 or A&E must sit in
// `urgentFlags`, which renders in its own "Get urgent help now if" box.
describe('conditions emergency routing', () => {
  const byslug = (slug: string) => conditions.find((c) => c.slug === slug)!

  // Signs that NHS pages in docs/seo/phase-b-sources.md route to 999 / A&E.
  const EMERGENCY_SIGNS: RegExp[] = [
    /999|A&E/,
    /stroke|slurred speech|facial (?:droop|numbness)|drooping face/i,
    /meningitis|neck stiffness with fever|stiff neck/i,
    /chest (?:pain|tightness)|breathless/i,
    /both legs/i,
    /bladder or bowel control|bowel incontinence|controlling urine|saddle|genitals|back passage/i,
    /dislocat(?:ed|ion)/i,
  ]
  // Open clinical questions (Shivaliba) or routes the NHS keeps below 999/A&E;
  // these stay in the non-urgent list on purpose.
  const ALLOWED_IN_NON_URGENT = new Set<string>([
    // patellofemoral: NHS knee page routes knee problems to 111, not 999.
    'The kneecap has dislocated or partly slipped out of place',
    // shoulder: the stiffness history is not itself an emergency sign.
    'The stiffness began right after a fall, a dislocation or a heavy pull on the arm',
  ])

  it('no emergency sign is listed under the non-urgent red-flags heading', () => {
    for (const c of conditions) {
      for (const flag of c.redFlags) {
        if (ALLOWED_IN_NON_URGENT.has(flag)) continue
        for (const re of EMERGENCY_SIGNS) {
          expect(flag, `${c.slug}: "${flag}" matches ${re}`).not.toMatch(re)
        }
      }
    }
  })

  it('every condition carries the general infection line at A&E / NHS 111 urgency', () => {
    for (const c of conditions) {
      expect(c.urgentFlags ?? [], c.slug).toContain(
        'The area is hot, very swollen and red, especially if you also feel feverish or unwell - go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell.',
      )
      expect(c.redFlags.join(' '), c.slug).not.toMatch(/hot, very swollen and red/)
    }
  })

  it('neck pain routes meningitis and stroke signs exactly like the online physio page', () => {
    const urgent = (byslug('neck-pain').urgentFlags ?? []).join(' ')
    expect(urgent).toMatch(/meningitis, call 999 or go to A&E\. Do not drive yourself\./)
    expect(urgent).toMatch(/drooping face or trouble speaking \(possible stroke\)\. Do not drive yourself\./)
  })

  it('back and sciatica cauda equina signs route to 999 or A&E without driving', () => {
    for (const slug of ['low-back-pain', 'sciatica', 'stress-urinary-incontinence']) {
      const urgent = (byslug(slug).urgentFlags ?? []).join(' ')
      expect(urgent, slug).toMatch(/call 999 or go to A&E/i)
      expect(urgent, slug).toMatch(/Do not drive yourself/)
    }
  })

  it('clot signs with breathlessness or chest pain route to 999 or A&E', () => {
    for (const c of conditions) {
      const all = [...c.redFlags, ...(c.urgentFlags ?? [])].join(' ')
      if (!/clot/i.test(all)) continue
      expect((c.urgentFlags ?? []).join(' '), c.slug).toMatch(/breathlessness or chest pain - call 999 or go to A&E/)
    }
  })
})

describe('condition hubs: remaining explicit routes', () => {
  const c = (slug: string) => conditions.find((x) => x.slug === slug)!
  const urgent = (slug: string) => (c(slug).urgentFlags ?? []).join(' ')
  const nonUrgent = (slug: string) => c(slug).redFlags.join(' ')

  it('no duplicate hot-joint-with-fever line in the non-urgent box', () => {
    for (const x of conditions) {
      for (const flag of x.redFlags) {
        expect(/fever/i.test(flag) && /hot|swelling|swollen|redness|warmth/i.test(flag) && !/wound/i.test(flag), `${x.slug}: ${flag}`).toBe(false)
      }
    }
  })

  it('hip replacement dislocation goes to A&E, 999 if you cannot get there', () => {
    expect(urgent('after-hip-replacement')).toMatch(/possible dislocation - go to A&E, or call 999 if you cannot get there\. Do not drive yourself\./)
    expect(nonUrgent('after-hip-replacement')).not.toMatch(/dislocation/)
  })

  it('deformity and a numb, pale or cold foot go to A&E now', () => {
    expect(urgent('ankle-sprain')).toMatch(/deformity of the ankle or foot[^.]*- go to A&E now/)
    for (const slug of ['ankle-sprain', 'acl-rehabilitation', 'after-hip-replacement']) {
      expect(urgent(slug), slug).toMatch(/pale or feeling cold[^.]*- go to A&E now/)
      expect(nonUrgent(slug), slug).not.toMatch(/pale|feeling cold/)
    }
  })

  it('tendon ruptures go to an urgent treatment centre or A&E', () => {
    expect(urgent('achilles-tendinopathy')).toMatch(/Achilles rupture - go to an urgent treatment centre or A&E/)
    expect(urgent('patellar-tendinopathy')).toMatch(/tendon rupture - go to an urgent treatment centre or A&E/)
  })

  it('post-op wound infection routes to the surgical team, urgent GP or NHS 111', () => {
    for (const slug of ['after-knee-replacement', 'after-hip-replacement', 'after-acl-reconstruction']) {
      expect(nonUrgent(slug), slug).toMatch(/contact your surgical team, or ask for an urgent GP appointment or call NHS 111/)
    }
  })

  it('falls hub routes fast-worsening unsteadiness to NHS 111', () => {
    expect(nonUrgent('falls-prevention')).toContain('If unsteadiness is getting worse quickly over hours or days, call NHS 111.')
  })
})

