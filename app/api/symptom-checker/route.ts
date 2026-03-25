import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { area, duration, severity } = (await request.json()) as {
    area?: string;
    duration?: string;
    severity?: string;
  };

  const recommendation =
    severity === "High"
      ? "Book an initial assessment promptly so symptoms can be screened safely."
      : "A routine assessment or online consultation may be appropriate if symptoms are stable.";

  return NextResponse.json({
    conditions: [`Possible ${area?.toLowerCase() || "musculoskeletal"} presentation`, `${duration || "Recent"} symptom pattern`],
    recommendation,
    disclaimer:
      "This response is educational only and does not replace individual medical advice, diagnosis or emergency care."
  });
}
