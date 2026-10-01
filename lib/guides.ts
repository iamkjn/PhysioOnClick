// Editorial guides (SEO Phase B). Static data, rendered by app/guides/[slug].
//
// CLINICAL REVIEW GATE: this copy is drafted pending Shivaliba Zala's clinical
// sign-off and must not reach production before she approves
// docs/seo/phase-b-clinical-review.md. Dev site only until then.
//
// Rules for copy here (enforced by tests/lib/guides.test.ts):
//  - Facts and citation URLs come only from docs/seo/phase-b-sources.md.
//  - Our own prices use the tokens {INITIAL_PRICE} / {FOLLOW_UP_PRICE}; the
//    page swaps them via withPrices(). Market prices are written in words.
//  - Inline links use [label](/path) and must be site-relative.

import type { RelatedLink, Source } from "@/lib/content-types";

export type GuideSection = { heading: string; paragraphs: string[] };

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** Direct-answer paragraph shown in the callout box (40-70 words). */
  answer: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  sources: Source[];
  related: RelatedLink[];
  publishedOn: string;
  reviewedOn: string;
};

export const guides: Guide[] = [
  {
    slug: "private-physiotherapy-cost-uk",
    title: "How much does private physiotherapy cost in the UK?",
    seoTitle: "How Much Does Private Physio Cost in the UK? | PhysioOnClick",
    seoDescription:
      "What a private physio session costs in the UK, what changes the price, how online sessions compare, and ways to pay less, with sources and dates checked.",
    answer:
      "Most UK private physiotherapy appointments cost between about 44 and 125 pounds for a first session, depending on where you go, how long it lasts and whether it is in person or online. At PhysioOnClick, a 60-minute online assessment is {INITIAL_PRICE} and a 30-minute follow-up is {FOLLOW_UP_PRICE}.",
    sections: [
      {
        heading: "What changes the price of a physio session",
        paragraphs: [
          "There is no single national price for private physiotherapy. Clinics set their own fees, so the same type of appointment can cost quite different amounts from one provider to the next.",
          "The length of the session is part of this. Providers book 30, 45 or 60 minutes, so always compare the price for the time you get as well as the headline figure.",
          "The type of appointment matters too. In the prices we checked, a first assessment costs more than a follow-up with the same provider, and whether a session is in person or online is listed separately by some providers."
        ]
      },
      {
        heading: "Typical prices at named UK providers",
        paragraphs: [
          "To give you a real picture, we checked the public price pages of four UK providers on 1 October 2026. Prices change, so treat these as a snapshot and check the provider's own page before you book.",
          "Nuffield Health in Glasgow lists in-person physiotherapy for non-members at 72 pounds for a 45-minute initial assessment and 49 pounds for a 30-minute follow-up. Complete Physio, an online service, lists 125 pounds for a 45-minute new patient appointment, with follow-ups at 95 pounds for 30 minutes.",
          "PhysioFast Online lists 65 pounds for a 45-minute video appointment, which it suggests for a first visit, and 47 pounds for 30 minutes. Ascenti lists 44 pounds for a 30-minute online session.",
          "So first appointments in this sample run from 44 pounds for a short online session to 125 pounds for a longer online one. Prices vary widely, and the sessions are not identical, so compare like with like."
        ]
      },
      {
        heading: "What is included in a PhysioOnClick session",
        paragraphs: [
          "Our first appointment is a 60-minute online assessment by video, priced at {INITIAL_PRICE}. It covers your history, a guided movement assessment, a clear explanation of what is going on, and a plan you can start straight away.",
          "Follow-up appointments last 30 minutes and cost {FOLLOW_UP_PRICE}. We use them to check progress, adjust your exercises and answer questions as you recover.",
          "After a paid session you receive an invoice. You can see every price on the [pricing page](/pricing). If you want to know how a video appointment works in practice, read [how online physiotherapy works](/how-online-physiotherapy-works).",
          "Online physiotherapy is not right for everyone. If you have back pain with weakness or numbness in both legs, numbness around your genitals or anus, changes in your bladder or bowels, or if it started after a serious accident, you need emergency in-person care. Call 999 or go to A&E. We will also tell you plainly during your assessment if you need to be examined face to face."
        ]
      },
      {
        heading: "Ways to pay less for physiotherapy",
        paragraphs: [
          "Bundles. If you expect to need several sessions, we offer 4 and 8 session bundles, which are a block of sessions booked and paid for together. Work out which option suits you by comparing them with single sessions on the [pricing page](/pricing).",
          "NHS self-referral. Access to NHS musculoskeletal physiotherapy depends on your local health board, which decides whether you can refer yourself or need a referral from a GP. NHS Greater Glasgow and Clyde, for example, lets eligible adults refer themselves. The wait can be long, though. Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of musculoskeletal patients were seen within four weeks, against a target of 90%. Many people use the NHS for some needs and a private service when they want to be seen sooner.",
          "Health insurance. Some policies pay towards physiotherapy, often with conditions such as pre-authorisation or policy limits. Cover and rules vary, so check with your insurer before you book (see [claiming physiotherapy on health insurance](/guides/claim-physiotherapy-on-health-insurance)). We cannot promise that any insurer will pay.",
          "Doing the exercises matters as much as the number of sessions. A clear plan that you follow between appointments often means you need fewer visits overall."
        ]
      }
    ],
    faqs: [
      {
        q: "How much is a physio session in the UK?",
        a: "A typical private first appointment costs between about 44 and 125 pounds, based on the four providers we checked on 1 October 2026. Follow-ups are usually cheaper. Our own online assessment is {INITIAL_PRICE} and a follow-up is {FOLLOW_UP_PRICE}."
      },
      {
        q: "Is online physiotherapy cheaper than seeing a physio in person?",
        a: "Often, but not always. It depends on the provider. In the prices we checked, one online service charged more than an in-person clinic and another charged less. Compare the session length and what is included, not only the price."
      },
      {
        q: "Can I get physiotherapy on the NHS instead?",
        a: "It depends on your health board. Each board decides whether you can refer yourself or need a GP referral. NHS Greater Glasgow and Clyde, for example, lets eligible adults self-refer. Waiting times can be long, so some people choose private care to be seen sooner."
      },
      {
        q: "Do I need a GP referral to see a private physiotherapist?",
        a: "Many private physiotherapists, including us, accept self-referral. If you plan to claim on insurance, your insurer may have its own requirements, such as pre-authorisation, so check with them before you book."
      },
      {
        q: "Will I need more than one session?",
        a: "Many people do. A first assessment gives you an explanation of the problem and a plan, and follow-ups help you progress. How many you need depends on your problem, how long you have had it and how consistently you do the exercises."
      }
    ],
    sources: [
      {
        label: "Nuffield Health: Glasgow physiotherapy prices",
        url: "https://www.nuffieldhealth.com/physiotherapy/glasgow"
      },
      {
        label: "Complete Physio: online physiotherapy fees",
        url: "https://complete-physio.co.uk/online-physiotherapy/"
      },
      {
        label: "PhysioFast Online: appointment prices",
        url: "https://physiofastonline.co.uk/"
      },
      {
        label: "Ascenti: online appointments",
        url: "https://www.ascenti.co.uk/article/online-appointments"
      },
      {
        label: "Public Health Scotland: AHP musculoskeletal waiting times, data to 31 March 2026",
        url: "https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/"
      },
      {
        label: "NHS inform: how to access MSK services",
        url: "https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/how-to-access-msk-services/"
      },
      {
        label: "NHS Greater Glasgow and Clyde: self referral to adult MSK physiotherapy",
        url: "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/"
      }
    ],
    related: [
      { label: "Pricing and session bundles", href: "/pricing" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" }
    ],
    publishedOn: "2026-10-01",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  },
  {
    slug: "claim-physiotherapy-on-health-insurance",
    title: "Can I claim physiotherapy on my health insurance?",
    seoTitle: "Claim Physio on Health Insurance: What to Check | PhysioOnClick",
    seoDescription:
      "How physio insurance claims usually work, what Bupa, AXA Health, Vitality and Aviva say on their own sites, and what to check before you book and pay.",
    answer:
      "Check your policy first. Whether your insurer pays for physiotherapy depends on your cover, and your insurer may also want a referral, a pre-authorisation code or a practitioner on its recognised list. We are not on every insurer's recognised list, so check with your insurer before booking if you plan to claim.",
    sections: [
      {
        heading: "How a physio insurance claim usually works",
        paragraphs: [
          "Every insurer has its own rules, but most claims follow the same few steps. Doing them in this order can save you from paying for a session that is not covered.",
          "First, check that your policy includes outpatient therapies such as physiotherapy. Check whether it covers treatment outside hospital, and whether it caps the number of sessions or the amount you can claim in a year.",
          "Second, find out whether you need a GP referral or a pre-authorisation code before your first session. Some insurers let you go straight to a physiotherapist, and some do not.",
          "Third, ask whether the insurer only pays practitioners on its own recognised list. Check whether yours pays any registered physiotherapist, or only those on its list.",
          "Finally, pay for the session, keep the invoice, and send it to your insurer with your claim form. Ask how long the insurer allows for sending a claim in."
        ]
      },
      {
        heading: "What the main insurers say on their own sites",
        paragraphs: [
          "The wording below comes from each insurer's public pages, checked on 1 October 2026. Policies differ, so your own policy documents and your insurer's current pages come first.",
          "Bupa says its health insurance customers can get direct access to a muscle, bone and joint specialist, and that you don't need to wait for a GP referral. It also says treatment is approved with a pre-authorisation code, and that any onward referral is subject to the benefits and exclusions of your cover. Separately, Bupa's contract for physiotherapists says Bupa will not be obliged to fund physiotherapy performed without pre-authorisation.",
          "AXA Health says that with an AXA Health plan you can speak to a physio without the need for a GP referral. You use an online form, then set up a video or telephone call appointment. AXA Health also publishes criteria for individual physiotherapists to become recognised by it, including HCPC registration and electronic invoicing through Healthcode or another system it recognises.",
          "Vitality says members can self-refer for up to 6 physiotherapy sessions every plan year. That route is for face-to-face physiotherapy within its Priority Physio network. For a physiotherapist outside the network, Vitality says it covers sessions as long as the physiotherapist is recognised by it, and pays you back after you pay the invoice. For further sessions it asks for a detailed medical report from your treating physiotherapist.",
          "Aviva says physiotherapy might be included in your cover, depending on what your policy includes. Depending on the policy, the route can start with a referral from a GP or from its digital GP service, or with a specialist referral after a diagnosis. One optional Aviva feature means you only need a GP referral, not a specialist one, for up to 10 sessions per health condition."
        ]
      },
      {
        heading: "Are we on your insurer's recognised list?",
        paragraphs: [
          "We are not on every insurer's recognised list. Check with your insurer before booking if you plan to claim.",
          "We cannot promise that any insurer will pay for a session with us, and nothing on this page says that any insurer accepts our invoices. The simplest way to find out is to ask your insurer two questions: will you pay for online physiotherapy by video, and do you need the practitioner to be on your recognised list?",
          "If your insurer says yes to both, ask them to confirm whether we qualify before you book. Get the answer in writing if you can. If the answer is no, you can still book with us and pay yourself, and the invoice is yours to keep."
        ]
      },
      {
        heading: "What our invoice shows",
        paragraphs: [
          "After a paid session we send you an invoice as a PDF. It lists our HCPC registration number and the session you paid for, itemised, so you can see exactly what the charge covers.",
          "Insurers differ in what they want to see on an invoice, so send your insurer what it asks for. If your insurer asks for something that isn't on the invoice, contact us.",
          "You can check how our online sessions work in [how online physiotherapy works](/how-online-physiotherapy-works), and see what a first appointment costs on the [pricing page](/pricing). If you are deciding between private and NHS care, our guide on [whether you need a GP referral](/guides/do-i-need-a-gp-referral-for-physiotherapy) may help."
        ]
      }
    ],
    faqs: [
      {
        q: "Is physio covered by Bupa?",
        a: "Bupa says its health insurance customers can get direct access to a muscle, bone and joint specialist, with treatment approved by a pre-authorisation code and subject to the benefits and exclusions of your cover. Check your own policy, and ask Bupa whether the practitioner you want to see is eligible before you book."
      },
      {
        q: "Does my insurer need a GP referral for physio?",
        a: "It depends on the insurer and the policy. Bupa, AXA Health and Vitality each describe a route that does not need a GP referral for some members, while Aviva describes routes that can start with a GP referral. Ask your insurer which applies to you."
      },
      {
        q: "Does PhysioOnClick accept insurance?",
        a: "You pay us directly and we give you an invoice to claim with. We are not on every insurer's recognised list, and we cannot promise that any insurer will pay. Check with your insurer before booking if you plan to claim."
      },
      {
        q: "What does your invoice include?",
        a: "A PDF invoice with our HCPC registration number and an itemised line for the session you paid for. Send it to your insurer with your claim form if they ask for it."
      }
    ],
    sources: [
      {
        label: "Bupa: get treatment for muscle, bone and joint pain",
        url: "https://www.bupa.co.uk/health/health-insurance/get-treatment/muscle-bone-joint"
      },
      {
        label: "Bupa: terms and conditions for delivering physiotherapy to Bupa members",
        url: "https://www.bupa.co.uk/~/media/files/hcp/physio/physio-contract.pdf"
      },
      {
        label: "AXA Health: private physiotherapy",
        url: "https://www.axahealth.co.uk/health-insurance/muscles-bones-joints/"
      },
      {
        label: "AXA Health provider site: individual provider recognition",
        url: "https://provider.axahealth.co.uk/individual-provider-recognition/"
      },
      {
        label: "Vitality: private physiotherapy",
        url: "https://www.vitality.co.uk/health-insurance/core-cover/physiotherapy/"
      },
      {
        label: "Aviva: what is physiotherapy",
        url: "https://www.aviva.co.uk/health/health-products/health-insurance/knowledge-centre/what-is-physiotherapy/"
      },
      {
        label: "Aviva: health insurance optional add-ons",
        url: "https://www.aviva.co.uk/health/health-products/health-insurance/health-options/"
      }
    ],
    related: [
      { label: "Pricing", href: "/pricing" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" },
      { label: "Do I need a GP referral for physiotherapy?", href: "/guides/do-i-need-a-gp-referral-for-physiotherapy" }
    ],
    publishedOn: "2026-10-01",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  },
  {
    slug: "do-i-need-a-gp-referral-for-physiotherapy",
    title: "Do I need a GP referral for physiotherapy?",
    seoTitle: "Do I Need a GP Referral for Physiotherapy? | PhysioOnClick",
    seoDescription:
      "You do not need a GP referral for private physiotherapy. Here is how NHS self-referral works in Scotland and England, and when to see a GP first.",
    answer:
      "No. You can book private physiotherapy yourself without a GP referral. On the NHS it depends on where you live: in Scotland each health board decides whether you can self-refer or need a referral, and in many areas of England you can self-refer too. Some symptoms need a GP or emergency care first.",
    sections: [
      {
        heading: "Private physiotherapy: no referral needed",
        paragraphs: [
          "You can book a private physiotherapist directly. There is no need to see your GP first, and at PhysioOnClick you simply choose an appointment on the [booking page](/book).",
          "Physiotherapist is a protected title in the UK, so anyone using it has to be on the HCPC Register. That is the check that matters when you choose a private physio, rather than whether a GP sent you.",
          "There is one exception worth knowing about. If you plan to claim the cost back from health insurance, your insurer may have its own rules about referrals. Our guide to [claiming physiotherapy on health insurance](/guides/claim-physiotherapy-on-health-insurance) explains what to check."
        ]
      },
      {
        heading: "Referring yourself to the NHS in Scotland",
        paragraphs: [
          "NHS inform explains that your local health board decides how each musculoskeletal service is accessed. That means the answer depends on where you live: some boards let you refer yourself, and others ask for a referral from a GP or another professional.",
          "NHS Greater Glasgow and Clyde, for example, lets adults refer themselves to its musculoskeletal physiotherapy service. Adults can usually self-refer if they meet the criteria, so read the board's page before you apply.",
          "If you are not sure how your own board works, the NHS inform page links to every Scottish health board. Your GP practice can also tell you."
        ]
      },
      {
        heading: "Referring yourself to the NHS in England",
        paragraphs: [
          "The NHS sciatica page says that in many areas you may be able to get help from NHS community musculoskeletal services without a referral from a GP.",
          "The words many areas matter here. Services are run locally, so some places still ask for a GP referral. Search for your local musculoskeletal service, or ask your GP practice reception how to get seen."
        ]
      },
      {
        heading: "When to see a GP or get urgent help first",
        paragraphs: [
          "Most muscle and joint pain is not an emergency, and a physiotherapist is a sensible first step. A few symptoms are different, and for these a video appointment is not the right route.",
          "The NHS says to call 999 or go to A&E if you have back pain together with pain, tingling, weakness or numbness in both legs, a loss of feeling around your genitals or anus, or changes in your bladder or bowels. It gives the same advice if your back pain started after a serious accident, or comes with chest pain. The NHS also says not to drive yourself to A&E.",
          "Other signs mean it is worth speaking to a GP rather than waiting. The NHS says to see a GP for neck pain that does not go away after a few weeks, or comes with pins and needles or a cold arm. It says the same for heel pain that has not improved within 2 weeks. For sudden, very bad shoulder pain, or severe hip pain that starts without a fall or injury, it says to get urgent help from a GP or by calling 111.",
          "We screen for these things during your first appointment. If we think you need to be examined face to face, or need a GP or emergency care, we will tell you plainly and will not keep you in an online plan that is not the right fit."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I see a private physiotherapist without a referral?",
        a: "Yes. You can book a private physiotherapist yourself. If you plan to claim on health insurance, check your insurer's rules, because some ask for a referral or a pre-authorisation code."
      },
      {
        q: "Can I refer myself to NHS physiotherapy in Scotland?",
        a: "It depends on your health board. Each board decides whether you can self-refer or need a referral from a GP or another professional. NHS Greater Glasgow and Clyde, for example, lets eligible adults refer themselves."
      },
      {
        q: "Can I refer myself to NHS physiotherapy in England?",
        a: "In many areas you can get help from NHS community musculoskeletal services without a GP referral, but not everywhere. Check your local service or ask your GP practice."
      },
      {
        q: "Which symptoms mean I should not wait for physiotherapy?",
        a: "With back pain, weakness or numbness in both legs, numbness around your genitals or anus, changes in your bladder or bowels, or pain after a serious accident, call 999 or go to A&E. Do not book a video appointment for these."
      }
    ],
    sources: [
      {
        label: "NHS inform: how to access MSK services",
        url: "https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/how-to-access-msk-services/"
      },
      {
        label: "NHS Greater Glasgow and Clyde: self referral to adult MSK physiotherapy",
        url: "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/"
      },
      { label: "NHS: sciatica", url: "https://www.nhs.uk/conditions/sciatica/" },
      { label: "NHS: back pain", url: "https://www.nhs.uk/conditions/back-pain/" },
      { label: "NHS: neck pain", url: "https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/" },
      { label: "NHS: plantar fasciitis", url: "https://www.nhs.uk/conditions/plantar-fasciitis/" },
      { label: "NHS: shoulder pain", url: "https://www.nhs.uk/symptoms/shoulder-pain/" },
      { label: "NHS: hip pain in adults", url: "https://www.nhs.uk/symptoms/hip-pain/" },
      { label: "HCPC: professions and protected titles", url: "https://www.hcpc-uk.org/about-us/who-we-regulate/the-professions/" }
    ],
    related: [
      { label: "Book an online appointment", href: "/book" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" },
      { label: "Claim physiotherapy on health insurance", href: "/guides/claim-physiotherapy-on-health-insurance" }
    ],
    publishedOn: "2026-10-01",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  },
  {
    slug: "how-many-physiotherapy-sessions-do-i-need",
    title: "How many physiotherapy sessions will I need?",
    seoTitle: "How Many Physio Sessions Will I Need? | PhysioOnClick",
    seoDescription:
      "Honest ranges for how many physiotherapy sessions people need, what speeds up progress, when it is fine to stop, and how our session bundles work.",
    answer:
      "It depends on your problem. At PhysioOnClick most plans run 4 to 8 sessions across 6 to 10 weeks, with exercises to do on your own in between. Many people start to feel a change within 2 to 3 weekly sessions. Longer-standing problems and recovery after surgery usually take longer.",
    sections: [
      {
        heading: "Typical ranges by situation",
        paragraphs: [
          "There is no single number that fits everyone. How many sessions you need depends on how long the problem has been there, what is causing it, and how well it responds to the first few weeks of exercise.",
          "For most back, neck, shoulder and tendon pain, our plans usually run 4 to 8 sessions across 6 to 10 weeks. In our experience of these problems, pain on the movements that used to trigger it often starts to ease within 2 to 3 weekly sessions, once the right movement and loading plan is in place.",
          "For persistent tendon problems and long-standing pain, our plans build up the load gradually over 6 to 8 weeks, so we review and adjust the plan at each session.",
          "After surgery the timeline is set mainly by the operation. Our service guidance puts knee and hip replacement at roughly 3 to 6 months to confident daily function, rotator cuff repair at 4 to 6 months, and ACL reconstruction at 9 to 12 months to full sports clearance. These are recovery timelines, not session counts, and your surgical team's advice always comes first.",
          "For neurological conditions, progress builds in small steps. Better balance confidence within a few weeks is common, with gains in everyday movement building over 8 to 12 weeks of regular practice."
        ]
      },
      {
        heading: "What the NHS says about timescales",
        paragraphs: [
          "The NHS gives some useful reference points. Back pain often improves on its own within a few weeks, and sciatica usually gets better in a few weeks to a few months.",
          "For shoulder pain, the NHS suggests trying shoulder exercises for 6 to 8 weeks. Frozen shoulder can stay painful and stiff for months, and physiotherapy for it usually lasts at least 6 weeks. For tennis elbow, it suggests physiotherapy may help if symptoms have not improved after 6 weeks of home treatment.",
          "These are general guides rather than promises. If your problem is not behaving like the usual pattern, that is a good reason to book a review rather than keep waiting."
        ]
      },
      {
        heading: "What speeds up progress",
        paragraphs: [
          "The biggest factor is what you do between sessions. In our plans we ask you to do a short routine of exercises between appointments, and our [exercise library](/exercises) has videos and instructions you can follow at home.",
          "We start with a clear explanation of what is going on, so that you know why each exercise is in your plan.",
          "Tell us what is hard to do, and we will adjust the plan so that it fits into your week."
        ]
      },
      {
        heading: "When it is fine to stop",
        paragraphs: [
          "You can stop when you can do the things you came for, such as walking, lifting, sleeping or playing sport, and you know what to do if it flares up. You do not need to keep booking sessions once you are there.",
          "If you are not improving after the first few weeks, or things are getting worse, tell us. We may change the plan, or advise you to see a GP or someone who can examine you in person.",
          "Some people book a single follow-up after a few weeks to check they are on track. That is a sensible way to use a short appointment."
        ]
      },
      {
        heading: "Single sessions and bundles",
        paragraphs: [
          "You can pay for each session as you go, or book one of our 4 or 8 session bundles. A bundle is a block of sessions booked and paid for together.",
          "A bundle is a convenience, not a discount, so compare it with single-session prices on the [pricing page](/pricing) before you choose. If you are unsure how many sessions you will need, starting with a first assessment lets you decide after you have a plan."
        ]
      }
    ],
    faqs: [
      {
        q: "How many physio sessions do I need for back pain?",
        a: "It varies. Most of our plans for back, neck, shoulder and tendon pain run 4 to 8 sessions across 6 to 10 weeks. The NHS says back pain often improves on its own within a few weeks, and sciatica usually gets better in a few weeks to a few months."
      },
      {
        q: "Is one physio session enough?",
        a: "Possibly. A first session gives you an explanation and a plan to follow yourself. If the problem has lasted a long time, or you want your plan adjusted as you improve, follow-ups can help."
      },
      {
        q: "How long does recovery after surgery take?",
        a: "It depends on the operation. Typical arcs are 3 to 6 months for knee and hip replacement, 4 to 6 months for rotator cuff repair and 9 to 12 months to full sports clearance after ACL reconstruction. Follow your surgeon's guidance."
      },
      {
        q: "Do session bundles save money?",
        a: "No. Bundles are a convenient block of 4 or 8 sessions, not a discount, so compare them with single-session prices on our pricing page."
      }
    ],
    sources: [
      { label: "NHS: back pain", url: "https://www.nhs.uk/conditions/back-pain/" },
      { label: "NHS: sciatica", url: "https://www.nhs.uk/conditions/sciatica/" },
      { label: "NHS: shoulder pain", url: "https://www.nhs.uk/symptoms/shoulder-pain/" },
      { label: "NHS: frozen shoulder", url: "https://www.nhs.uk/conditions/frozen-shoulder/" },
      { label: "NHS: tennis elbow", url: "https://www.nhs.uk/conditions/tennis-elbow/" }
    ],
    related: [
      { label: "Pricing and session bundles", href: "/pricing" },
      { label: "Exercise library", href: "/exercises" },
      { label: "Musculoskeletal physiotherapy", href: "/services/musculoskeletal-physiotherapy" }
    ],
    publishedOn: "2026-10-01",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  },
  {
    slug: "nhs-physio-waiting-times-scotland",
    title: "NHS physiotherapy waiting times in Scotland",
    seoTitle: "NHS Physio Waiting Times in Scotland, Explained | PhysioOnClick",
    seoDescription:
      "What the latest Public Health Scotland figures say about NHS musculoskeletal waits, what the four-week standard means, and what to do while you wait.",
    answer:
      "Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of musculoskeletal patients were seen within four weeks. The Scottish Government target is at least 90%. At 31 March 2026, 75,128 patients were waiting. These figures cover allied health professional services, not physiotherapy alone.",
    sections: [
      {
        heading: "What the latest figures show",
        paragraphs: [
          "Public Health Scotland published its latest report on allied health professional musculoskeletal waiting times on 23 June 2026, with data to 31 March 2026. Allied health professional services include physiotherapy, but also other professions, so the figures do not describe physiotherapy on its own.",
          "Between August 2025, when new guidance took full effect for completed waits, and March 2026, on average 52.4% of patients were seen within four weeks. This figure counts patients who have already been seen.",
          "At 31 March 2026, there were 75,128 patients waiting to be seen. A separate figure, 36.5%, covers people who were still waiting rather than those already seen, and it is a different measure from the 52.4%. We do not mix the two here, and you should be careful if you see them side by side elsewhere."
        ]
      },
      {
        heading: "What the four-week standard means",
        paragraphs: [
          "The Scottish Government target is that at least 90% of patients should wait no longer than four weeks to be seen. The 52.4% figure sits well below that.",
          "A target is a standard to aim for, not a promise about your own wait. Your wait could be shorter or longer than the average, and it can vary between health boards and between services. Your own board will have the most useful local information."
        ]
      },
      {
        heading: "How to refer yourself",
        paragraphs: [
          "NHS inform explains that each health board decides how its musculoskeletal services are accessed. Some boards allow self-referral, while others ask for a referral from a GP or another professional.",
          "NHS Greater Glasgow and Clyde, for example, lets adults refer themselves to its musculoskeletal physiotherapy service. Adults can usually self-refer if they meet the criteria, so check the board's page for the details before you apply.",
          "If your board does not offer self-referral, your GP practice can refer you."
        ]
      },
      {
        heading: "What to do while you wait",
        paragraphs: [
          "Staying gently active usually helps. NHS advice on back pain is to keep moving, and it often improves within a few weeks.",
          "Our free [exercise library](/exercises) has step-by-step exercises you can try at home. If you want to check how well you are moving, our [self-tests](/exercises/tests) give you a simple way to measure change over time.",
          "If your symptoms get worse while you wait, do not wait for your appointment. For back pain with weakness or numbness in both legs, numbness around your genitals or anus, or changes in your bladder or bowels, call 999 or go to A&E. For other worrying changes, speak to your GP or call 111."
        ]
      },
      {
        heading: "Going private is an option",
        paragraphs: [
          "Some people use the NHS for some needs and book a private service when they want to be seen sooner. That is a personal choice. If you are already on an NHS waiting list, ask your health board whether you can stay on it while you see someone privately.",
          "PhysioOnClick offers video appointments with a physiotherapist, and you do not need a referral. Online care does not suit every problem, and we will tell you if you need to be seen in person. See [how online physiotherapy works](/how-online-physiotherapy-works) and the [pricing page](/pricing) to decide whether it suits you."
        ]
      }
    ],
    faqs: [
      {
        q: "How long is the NHS physiotherapy wait in Scotland?",
        a: "Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of musculoskeletal patients were seen within four weeks. Your own wait depends on your health board and service."
      },
      {
        q: "What is the target for NHS musculoskeletal waits in Scotland?",
        a: "The Scottish Government target is that at least 90% of patients should wait no longer than four weeks to be seen."
      },
      {
        q: "Can I refer myself to NHS physiotherapy in Scotland?",
        a: "It depends on your health board. NHS Greater Glasgow and Clyde, for example, lets eligible adults self-refer. Other boards may ask for a referral from a GP or another professional."
      },
      {
        q: "What can I do while I wait to be seen?",
        a: "Stay gently active, try the exercises in our free exercise library, and get urgent help if your symptoms change. Back pain with weakness or numbness in both legs, numbness around your genitals or anus, or bladder or bowel changes needs 999 or A&E."
      }
    ],
    sources: [
      {
        label: "Public Health Scotland: AHP musculoskeletal waiting times, data to 31 March 2026",
        url: "https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/"
      },
      {
        label: "NHS inform: how to access MSK services",
        url: "https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/how-to-access-msk-services/"
      },
      {
        label: "NHS Greater Glasgow and Clyde: self referral to adult MSK physiotherapy",
        url: "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/"
      },
      { label: "NHS: back pain", url: "https://www.nhs.uk/conditions/back-pain/" }
    ],
    related: [
      { label: "Exercise library", href: "/exercises" },
      { label: "Self-tests", href: "/exercises/tests" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" }
    ],
    publishedOn: "2026-10-01",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  }
];

export function getGuide(slug: string): Guide | null {
  return guides.find((g) => g.slug === slug) ?? null;
}

export function allGuideSlugs(): string[] {
  return guides.map((g) => g.slug);
}
