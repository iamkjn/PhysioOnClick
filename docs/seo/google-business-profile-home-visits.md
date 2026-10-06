# Google Business Profile: setting up PhysioOnClick for home visits

A step-by-step guide for the owner. No technical knowledge needed. Google's screens change from time to time, so where a label below might differ, it says "look for".

## Why you can now have a profile

Google's rule for service-area businesses is that a business qualifies if it has in-person contact with customers at the customer's location. Before, the business was online only, which is why it was refused. Now that we offer home visits in the Glasgow area, you serve patients in person at their homes, so you are eligible as a service-area business.

You still have no clinic or premises. That is fine for a service-area business, as long as you never present your home address as a place patients visit.

## Before you start

- Use the Google account you want to own the business long term.
- Check whether the old, unverified listing from before still exists. Search for PhysioOnClick in Google Maps, or look in Business Profile Manager. If it exists, edit and claim that one. Do not create a second listing, because duplicates can get both suspended.
- Have to hand: your HCPC registration (PH155757), a recent invoice, and the branded items you take to visits.

## Step 1: Create or claim the profile

1. Go to business.google.com (Business Profile Manager) and sign in. Look for "Add your business to Google" or "Manage now".
2. Business name: PhysioOnClick. Use exactly this, with no extra keywords such as "Glasgow physio cheap".
3. Category: choose Physiotherapist as the primary category.

## Step 2: Service-area business, address hidden

1. When asked whether you want to add a location customers can visit, such as a shop or office, answer No. Look for wording like "Do you want to add a location customers can visit?"
2. When asked whether you serve customers outside your location, answer Yes. Look for "Add your service areas".
3. If Google asks for your business address for verification, enter the address, but make sure it is set to hidden from customers. Look for a tick box such as "Show business address to customers" and leave it unticked.
4. Later you can check this in the profile under Edit profile, then Business location or Service areas.

## Step 3: Service areas

Add Glasgow, and then only the localities you really cover for home visits. Google allows a limited number of areas, and they should be places you would genuinely travel to. Do not list places you do not cover.

Localities to confirm (owner to edit this list before entering it):

- Glasgow (city)
- [ ] Glasgow neighbourhoods: ____________________
- [ ] Nearby towns: ____________________

Keep this list in line with the website, which says "home visits in the Glasgow area" and that we confirm by email if an address is outside the area we cover.

## Step 4: Services

Under Services, look for Edit services and add:

- Home visit physiotherapy
- Online physiotherapy (video appointments across the UK)

For each, add a short description. Keep it factual, for example: "Physiotherapy at your home in the Glasgow area." and "Video physiotherapy appointments, anywhere in the UK." Prices are the same for both; check the current prices on https://physioonclick.co.uk/pricing before adding them.

## Step 5: Hours, phone and website

- Hours: enter the hours when patients can book appointments. If you only work by appointment, still set hours that match your booking calendar.
- Phone: use exactly the number shown on the website: +44 7557 684395.
- Website: https://physioonclick.co.uk/glasgow-physiotherapist (the home-visit page). Look for the Website field under Edit profile, Contact.
- Add a short description of the business (look for "From the business"). Mention HCPC registration, home visits in the Glasgow area and video appointments across the UK. Do not mention premises or a clinic.
- Add photos of you, branded equipment and the logo. Do not photograph the inside of a patient's home.

## Step 6: Verification

Google decides the method. It may be a postcard, a phone call, an email or a video. Do not assume which one you will get.

If it asks for a video:

- Show the branded kit you bring to home visits, such as a bag, ID badge, branded clothing or equipment.
- Show proof of the business: your HCPC registration, a recent invoice and your website.
- Show that you serve customers at their location, for example the booking page for home visits.
- Do not film inside your own home and describe it as premises. You have no premises. Say plainly that it is a service-area business and the address is hidden.
- Keep the video continuous, with no cuts, and follow Google's on-screen instructions.

If Google refuses, read the reason, fix what it says, and resubmit. Do not create a new listing.

## Step 7: Keep the details consistent (NAP)

NAP means Name, Address, Phone. Google and other directories compare them, so they should match across the website, Google and any directory listings.

- Name: PhysioOnClick (the trading name on the website and invoices).
- Phone: +44 7557 684395 (the single number the website publishes).
- Address: hidden on the Google profile, because this is a service-area business. The website's structured data still lists 7 Springfield Gardens, Glasgow G31 4HS, which is the address on invoices. Do not remove it from invoices. We should decide separately whether the website should keep publishing that street address now that Google will hide it.
- Website: https://physioonclick.co.uk.

If you add the business to other directories, use these same details exactly.

## After verification: reviews

- Ask happy patients to leave a Google review. Say thanks, and keep it personal, for example in person at the end of a visit or by a short message.
- Do not buy reviews, offer discounts or gifts for reviews, or only ask patients you expect to be positive. Google can remove reviews and suspend profiles for this.
- Do not write reviews yourself or ask family to.
- Reply to every review politely and briefly. Never put health details in a reply, and do not confirm that someone was a patient.
- The existing review-request automation reads an environment variable called GOOGLE_REVIEW_URL. Once the profile is verified, copy the review link from the profile (look for "Ask for reviews" or "Get more reviews"), and add it as GOOGLE_REVIEW_URL where the site's secrets are set. Currently Trustpilot is the main channel, and GOOGLE_REVIEW_URL is only a fallback direct link, so ask your developer to set it up if you want Google reviews requested automatically.

## Quick checklist

- [ ] Old listing found and claimed (no duplicate)
- [ ] Name PhysioOnClick, category Physiotherapist
- [ ] Service-area business, address hidden
- [ ] Service areas confirmed by you and entered
- [ ] Services added: Home visit physiotherapy, Online physiotherapy
- [ ] Hours, phone +44 7557 684395, website /glasgow-physiotherapist
- [ ] Verification completed
- [ ] Review link added as GOOGLE_REVIEW_URL (optional)
