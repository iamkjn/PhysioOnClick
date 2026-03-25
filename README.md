# PhysioOnClick

PhysioOnClick is a Next.js-based UK physiotherapy platform for in-person care in Glasgow and online rehabilitation across the UK. The repository includes:

- Public website pages for home, about, services, pricing, blog, symptom checker and Glasgow local SEO
- 108 generated blog articles across key physiotherapy categories
- Patient portal scaffolding with authentication, secure uploads, rehab tracking and exercise library
- Admin dashboard scaffolding for bookings, blogs, testimonials and revenue oversight
- Stripe checkout API route for appointment and package payments
- Firebase-ready config for Authentication, Firestore and Storage

## Stack

- Next.js 15 + React 19
- Firebase Authentication, Firestore and Storage
- Stripe Checkout
- Recharts for patient progress visuals

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add Firebase and Stripe keys.

3. Run the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Seed Firestore content

You can populate Firestore with the bundled blogs, services, pricing, testimonials, plus demo patient-facing collections so the site reads from Firebase instead of relying only on local fallback data.

1. Provide Firebase admin credentials through one of these options:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

or:

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

2. Run the seed script:

```bash
npm run seed:firestore
```

3. To seed only specific collections:

```bash
npm run seed:firestore -- --only=blogs,services,pricing,testimonials
```

To seed demo runtime collections as well:

```bash
npm run seed:firestore -- --only=symptomChecks,bookings,patients,exerciseVideos,rehabPrograms
```

The seed process upserts documents and adds `order`, `seededAt` and `updatedAt` fields where relevant. It does not delete old documents automatically.

For blog content, the seed script also uploads generated SVG cover images into Firebase Storage under `blog-images/` and stores the resulting download URLs in the `blogs` collection.

## Production checklist

1. Create a Firebase project and enable Authentication, Firestore and Storage.
2. Apply `firestore.rules` and `storage.rules`.
3. Add Stripe publishable and secret keys.
4. Configure a custom domain and set `NEXT_PUBLIC_SITE_URL`.
5. Replace demo copy such as email addresses, map embed details and review widget with live business data.
6. Extend the admin workflow to write blog, booking and patient data to Firestore collections.
7. Add branded transactional email delivery through Firebase Functions or your preferred provider.
8. Add Google Analytics, Search Console, sitemap generation and your preferred cookie consent flow.

## Suggested Firestore collections

- `blogs`
- `services`
- `pricing`
- `bookings`
- `patients`
- `symptomChecks`
- `testimonials`
- `exerciseVideos`
- `rehabPrograms`
- `payments`

## Notes

- The generated blog dataset lives in [`/Users/iamkjn/Documents/Playground/lib/blog.ts`](/Users/iamkjn/Documents/Playground/lib/blog.ts).
- Stripe checkout is implemented in [`/Users/iamkjn/Documents/Playground/app/api/checkout/route.ts`](/Users/iamkjn/Documents/Playground/app/api/checkout/route.ts).
- Firebase bootstrapping is implemented in [`/Users/iamkjn/Documents/Playground/lib/firebase.ts`](/Users/iamkjn/Documents/Playground/lib/firebase.ts).
