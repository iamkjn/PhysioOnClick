"use server";

import { revalidatePath } from "next/cache";

export async function cancelCalBooking(calBookingUid: string): Promise<void> {
  const res = await fetch(
    `https://api.cal.com/v2/bookings/${calBookingUid}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancellationReason: "Cancelled by clinic admin" }),
    }
  );

  if (!res.ok) {
    throw new Error(`Cal.com cancel failed: ${res.status}`);
  }

  revalidatePath("/admin");
}
