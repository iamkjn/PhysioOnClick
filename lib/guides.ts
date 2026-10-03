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
import { PHASE_BC_REVIEWED_ON } from "@/lib/clinical-signoff";

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
      "At the four UK providers we checked, prices ranged from 44 pounds (a 30-minute online session) to 125 pounds (a first appointment), depending on where you go, how long it lasts and whether it is in person or online. At PhysioOnClick, a 60-minute assessment is {INITIAL_PRICE} and a 30-minute follow-up is {FOLLOW_UP_PRICE}, by video or as a home visit in the Glasgow area.",
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
          "Doing the exercises matters as much as the number of sessions. In our plans, we ask you to do your exercises between appointments, and we review progress as we go."
        ]
      }
    ],
    faqs: [
      {
        q: "How much is a physio session in the UK?",
        a: "At the four providers we checked on 1 October 2026, prices ranged from 44 pounds (a 30-minute online session) to 125 pounds (a first appointment). In the prices we checked, follow-ups cost less than first appointments. Our own online assessment is {INITIAL_PRICE} and a follow-up is {FOLLOW_UP_PRICE}."
      },
      {
        q: "Is online physiotherapy cheaper than seeing a physio in person?",
        a: "It depends on the provider. In the prices we checked, one online service charged more than an in-person clinic and another charged less. Compare the session length and what is included, not only the price."
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
    reviewedOn: PHASE_BC_REVIEWED_ON
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
    reviewedOn: PHASE_BC_REVIEWED_ON
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
    reviewedOn: PHASE_BC_REVIEWED_ON
  },
  {
    slug: "how-many-physiotherapy-sessions-do-i-need",
    title: "How many physiotherapy sessions will I need?",
    seoTitle: "How Many Physio Sessions Will I Need? | PhysioOnClick",
    seoDescription:
      "Honest ranges for how many physiotherapy sessions people need, what speeds up progress, when it is fine to stop, and how our session bundles work.",
    answer:
      "It depends on your problem. At PhysioOnClick most plans run 4 to 8 sessions across 6 to 10 weeks, with exercises to do on your own in between. We review progress after 2 to 3 sessions and adjust the plan. Longer-standing problems and recovery after surgery usually take longer.",
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
    reviewedOn: PHASE_BC_REVIEWED_ON
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
    reviewedOn: PHASE_BC_REVIEWED_ON
  }
  ,
  {
    slug: "does-online-physiotherapy-work",
    title: "Does online physiotherapy work?",
    seoTitle: "Does Online Physiotherapy Work? The Evidence | PhysioOnClick",
    seoDescription:
      "Is online physio as good as in person? What a knee osteoarthritis trial and a review of musculoskeletal studies found, who it suits, and who needs a clinic.",
    answer:
      "For some problems, the evidence says yes. A 2024 trial in adults with knee osteoarthritis found video physiotherapy was non-inferior to in-person care for pain and function, and a review of musculoskeletal studies found live video care appears comparable. That does not cover every condition, so we check suitability before you start.",
    sections: [
      {
        heading: "What a major knee trial found",
        paragraphs: [
          "One key piece of evidence is the PEAK trial, published in The Lancet in 2024. It enrolled 394 adults with chronic knee pain consistent with osteoarthritis, recruited from 27 clinics in Australia. About half had in-person consultations and about half had video consultations with a physiotherapist.",
          "Both groups had five consultations over three months, covering strengthening exercise, physical activity and education. The researchers measured knee pain and physical function at three months. They concluded that video physiotherapy was non-inferior to in-person care for both pain and function, which means it did not do meaningfully worse.",
          "The study also looked at safety. Adverse events were similar between the groups, and none were serious."
        ]
      },
      {
        heading: "What the trial does not tell us",
        paragraphs: [
          "PEAK studied adults with knee osteoarthritis, in Australia. It does not tell us that video care works equally well for every condition, every person or every stage of recovery, and we do not claim that it does.",
          "We use it as one good piece of evidence for a common problem, not as proof for everything. PEAK studied knee osteoarthritis, not knee pain in general. If that is your problem, our [musculoskeletal physiotherapy service](/services/musculoskeletal-physiotherapy) is the closest match to what was tested."
        ]
      },
      {
        heading: "What a wider review found",
        paragraphs: [
          "A 2017 systematic review in Clinical Rehabilitation pulled together 13 studies with 1,520 people in total. It looked at real-time telerehabilitation for musculoskeletal conditions, such as joint and muscle problems, and found it appears effective and comparable to conventional delivery for physical function and pain.",
          "In that review, treatment given only by telerehabilitation was equivalent to face-to-face care for physical function. Pain improvement was comparable between groups.",
          "There is a caveat. The studies were few and varied a lot from one to the next. So the honest summary is that live video care appears comparable for musculoskeletal problems, not that it is proven to be."
        ]
      },
      {
        heading: "What UK professional guidance says",
        paragraphs: [
          "The Chartered Society of Physiotherapy supports a personalised, flexible mix of remote and in-person physiotherapy. It also says a mix works because remote care will not suit everyone, and in-person care is sometimes the better choice.",
          "NHS England's guide to remote consultations in adult musculoskeletal physiotherapy describes remote care as suitable for people who do not need an in-person physical examination, or who have less complex problems. It says that where diagnostic tests might be needed, suitability should be carefully considered.",
          "In other words, the question is not whether online or in-person is better in general. It is which suits you and your problem."
        ]
      },
      {
        heading: "Who online physiotherapy tends to suit",
        paragraphs: [
          "The guidance supports remote care for people who do not need an in-person physical examination or who have less complex problems. In our own approach, that usually means people whose main need is assessment, explanation and a progressive exercise plan, and who can set up a safe space at home to move in. See [how online physiotherapy works](/how-online-physiotherapy-works) for what a session involves.",
          "In our sessions you go through the exercises in your own home, with a physiotherapist watching and correcting your technique."
        ]
      },
      {
        heading: "Who may need in-person care instead",
        paragraphs: [
          "Some problems need to be seen and handled in person. That includes red-flag symptoms, suspected fractures, recent serious injury, and problems where hands-on treatment is the main thing needed. Our [guide to what online physiotherapy cannot do](/guides/what-online-physiotherapy-cannot-do) goes through each of these and what to do instead.",
          "If you are unsure how to read a symptom, the NHS pages for your problem list the signs that need urgent help. For anything that feels like an emergency, call 999 or go to A&E rather than booking an appointment."
        ]
      },
      {
        heading: "How we decide at triage",
        paragraphs: [
          "Before we treat anyone, we ask about your symptoms, your history and your goals, and check whether video care is suitable. In our service, if something suggests you need a different route, we tell you plainly and point you to your GP, urgent care or an in-person clinician instead of keeping you in an online plan that is not the right fit.",
          "That approach matches CSP guidance that safe remote services need good triage and a way to refer people for in-person assessment when they need it. You can see our [assessment and pricing](/pricing) before you decide to book, and you can [book an appointment](/book) when you are ready."
        ]
      }
    ],
    faqs: [
      {
        q: "Is online physio as good as in person?",
        a: "For knee osteoarthritis, one large trial found video care non-inferior to in-person care for pain and function. A review of musculoskeletal studies found live video care appears comparable. This does not apply to every condition, so suitability is checked first."
      },
      {
        q: "Does online physiotherapy work for back pain or shoulder pain?",
        a: "The trial we cite was in knee osteoarthritis only. The wider review covered musculoskeletal conditions in general and found video care appears comparable. We assess your individual problem and tell you if video is not suitable."
      },
      {
        q: "Is video physiotherapy safe?",
        a: "In the PEAK trial, adverse events were similar between video and in-person groups, and none were serious. Safe remote care also needs good triage and clear routes to in-person help, which is how we work."
      },
      {
        q: "Will I be told if I need to be seen in person?",
        a: "Yes. If triage or your assessment suggests video is not right for you, we say so plainly and point you towards your GP, urgent care or an in-person clinician."
      }
    ],
    sources: [
      {
        label: "Hinman et al, The Lancet 2024: PEAK telerehabilitation vs in-person trial (Europe PMC)",
        url: "https://europepmc.org/article/MED/38461844"
      },
      {
        label: "Cottrell et al, Clinical Rehabilitation 2017: telerehabilitation for musculoskeletal conditions (Europe PMC)",
        url: "https://europepmc.org/article/MED/27141087"
      },
      {
        label: "CSP: remote consultations guidance for your practice",
        url: "https://www.csp.org.uk/professional-clinical/professional-guidance/remote-consultations/csp-guidance"
      },
      {
        label: "NHS England: guide to adopting remote consultations in adult MSK physiotherapy services",
        url: "https://www.england.nhs.uk/long-read/guide-to-adopting-remote-consultations-in-adult-musculoskeletal-physiotherapy-services/"
      }
    ],
    related: [
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" },
      { label: "What online physiotherapy cannot do", href: "/guides/what-online-physiotherapy-cannot-do" },
      { label: "Can a physio diagnose over video?", href: "/guides/can-a-physio-diagnose-over-video" }
    ],
    publishedOn: "2026-10-01",
    reviewedOn: PHASE_BC_REVIEWED_ON
  },
  {
    slug: "can-a-physio-diagnose-over-video",
    title: "Can a physiotherapist diagnose you over video?",
    seoTitle: "Can a Physio Diagnose You Over Video? | PhysioOnClick",
    seoDescription:
      "What a video physiotherapy assessment can and cannot establish: your history, guided movement tests, when imaging or a hands-on exam is needed, and self-checks.",
    answer:
      "A physiotherapist can often form a working clinical picture over video, using your history and guided movement tests, and build a plan from it. Video cannot replace a hands-on examination or imaging when those are needed. If your problem is unclear or needs tests, we tell you and point you to the right next step.",
    sections: [
      {
        heading: "What a video assessment is made of",
        paragraphs: [
          "A good physiotherapy assessment starts with listening. We ask when your problem began, what makes it better or worse, what you have tried, your health history and what you want to get back to doing. This part works the same way on video as in a clinic.",
          "Then comes the movement part. We watch how you move, which is something a camera does well when it is set up properly."
        ]
      },
      {
        heading: "Guided movement tests",
        paragraphs: [
          "On video we can guide you through simple tests and watch the result. Examples include how far you can bend or turn, how you rise from a chair, how you balance on one leg, how you walk, or how a joint moves as you lift or reach.",
          "We ask you to place your camera so we can see your whole body, and we talk you through each step. Many of these checks are ones you can also try yourself. Our free [self-tests](/exercises/tests) let you measure how you are moving and see change over time."
        ]
      },
      {
        heading: "What video cannot establish",
        paragraphs: [
          "Some things need hands. In our assessments, we cannot feel for swelling or tenderness, test muscle strength against resistance, or check how a joint feels when we move it for you. That needs an in-person examination.",
          "Video also cannot show what is happening inside the body. We cannot confirm things like a fracture or a tear from a video call, and we do not claim to."
        ]
      },
      {
        heading: "What the guidance says about uncertain cases",
        paragraphs: [
          "NHS England's guide to remote consultations in adult musculoskeletal physiotherapy says remote care is suitable for people who do not need an in-person physical examination. It also says that where diagnostic tests may be needed, suitability of a remote consultation should be carefully considered, because remote examination may lead to imaging being requested more often than needed, especially in complex or uncertain cases.",
          "The Chartered Society of Physiotherapy adds that safe remote services need good triage and urgent referral routes for in-person assessment or investigation."
        ]
      },
      {
        heading: "When imaging or a hands-on exam is needed",
        paragraphs: [
          "If something about your story or your movement suggests a problem that needs a scan, a blood test or a hands-on examination, we will say so and suggest you see your GP or an in-person clinician. We do not order scans ourselves, and we would rather send you on than guess.",
          "For low back pain, NICE advises that imaging is not routinely offered in a non-specialist setting, with or without sciatica. That guideline covers back pain only."
        ]
      },
      {
        heading: "Red flags come first",
        paragraphs: [
          "Some symptoms need urgent in-person care and not a video appointment. For back pain, the NHS says to call 999 or go to A&E if you have pain, tingling, weakness or numbness in both legs, a loss of feeling around your genitals or anus, changes in your bladder or bowels, or if it started after a serious accident.",
          "If you have symptoms like these, do not book a video session. Get emergency help first."
        ]
      },
      {
        heading: "Is a working diagnosis enough?",
        paragraphs: [
          "In our assessments, a clear history plus guided movement testing is often enough for us to explain what is likely going on and start a plan of exercises and advice. We treat this as a working clinical picture that we keep checking as you respond.",
          "If you are not improving as expected, or new symptoms appear, we revisit the picture and may suggest in-person review. You can read more about the limits in our [guide to what online physiotherapy cannot do](/guides/what-online-physiotherapy-cannot-do), or see [how online physiotherapy works](/how-online-physiotherapy-works)."
        ]
      }
    ],
    faqs: [
      {
        q: "Can a physiotherapist diagnose me over video?",
        a: "A physiotherapist can often form a working clinical picture from your history and guided movement tests. Video cannot replace a hands-on examination or imaging when those are needed, and we tell you when that is the case."
      },
      {
        q: "Will I need a scan?",
        a: "For low back pain, NICE advises against routinely offering imaging in a non-specialist setting. For other problems, if your history or movement suggests a scan or other test is needed, we point you to your GP or an in-person clinician."
      },
      {
        q: "What equipment do I need for a video assessment?",
        a: "A phone, tablet or computer with a camera and a space where we can see you move. We guide you on camera placement during the session."
      },
      {
        q: "Can I check how I am moving before I book?",
        a: "Yes. Our free self-tests in the exercise library let you try simple movement checks at home and track change over time."
      }
    ],
    sources: [
      {
        label: "NHS England: guide to adopting remote consultations in adult MSK physiotherapy services",
        url: "https://www.england.nhs.uk/long-read/guide-to-adopting-remote-consultations-in-adult-musculoskeletal-physiotherapy-services/"
      },
      {
        label: "CSP: how to ensure remote consultation services are safe",
        url: "https://www.csp.org.uk/professional-clinical/professional-guidance/remote-consultations/csp-guidance-2"
      },
      {
        label: "NICE NG59: low back pain and sciatica in over 16s",
        url: "https://www.nice.org.uk/guidance/ng59/chapter/Recommendations"
      },
      { label: "NHS: back pain", url: "https://www.nhs.uk/conditions/back-pain/" }
    ],
    related: [
      { label: "Self-tests", href: "/exercises/tests" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" },
      { label: "Does online physiotherapy work?", href: "/guides/does-online-physiotherapy-work" }
    ],
    publishedOn: "2026-10-01",
    reviewedOn: PHASE_BC_REVIEWED_ON
  },
  {
    slug: "what-online-physiotherapy-cannot-do",
    title: "What online physiotherapy cannot do",
    seoTitle: "What Online Physiotherapy Cannot Do | PhysioOnClick",
    seoDescription:
      "An honest list of what video physiotherapy cannot do, from hands-on treatment to red-flag symptoms, with what to do instead in each case.",
    answer:
      "Online physiotherapy cannot give hands-on treatment, handle emergencies, or replace in-person assessment when a problem needs it. Our video appointments cover the UK, and we also offer home visits in the Glasgow area, but we do not offer acupuncture or needles and we cannot give hands-on treatment over video. If you need hands-on care or urgent help, we say so and tell you where to go instead.",
    sections: [
      {
        heading: "Why we publish this page",
        paragraphs: [
          "Most of what we do is by video, and video care is not right for everyone. The Chartered Society of Physiotherapy backs a flexible blend of remote and in-person care, which means in-person care is the right answer for some people. We would rather say that plainly than keep you in a plan that does not fit.",
          "Below are the main things we cannot do, and what we suggest instead."
        ]
      },
      {
        heading: "Hands-on treatment",
        paragraphs: [
          "We cannot give manual therapy, such as hands-on joint mobilisation, over video, and we do not offer acupuncture or needles. We have no clinic or premises. If you are in the Glasgow area, you can book a home visit for an in-person assessment instead of a video call, and our home visits use the same booking flow and prices.",
          "Our service guidance says that if hands-on joint mobilisation is the main treatment a problem needs, you will be told at triage and pointed towards an in-person clinician or your GP. If you want hands-on care and you are outside the Glasgow area, look for a registered in-person physiotherapist near you. Check that they are on the HCPC Register, because physiotherapist is a protected title.",
          "It is worth knowing that national guidance is cautious about some hands-on approaches. NICE says manual therapy for low back pain should only be part of a package that includes exercise, and it advises against acupuncture for low back pain and for osteoarthritis."
        ]
      },
      {
        heading: "Sudden injury or a suspected fracture",
        paragraphs: [
          "If you have had a recent fall or accident and think you may have broken a bone, you need to be seen in person. We cannot examine a limb or order an X-ray over video.",
          "What to do instead: get in-person medical care straight away. For back pain after a serious accident, the NHS says to call 999 or go to A&E. Once you have been assessed and cleared, we can help with the exercise-based rehab that follows."
        ]
      },
      {
        heading: "Red-flag symptoms",
        paragraphs: [
          "Some symptoms are warning signs that need urgent medical care. For back pain and sciatica, the NHS says to call 999 or go to A&E if you have weakness or numbness in both legs, numbness around your genitals or anus, changes in your bladder or bowels, or if it started after a serious accident. The NHS also says not to drive yourself to A&E.",
          "A video appointment is not the right route for any of these. Our service guidance also lists unexplained weight loss, night pain that does not ease and progressive weakness as reasons to be pointed towards in-person care or your GP."
        ]
      },
      {
        heading: "Sudden neurological symptoms and complex presentations",
        paragraphs: [
          "Our neurological service guidance treats sudden new symptoms such as facial drooping, sudden weakness, slurred speech or a fall with injury as a medical emergency. Call 999 or go to A&E. It is not a physiotherapy appointment.",
          "In our neurological rehabilitation guidance, online sessions are for ongoing guided practice once you are medically stable and acute care is arranged, alongside your wider medical team. If we think you need hands-on assessment, we will tell you at triage. See our [neurological rehabilitation service](/services/neurological-rehabilitation) for more."
        ]
      },
      {
        heading: "Babies and very young children",
        paragraphs: [
          "In our paediatric service guidance, we explain that very young infants and complex conditions affecting several body systems are often better seen by an in-person paediatric specialist team, and we talk this through before booking.",
          "If a child has a new or worsening symptom, loss of a skill they had gained, unexplained pain or signs of injury, they need a GP or A&E assessment, not an online appointment. Read more about our [paediatric physiotherapy service](/services/paediatric-physiotherapy)."
        ]
      },
      {
        heading: "After surgery and with falls or mobility problems",
        paragraphs: [
          "Our post-surgical guidance sends wound checks, removal of stitches or staples, and any complication back to your surgical team for in-person review. Online sessions begin once you are medically cleared to start exercise-based rehab. See [post-surgical rehabilitation](/services/post-surgical-rehabilitation).",
          "For gait and mobility, our service guidance says a recent fall with injury, sudden weakness or acute pain affecting walking needs urgent in-person medical assessment first. It also says falls-risk tools that need hands-on testing, or a home hazard check, are better done in person. See our [gait and mobility assessment](/services/gait-and-mobility-assessment)."
        ]
      },
      {
        heading: "How to decide what to do next",
        paragraphs: [
          "If you think it might be an emergency, call 999 or go to A&E. If you are not sure, call 111 or speak to your GP. If your problem is not urgent but may need hands-on care, an in-person physiotherapist is the right choice.",
          "If it is a problem where exercise, advice and guided movement are the main treatment, video may well suit you. Read the evidence in our guide on [whether online physiotherapy works](/guides/does-online-physiotherapy-work), and [book an appointment](/book) if you want to go ahead."
        ]
      }
    ],
    faqs: [
      {
        q: "Do you offer manual therapy or acupuncture?",
        a: "We do not offer acupuncture or needles, and over video we cannot give hands-on treatment. If you are in the Glasgow area, you can book a home visit for an in-person assessment, and your physiotherapist will tell you what is appropriate for you. Elsewhere, we point you to an in-person clinician near you."
      },
      {
        q: "What if I think I have broken a bone?",
        a: "Get in-person medical care straight away. We cannot examine a suspected fracture over video."
      },
      {
        q: "What symptoms mean I should not book a video appointment?",
        a: "For back pain or sciatica, the NHS says to call 999 or go to A&E for weakness or numbness in both legs, numbness around the genitals or anus, bladder or bowel changes, or back pain after a serious accident. Our neurological service guidance also treats sudden facial drooping, sudden weakness or slurred speech as an emergency: call 999."
      },
      {
        q: "Will you tell me if online physio is not right for me?",
        a: "Yes. If triage shows that you need hands-on care or urgent help, we tell you plainly and point you to your GP, urgent care or an in-person clinician."
      }
    ],
    sources: [
      {
        label: "CSP news: mix of in-person and remote consultations",
        url: "https://www.csp.org.uk/news/2022-02-09-mix-person-remote-consultations-best-csp"
      },
      {
        label: "CSP: how to ensure remote consultation services are safe",
        url: "https://www.csp.org.uk/professional-clinical/professional-guidance/remote-consultations/csp-guidance-2"
      },
      { label: "NHS: back pain", url: "https://www.nhs.uk/conditions/back-pain/" },
      { label: "NHS: sciatica", url: "https://www.nhs.uk/conditions/sciatica/" },
      {
        label: "NICE NG59: low back pain and sciatica in over 16s",
        url: "https://www.nice.org.uk/guidance/ng59/chapter/Recommendations"
      },
      {
        label: "NICE NG226: osteoarthritis in over 16s",
        url: "https://www.nice.org.uk/guidance/ng226/chapter/Recommendations"
      },
      {
        label: "HCPC: professions and protected titles",
        url: "https://www.hcpc-uk.org/about-us/who-we-regulate/the-professions/"
      }
    ],
    related: [
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" },
      { label: "Does online physiotherapy work?", href: "/guides/does-online-physiotherapy-work" },
      { label: "Musculoskeletal physiotherapy", href: "/services/musculoskeletal-physiotherapy" }
    ],
    publishedOn: "2026-10-01",
    reviewedOn: PHASE_BC_REVIEWED_ON
  },
  {
    slug: "how-to-choose-an-online-physiotherapist-uk",
    title: "How to choose an online physiotherapist in the UK",
    seoTitle: "How to Choose an Online Physiotherapist UK | PhysioOnClick",
    seoDescription:
      "A plain checklist for choosing an online physiotherapist in the UK, plus the published prices and session lengths at four providers, checked on 2 October 2026.",
    answer:
      "Start by checking that the physiotherapist is on the HCPC Register, because physiotherapist is a protected title. Then compare what the first session includes, how long it lasts, what it costs, and what happens if video is not right for you. This guide gives you that checklist and the published prices we found at four UK providers.",
    sections: [
      {
        heading: "A checklist before you book",
        paragraphs: [
          "Check the HCPC Register. Anyone using the title physiotherapist must be on the HCPC Register, so this is the first check to make. On the HCPC site you pick the profession, then search by the person's name or their registration number. A status of Registered means the person is on the Register with no restrictions. You can start at the [HCPC check the Register page](https://www.hcpc-uk.org/check-the-register/).",
          "Ask what the CSP says about Chartered status. The Chartered Society of Physiotherapy explains that Chartered physiotherapists are CSP members who are also registered with the HCPC and who agree to follow the CSP's code and quality standards. Its directory helps you find a chartered physiotherapist near you. We only describe what the CSP says here; check any provider's own page for what it claims.",
          "Look at what the first session includes. This is general advice, not a rule. We would look for a provider that says clearly how long the first session is, whether it covers your history and a movement assessment, and whether you leave with a plan. If a provider does not say, ask before you pay.",
          "Look for price transparency. This is general advice: look for a price you can see before you book, with the session length next to it. Providers use 30, 45 and 60 minute sessions, so a lower headline price may buy a shorter session.",
          "Ask what happens if video is not right. Some problems need a hands-on examination or in-person care. Check that the provider tells you plainly if video is not suitable and what it would do instead. In our case, we tell you at triage or during your assessment, and we point you to your GP or an in-person clinician.",
          "If you plan to claim on health insurance, ask whether you get an itemised invoice, and ask your insurer first. See [claiming physiotherapy on health insurance](/guides/claim-physiotherapy-on-health-insurance) for how to approach it. We cannot promise that any insurer will pay."
        ]
      },
      {
        heading: "Prices at some UK providers (checked 2 October 2026)",
        paragraphs: [
          "We read the public price pages of four providers on 2 October 2026. This is a snapshot of published facts, not a league table, and it is not a complete list of UK providers. Prices may have changed since we checked, so look at each provider's own page before you book.",
          "Complete Physio, an online service, lists 125 pounds for a new patient appointment of 45 minutes for self-funding patients. Its follow-ups are 95 pounds for 30 minutes, 125 pounds for 45 minutes and 160 pounds for 60 minutes. Its page says appointments take place by private video call.",
          "PhysioFast Online lists 65 pounds for 45 minutes, which it suggests for a first appointment, and 47 pounds for 30 minutes. Its page describes online video appointments.",
          "Ascenti's page lists 44 pounds for 30 minutes of online physiotherapy. Its page describes live one-to-one video consultations through its app.",
          "Nuffield Health in Glasgow lists in-person physiotherapy for non-members at 72 pounds for a 45-minute initial assessment and 49 pounds for a 30-minute follow-up. We have labelled this price in person. The price page we read did not mention video, so we have not compared it on video.",
          "When you compare these, remember the session lengths differ: some of the prices above are for 30 minutes and some for 45 minutes. The first appointments we found range from 44 pounds for a 30-minute online session to 125 pounds for a 45-minute online one."
        ]
      },
      {
        heading: "Where we fit",
        paragraphs: [
          "PhysioOnClick is a physiotherapy service run by Shivaliba Zala, who is HCPC registered. Appointments are by video anywhere in the UK, or as home visits in the Glasgow area. Our first appointment is a 60-minute assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. You can see all prices, including session bundles, on the [pricing page](/pricing).",
          "After a paid session we send you an invoice as a PDF. It lists our HCPC registration number and the session you paid for. You can check that registration yourself on the HCPC Register using the steps above.",
          "There are things we do not offer. We have no clinic or premises, and we cannot give hands-on treatment over video. Home visits are available in the Glasgow area only. If your problem needs a physical examination or urgent care, we will say so and point you to the right place. If you want to know how well video can work, read [does online physiotherapy work?](/guides/does-online-physiotherapy-work)"
        ]
      }
    ],
    faqs: [
      {
        q: "How do I check a physiotherapist is registered?",
        a: "Use the HCPC Register search. Choose the profession, then search by the person's name or their registration number. A status of Registered means they are on the Register with no restrictions. Physiotherapist is a protected title in the UK."
      },
      {
        q: "What should a first online physio session include?",
        a: "This is general advice, so ask each provider what it offers. We would look for a clear session length, questions about your history, a movement assessment by video and a plan to follow afterwards. Ours is a 60-minute assessment, and we explain what we find."
      },
      {
        q: "What if online physiotherapy turns out not to suit me?",
        a: "Check that the provider tells you plainly if video is not suitable and what it would do instead. We tell you at triage or during the assessment if you need an in-person clinician or your GP. We cannot give hands-on treatment over video, home visits cover the Glasgow area only, and for emergency symptoms you should call 999 or go to A&E."
      },
      {
        q: "Are the prices on this page up to date?",
        a: "They were correct when we checked them on 2 October 2026, but prices may have changed since. Check the provider's own page before you book."
      }
    ],
    sources: [
      { label: "HCPC: check the Register", url: "https://www.hcpc-uk.org/check-the-register/" },
      { label: "HCPC: how to check the Register", url: "https://www.hcpc-uk.org/check-the-register/how-to-check/" },
      {
        label: "CSP: choose a Chartered physiotherapist",
        url: "https://www.csp.org.uk/public-patient/find-physiotherapist/why-chartered-physiotherapist"
      },
      { label: "CSP: find a physiotherapist", url: "https://www.csp.org.uk/public-patient/find-physiotherapist" },
      { label: "Complete Physio: online physiotherapy fees", url: "https://complete-physio.co.uk/online-physiotherapy/" },
      { label: "PhysioFast Online: appointment prices", url: "https://physiofastonline.co.uk/" },
      { label: "Ascenti: online appointments", url: "https://www.ascenti.co.uk/article/online-appointments" },
      { label: "Nuffield Health: Glasgow physiotherapy prices", url: "https://www.nuffieldhealth.com/physiotherapy/glasgow" }
    ],
    related: [
      { label: "Pricing and session bundles", href: "/pricing" },
      { label: "Does online physiotherapy work?", href: "/guides/does-online-physiotherapy-work" },
      { label: "Claiming physiotherapy on health insurance", href: "/guides/claim-physiotherapy-on-health-insurance" }
    ],
    publishedOn: "2026-10-02",
    reviewedOn: PHASE_BC_REVIEWED_ON
  }
];

export function getGuide(slug: string): Guide | null {
  return guides.find((g) => g.slug === slug) ?? null;
}

export function allGuideSlugs(): string[] {
  return guides.map((g) => g.slug);
}
