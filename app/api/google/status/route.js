import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { googleCalendarConfigured } from "@/lib/google-calendar";

export async function GET(request) {
  const auth = requireRole(request, ["Admin", "Oncologist", "Oncology Nurse", "Patient"]);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, message: auth.message },
      { status: auth.status }
    );
  }

  if (!googleCalendarConfigured()) {
    return NextResponse.json({
      success: true,
      configured: false,
      connected: false,
      message: "Google Calendar variables are missing.",
    });
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS google_calendar_connections (
      connection_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TIMESTAMP NOT NULL,
      scope TEXT,
      connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const result = await pool.query(
    `SELECT connection_id FROM google_calendar_connections WHERE user_id = $1 LIMIT 1`,
    [Number(auth.user.id)]
  );

  return NextResponse.json({
    success: true,
    configured: true,
    connected: result.rowCount > 0,
  });
}
