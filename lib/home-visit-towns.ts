// Town pages for home visits (/physiotherapy-home-visits/<slug>).
//
// Why these exist: rivals with a page per town (e.g. "Home Physiotherapy in
// Paisley") reach page 1 for "physio home visits <town>", while every town
// search of ours landed on the one Glasgow hub at position 30-100 (Search
// Console, Aug-Nov 2026). Competitor review 2026-11-23.
//
// Rules for this file, so the pages stay genuinely useful rather than
// swap-the-town-name doorway pages:
//   - Only towns inside HOME_VISIT_DISTRICTS (a test enforces it). Add a town
//     only when there is something true and local to say about it.
//   - Every fact must be checkable: postcode districts, neighbourhoods,
//     councils, NHS boards and hospitals. No travel times beyond "a short
//     drive", no claims about how many patients we see anywhere.
//   - No health-board claim for Rutherglen/Cambuslang: sources disagree on
//     whether NHS Greater Glasgow and Clyde or NHS Lanarkshire covers them.
//   - Prices, hours and the clinical-clearance sentences are NOT written here;
//     the page derives them from lib/home-visit-pricing, lib/appointment-hours
//     and the signed-off wording, so they can't drift.

export interface HomeVisitTownFaq {
  question: string;
  answer: string;
}

export interface HomeVisitTown {
  slug: string;
  /** Full name used in headings and body copy. */
  name: string;
  /** Shorter form for the <title> and description where needed. */
  shortName?: string;
  council: string;
  /** Postcode districts that make up the town itself (all must be covered). */
  districts: string[];
  /** Nearby places, each inside the home-visit area. */
  nearby: string[];
  /** Opening paragraph, specific to the town. */
  intro: string;
  /** A second, practical paragraph about visiting in this town. */
  localNote: string;
  hospital?: {
    name: string;
    board: string;
    note: string;
  };
  /** Set for towns in NHS Greater Glasgow and Clyde, whose MSK self-referral
   *  form can't take anyone who needs a home visit (checked 2026-11-20). */
  nhsggcSelfReferralNote?: boolean;
  faqs: HomeVisitTownFaq[];
}

