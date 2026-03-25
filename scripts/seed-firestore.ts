import { randomUUID } from "node:crypto";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { blogArticles } from "../lib/blog";
import { generateBlogCoverSvg } from "../lib/blog-image-svg";
import { generateServiceCoverSvg } from "../lib/service-image-svg";
import { exercises, pricing, services, testimonials } from "../lib/site-data";

type SeedTarget =
  | "blogs"
  | "services"
  | "pricing"
  | "testimonials"
  | "symptomChecks"
  | "bookings"
  | "patients"
  | "exerciseVideos"
  | "rehabPrograms";

const demoPatients = [
  {
    id: "demo-patient-sarah",
    email: "sarah.demo@physioonclick.co.uk",
    fullName: "Sarah Mitchell",
    phone: "07700 900111",
    location: "Glasgow",
    status: "active",
    createdAtLabel: "2026-03-12",
    goals: ["Walk comfortably after knee replacement", "Return to stairs without support"],
    notes: "Recovering well after right total knee replacement.",
    assignedProgramId: "rehab-program-knee-replacement"
  },
  {
    id: "demo-patient-james",
    email: "james.demo@physioonclick.co.uk",
    fullName: "James Robertson",
    phone: "07700 900222",
    location: "Edinburgh",
    status: "active",
    createdAtLabel: "2026-03-12",
    goals: ["Reduce lower back pain flare-ups", "Return to running twice weekly"],
    notes: "Desk-based worker with recurring lumbar pain.",
    assignedProgramId: "rehab-program-back-pain"
  },
  {
    id: "demo-patient-amina",
    email: "amina.demo@physioonclick.co.uk",
    fullName: "Amina Khan",
    phone: "07700 900333",
    location: "Glasgow",
    status: "review",
    createdAtLabel: "2026-03-12",
    goals: ["Improve shoulder control", "Restore overhead confidence"],
    notes: "Post-rotator cuff irritation with progressive strengthening plan.",
    assignedProgramId: "rehab-program-shoulder-rehab"
  }
] as const;

const demoBookings = [
  {
    id: "booking-sarah-initial",
    email: "sarah.demo@physioonclick.co.uk",
    service: "Initial Assessment",
    mode: "In-person",
    appointmentAt: "2026-03-19T10:30:00.000Z",
    status: "confirmed",
    amountPaid: 65
  },
  {
    id: "booking-james-online",
    email: "james.demo@physioonclick.co.uk",
    service: "Initial Online Assessment",
    mode: "Online",
    appointmentAt: "2026-03-21T18:00:00.000Z",
    status: "confirmed",
    amountPaid: 55
  },
  {
    id: "booking-amina-followup",
    email: "amina.demo@physioonclick.co.uk",
    service: "Follow-Up Session",
    mode: "In-person",
    appointmentAt: "2026-03-24T09:00:00.000Z",
    status: "pending",
    amountPaid: 50
  }
] as const;

const demoSymptomChecks = [
  {
    id: "symptom-check-shoulder",
    area: "Shoulder",
    duration: "1-4 weeks",
    severity: "Moderate - affects daily activities",
    symptoms: ["Pain during movement", "Weakness"],
    recommendation: "Initial Assessment recommended",
    potentialCondition: "Possible rotator cuff irritation"
  },
  {
    id: "symptom-check-back",
    area: "Lower Back",
    duration: "1-3 months",
    severity: "Moderate - affects daily activities",
    symptoms: ["Pain at rest", "Stiffness", "Difficulty sleeping"],
    recommendation: "Online Follow-Up or Initial Assessment recommended",
    potentialCondition: "Possible mechanical back pain"
  },
  {
    id: "symptom-check-knee",
    area: "Knee",
    duration: "3-6 months",
    severity: "Mild - slight discomfort",
    symptoms: ["Pain during movement", "Instability"],
    recommendation: "Follow-Up Session recommended",
    potentialCondition: "Possible patellofemoral or ligament-related issue"
  }
] as const;

