import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { getGoogleAuthUrl, googleCalendarConfigured } from "@/lib/google-calendar";

export async function GET(request) {
  const user = getBearerUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Authentication is required." },
      { status: 401 }
    );
  }

  if (!googleCalendarConfigured()) {
    return NextResponse.json({
      success: false,
      message: "Google Calendar is not configured yet.",
      setup: "Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "") || "";
  return NextResponse.json({ success: true, url: getGoogleAuthUrl(token) });
}