export const homeVisitTowns: HomeVisitTown[] = [
  {
    slug: "paisley",
    name: "Paisley",
    council: "Renfrewshire",
    districts: ["PA1", "PA2", "PA3"],
    nearby: ["Renfrew", "Johnstone", "Linwood", "Elderslie", "Ralston", "Erskine"],
    intro:
      "We visit homes across Paisley, from the town centre and Ferguslie Park to Glenburn, Foxbar, Gallowhill and Ralston, and in the towns around it.",
    localNote:
      "Much of central Paisley is tenement flats with shared closes and stairs. If getting up and down yours is the problem, a home visit means we practise on those exact stairs rather than on a clinic step.",
    hospital: {
      name: "the Royal Alexandra Hospital",
      board: "NHS Greater Glasgow and Clyde",
      note: "If you've come home from the Royal Alexandra Hospital after a fall, a fracture or an operation, we can carry on your rehab in the house you actually have to manage: your stairs, your bathroom, your front step.",
    },
    nhsggcSelfReferralNote: true,
    faqs: [
      {
        question: "Do you cover Renfrew, Johnstone and Erskine as well as Paisley?",
        answer:
          "Yes. Renfrewshire and Inverclyde are inside our home-visit area, including Renfrew, Johnstone, Linwood, Bridge of Weir, Erskine, Bishopton, Greenock and Gourock, at the same price as Paisley.",
      },
    ],
  },
  {
    slug: "east-kilbride",
    name: "East Kilbride",
    council: "South Lanarkshire",
    districts: ["G74", "G75"],
    nearby: ["Thorntonhall", "Jackton", "Eaglesham", "Busby", "Carmunnock", "Strathaven"],
    intro:
      "Every part of East Kilbride is inside our home-visit area: the Village, Calderwood, The Murray, Westwood, Greenhills, St Leonards, Stewartfield and Lindsayfield, plus Thorntonhall and Jackton on the edge of town.",
    localNote:
      "Whether you live in one of Scotland's first new-town neighbourhoods or on a newer estate like Jackton, a home visit lets us work on the steps, kerbs and slopes you deal with every day rather than on a clinic floor.",
    hospital: {
      name: "University Hospital Hairmyres",
      board: "NHS Lanarkshire",
      note: "University Hospital Hairmyres sits on the western edge of East Kilbride. If you've been discharged from Hairmyres, we can pick up your rehab at home once your hospital team says you're ready.",
    },
    faqs: [
      {
        question: "Do you visit Eaglesham, Busby and Strathaven?",
        answer:
          "Yes. Eaglesham and Busby (G76) and Strathaven (ML10) are inside our home-visit area, at the same all-in price as East Kilbride.",
      },
    ],
  },
  {
    slug: "hamilton",
    name: "Hamilton",
    council: "South Lanarkshire",
    districts: ["ML3"],
    nearby: ["Blantyre", "Bothwell", "Uddingston", "Larkhall", "Quarter", "Ferniegair"],
    intro:
      "We visit homes all over Hamilton, including Burnbank, Hillhouse, Fairhill, Low Waters, Eddlewood and Whitehill, and the villages and towns around it.",
    localNote:
      "Hamilton sits between Glasgow and the rest of Lanarkshire, so it's well within reach for a visit before or after work. Bothwell, Uddingston and Blantyre are covered too, all at one price.",
    hospital: {
      name: "University Hospital Hairmyres and University Hospital Wishaw",
      board: "NHS Lanarkshire",
      note: "NHS Lanarkshire's nearest acute hospitals to Hamilton are University Hospital Hairmyres and University Hospital Wishaw. Whichever one you were in, we can continue your rehab at home once you've been told you're ready for it.",
    },
    faqs: [
      {
        question: "Do you visit Bothwell, Uddingston and Blantyre?",
        answer:
          "Yes. Bothwell and Uddingston (G71), Blantyre (G72) and Larkhall (ML9) are all inside our home-visit area, at the same price as Hamilton.",
      },
    ],
  },
  {
    slug: "motherwell-wishaw",
    name: "Motherwell and Wishaw",
    shortName: "Motherwell & Wishaw",
    council: "North Lanarkshire",
    districts: ["ML1", "ML2"],
    nearby: ["Bellshill", "Newarthill", "Carfin", "New Stevenston", "Overtown", "Newmains"],
    intro:
      "Home visits cover Motherwell and Wishaw and the places in between, from Newarthill, Carfin and New Stevenston to Overtown, Newmains and Bellshill.",
    localNote:
      "There's no extra charge for being further from the city: a visit in Wishaw or Newmains costs exactly the same as one in Glasgow.",
    hospital: {
      name: "University Hospital Wishaw",
      board: "NHS Lanarkshire",
      note: "University Hospital Wishaw serves Motherwell and Wishaw. If you've come home from Wishaw after a stroke, a fall or an operation, we can carry on your rehab in your own home once your team says you're ready.",
    },
    faqs: [
      {
        question: "Do you visit Bellshill, Coatbridge and Airdrie too?",
        answer:
          "Yes. Bellshill (ML4), Coatbridge (ML5) and Airdrie (ML6) are inside our home-visit area, along with Shotts, Carluke and Lanark, at the same price.",
      },
    ],
  },
  {
    slug: "clydebank",
    name: "Clydebank",
    council: "West Dunbartonshire",
    districts: ["G81"],
    nearby: ["Dalmuir", "Duntocher", "Hardgate", "Faifley", "Old Kilpatrick", "Dumbarton"],
    intro:
      "We visit homes across Clydebank, including Dalmuir, Drumry, Whitecrook, Linnvale, Duntocher, Hardgate and Faifley, and along the river to Old Kilpatrick, Bowling and Dumbarton.",
    localNote:
      "Clydebank is home to the Golden Jubilee University National Hospital, which NHS Golden Jubilee reported as the UK's largest hip and knee replacement centre in 2024/25. If you had your joint replaced there and live in our area, we can do your rehab at home.",
    hospital: {
      name: "the Golden Jubilee",
      board: "NHS Golden Jubilee",
      note: "The Golden Jubilee treats patients from all over Scotland. If you live outside our home-visit area, video sessions work anywhere in the UK, so you can still have follow-ups with us after a joint replacement there.",
    },
    nhsggcSelfReferralNote: true,
    faqs: [
      {
        question: "I had my knee or hip replaced at the Golden Jubilee. Can you help at home?",
        answer:
          "Yes, if you live in our home-visit area; if not, by video. After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Bring your discharge letter and any exercise sheet you were given to the first visit.",
      },
    ],
  },
  {
    slug: "rutherglen-cambuslang",
    name: "Rutherglen and Cambuslang",
    shortName: "Rutherglen & Cambuslang",
    council: "South Lanarkshire",
    districts: ["G73", "G72"],
    nearby: ["Burnside", "Fernhill", "Spittal", "Halfway", "Newton", "Blantyre"],
    intro:
      "Rutherglen and Cambuslang are a short drive from our base in Glasgow's East End, just across the Clyde. We visit Burnside, Fernhill, Spittal and Bankhead in Rutherglen, and Halfway, Westburn, Flemington and Newton in Cambuslang.",
    localNote:
      "Because the two towns are so close to us, they're among the easiest places to fit a visit around your day, any day from 9am to 9pm.",
    faqs: [
      {
        question: "Do you visit Blantyre and King's Park?",
        answer:
          "Yes. Blantyre (G72) and the Southside of Glasgow, including King's Park and Croftfoot (G44), are inside our home-visit area, at the same price.",
      },
    ],
  },
  {
    slug: "kilmarnock",
    name: "Kilmarnock",
    council: "East Ayrshire",
    districts: ["KA1", "KA2", "KA3"],
    nearby: ["Kilmaurs", "Stewarton", "Hurlford", "Crosshouse", "Fenwick", "Galston"],
    intro:
      "Kilmarnock and the villages around it are inside our home-visit area, down the M77 from Glasgow: Kilmaurs, Stewarton, Fenwick, Hurlford, Crosshouse and Galston included.",
    localNote:
      "We cover Kilmarnock at the same price as the city, with no travel charge, so being in Ayrshire doesn't cost you more.",
    hospital: {
      name: "University Hospital Crosshouse",
      board: "NHS Ayrshire & Arran",
      note: "University Hospital Crosshouse is just outside Kilmarnock. If you've been discharged from Crosshouse, we can continue your rehab at home once your team says you're ready.",
    },
    faqs: [
      {
        question: "Do you also visit Ayr, Troon and Irvine?",
        answer:
          "Yes. Ayr, Prestwick, Troon, Irvine, Kilwinning and Largs are inside our home-visit area too, at the same all-in price.",
      },
    ],
  },
];

export function getHomeVisitTown(slug: string): HomeVisitTown | undefined {
  return homeVisitTowns.find((t) => t.slug === slug);
}

export function homeVisitTownPath(slug: string): string {
  return `/physiotherapy-home-visits/${slug}`;
}
