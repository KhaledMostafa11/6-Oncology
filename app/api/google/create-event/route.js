import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  createGoogleCalendarEvent,
  googleCalendarConfigured,
  refreshGoogleAccessToken,
} from "@/lib/google-calendar";

const calendarTimeZone = "Africa/Cairo";

const normalizeDate = (value) => String(value || "").slice(0, 10);

const normalizeTime = (value) => String(value || "").slice(0, 5);

const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = normalizeTime(time).split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const safeTotal = ((totalMinutes % 1440) + 1440) % 1440;
  const nextHours = Math.floor(safeTotal / 60);
  const nextMinutes = safeTotal % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
};

const buildCalendarDateTime = (date, time) => {
  return `${normalizeDate(date)}T${normalizeTime(time)}:00`;
};

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist", "Oncology Nurse", "Patient"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    if (!googleCalendarConfigured()) {
      return NextResponse.json({
        success: false,
        message: "Google Calendar is not configured.",
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

    const connection = await pool.query(
      `SELECT access_token, refresh_token, expires_at
       FROM google_calendar_connections
       WHERE user_id = $1
       LIMIT 1`,
      [Number(auth.user.id)]
    );

    if (connection.rowCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Connect Google Calendar first.",
      });
    }

    const { appointment } = await request.json();
    if (!appointment?.date || !appointment?.start_time) {
      return NextResponse.json(
        { success: false, message: "Appointment date and time are required." },
        { status: 400 }
      );
    }

    let { access_token: accessToken } = connection.rows[0];
    const refreshToken = connection.rows[0].refresh_token;
    const expiresAt = new Date(connection.rows[0].expires_at);

    if (expiresAt <= new Date() && refreshToken) {
      const refreshed = await refreshGoogleAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      const nextExpiry = new Date(
        Date.now() + Number(refreshed.expires_in || 3600) * 1000
      );
      await pool.query(
        `UPDATE google_calendar_connections
         SET access_token = $1, expires_at = $2
         WHERE user_id = $3`,
        [accessToken, nextExpiry, Number(auth.user.id)]
      );
    }

    const endTime =
      appointment.end_time && appointment.end_time !== appointment.start_time
        ? normalizeTime(appointment.end_time)
        : addMinutesToTime(appointment.start_time, 45);

    const event = await createGoogleCalendarEvent(accessToken, {
      summary: `Oncology: ${appointment.protocol || appointment.type || "Appointment"}`,
      description: [
        `Patient: ${appointment.patientName || "Oncology patient"}`,
        `Treatment Unit: ${appointment.unitName || "To be assigned"}`,
        appointment.notes ? `Notes: ${appointment.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: buildCalendarDateTime(appointment.date, appointment.start_time),
        timeZone: calendarTimeZone,
      },
      end: {
        dateTime: buildCalendarDateTime(appointment.date, endTime),
        timeZone: calendarTimeZone,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
      message: "Appointment added to Google Calendar.",
    });
  } catch (error) {
    console.error("Create Google event error:", error);
    return NextResponse.json(
      { success: false, message: "Could not add appointment to Google Calendar." },
      { status: 500 }
    );
  }
}