const demoRehabPrograms = [
  {
    id: "rehab-program-knee-replacement",
    title: "Knee Replacement Recovery Programme",
    patientEmail: "sarah.demo@physioonclick.co.uk",
    stage: "Early to mid rehabilitation",
    exerciseIds: ["ex-1", "ex-4"],
    goals: ["Improve gait symmetry", "Build confidence on stairs"],
    notes: "Focus on sit-to-stand control, balance and walking tolerance."
  },
  {
    id: "rehab-program-back-pain",
    title: "Back Pain Confidence Programme",
    patientEmail: "james.demo@physioonclick.co.uk",
    stage: "Strength and movement confidence",
    exerciseIds: ["ex-3"],
    goals: ["Tolerate desk work", "Resume running"],
    notes: "Build trunk and hip strength with graded exposure to running load."
  },
  {
    id: "rehab-program-shoulder-rehab",
    title: "Shoulder Rehab Progression",
    patientEmail: "amina.demo@physioonclick.co.uk",
    stage: "Control and strengthening",
    exerciseIds: ["ex-2"],
    goals: ["Restore overhead control", "Improve loading tolerance"],
    notes: "Progress scapular setting into higher-load shoulder strengthening."
  }
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTargets(argv: string[]): SeedTarget[] {
  const onlyArg = argv.find((arg) => arg.startsWith("--only="));

  if (!onlyArg) {
    return [
      "blogs",
      "services",
      "pricing",
      "testimonials",
      "symptomChecks",
      "bookings",
      "patients",
      "exerciseVideos",
      "rehabPrograms"
    ];
  }

  const requested = onlyArg
    .replace("--only=", "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean) as SeedTarget[];

  const allowed: SeedTarget[] = [
    "blogs",
    "services",
    "pricing",
    "testimonials",
    "symptomChecks",
    "bookings",
    "patients",
    "exerciseVideos",
    "rehabPrograms"
  ];
  const invalid = requested.filter((value) => !allowed.includes(value));

  if (invalid.length) {
    throw new Error(`Unknown seed targets: ${invalid.join(", ")}`);
  }

  return requested.length ? requested : allowed;
}

function getAdminFirestore(): Firestore {
  if (!getApps().length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || "physioonclick.firebasestorage.app";

    if (rawServiceAccount) {
      initializeApp({
        credential: cert(JSON.parse(rawServiceAccount)),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "physioonclick",
        storageBucket
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "physioonclick",
        storageBucket
      });
    }
  }

  return getFirestore();
}

async function uploadBlogCover(article: (typeof blogArticles)[number]) {
  const bucket = getStorage().bucket();
  const filePath = `blog-images/${article.slug}.svg`;
  const token = randomUUID();
  const file = bucket.file(filePath);
  const svg = generateBlogCoverSvg(article);

  await file.save(Buffer.from(svg), {
    contentType: "image/svg+xml",
    resumable: false,
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
}

async function uploadServiceCover(service: (typeof services)[number]) {
  const bucket = getStorage().bucket();
  const filePath = `service-images/${service.slug}.svg`;
  const token = randomUUID();
  const file = bucket.file(filePath);
  const svg = generateServiceCoverSvg(service);

  await file.save(Buffer.from(svg), {
    contentType: "image/svg+xml",
    resumable: false,
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
}

async function seedBlogs(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, article] of blogArticles.entries()) {
    const storageImageUrl = await uploadBlogCover(article);
    const ref = db.collection("blogs").doc(article.slug);
    batch.set(
      ref,
      {
        ...article,
        image: storageImageUrl,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return blogArticles.length;
}

async function seedServices(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, service] of services.entries()) {
    const storageImageUrl = await uploadServiceCover(service);
    const ref = db.collection("services").doc(service.slug);
    batch.set(
      ref,
      {
        ...service,
        image: storageImageUrl,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return services.length;
}

async function seedPricing(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, item] of pricing.entries()) {
    const ref = db.collection("pricing").doc(slugify(item.title));
    batch.set(
      ref,
      {
        ...item,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return pricing.length;
}

async function seedTestimonials(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, item] of testimonials.entries()) {
    const ref = db.collection("testimonials").doc(slugify(`${item.name}-${item.focus}`));
    batch.set(
      ref,
      {
        ...item,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return testimonials.length;
}

async function seedPatients(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const patient of demoPatients) {
    const ref = db.collection("patients").doc(patient.id);
    batch.set(
      ref,
      {
        ...patient,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return demoPatients.length;
}

async function seedBookings(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const booking of demoBookings) {
    const ref = db.collection("bookings").doc(booking.id);
    batch.set(
      ref,
      {
        ...booking,
        createdAt: booking.appointmentAt,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return demoBookings.length;
}

async function seedSymptomChecks(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, check] of demoSymptomChecks.entries()) {
    const ref = db.collection("symptomChecks").doc(check.id);
    batch.set(
      ref,
      {
        ...check,
        createdAt: new Date(2026, 2, 10 + index).toISOString(),
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return demoSymptomChecks.length;
}

async function seedExerciseVideos(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, exercise] of exercises.entries()) {
    const ref = db.collection("exerciseVideos").doc(exercise.id);
    batch.set(
      ref,
      {
        ...exercise,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return exercises.length;
}

async function seedRehabPrograms(db: Firestore) {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const [index, program] of demoRehabPrograms.entries()) {
    const ref = db.collection("rehabPrograms").doc(program.id);
    batch.set(
      ref,
      {
        ...program,
        order: index,
        seededAt,
        updatedAt: seededAt
      },
      { merge: true }
    );
  }

  await batch.commit();
  return demoRehabPrograms.length;
}

async function main() {
  const targets = parseTargets(process.argv.slice(2));
  const db = getAdminFirestore();
  const results: Array<{ target: SeedTarget; count: number }> = [];

  if (targets.includes("blogs")) {
    results.push({ target: "blogs", count: await seedBlogs(db) });
  }

  if (targets.includes("services")) {
    results.push({ target: "services", count: await seedServices(db) });
  }

  if (targets.includes("pricing")) {
    results.push({ target: "pricing", count: await seedPricing(db) });
  }

  if (targets.includes("testimonials")) {
    results.push({ target: "testimonials", count: await seedTestimonials(db) });
  }

  if (targets.includes("patients")) {
    results.push({ target: "patients", count: await seedPatients(db) });
  }

  if (targets.includes("bookings")) {
    results.push({ target: "bookings", count: await seedBookings(db) });
  }

  if (targets.includes("symptomChecks")) {
    results.push({ target: "symptomChecks", count: await seedSymptomChecks(db) });
  }

  if (targets.includes("exerciseVideos")) {
    results.push({ target: "exerciseVideos", count: await seedExerciseVideos(db) });
  }

  if (targets.includes("rehabPrograms")) {
    results.push({ target: "rehabPrograms", count: await seedRehabPrograms(db) });
  }

  for (const result of results) {
    console.log(`Seeded ${result.count} documents into ${result.target}.`);
  }
}

main().catch((error) => {
  console.error("Firestore seed failed.");
  console.error(error);
  process.exit(1);
});
