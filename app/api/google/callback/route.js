import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { exchangeGoogleCode, googleCalendarConfigured } from "@/lib/google-calendar";

const getAppRedirectUrl = (path) => {
  const configuredRedirect = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  const configuredAppUrl =
    (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.PUBLIC_URL || "").trim();

  const baseUrl =
    configuredAppUrl ||
    (configuredRedirect
      ? new URL(configuredRedirect).origin
      : "https://6-oncology-production.up.railway.app");
  return new URL(path, baseUrl);
};

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const user = verifyToken(state || "");

  if (!code) {
    return NextResponse.redirect(
      getAppRedirectUrl("/dashboard/appointments?calendar=failed&reason=missing-code")
    );
  }

  if (!user) {
    return NextResponse.redirect(
      getAppRedirectUrl("/dashboard/appointments?calendar=failed&reason=session-expired")
    );
  }

  if (!googleCalendarConfigured()) {
    return NextResponse.redirect(
      getAppRedirectUrl("/dashboard/appointments?calendar=failed&reason=missing-config")
    );
  }

  let tokenData;
  try {
    tokenData = await exchangeGoogleCode(code);
  } catch (error) {
    console.error("Google token exchange error:", error);
    const detail = encodeURIComponent(error.message || "token exchange failed");
    return NextResponse.redirect(
      getAppRedirectUrl(
        `/dashboard/appointments?calendar=failed&reason=token-exchange&detail=${detail}`
      )
    );
  }

  try {
    const expiresAt = new Date(
      Date.now() + Number(tokenData.expires_in || 3600) * 1000
    );

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

    await pool.query(
      `INSERT INTO google_calendar_connections
        (user_id, access_token, refresh_token, expires_at, scope)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_calendar_connections.refresh_token),
         expires_at = EXCLUDED.expires_at,
         scope = EXCLUDED.scope,
         connected_at = CURRENT_TIMESTAMP`,
      [
        Number(user.id),
        tokenData.access_token,
        tokenData.refresh_token || null,
        expiresAt,
        tokenData.scope || "calendar.events",
      ]
    );

    return NextResponse.redirect(
      getAppRedirectUrl("/dashboard/appointments?calendar=connected")
    );
  } catch (error) {
    console.error("Google calendar database save error:", error);
    return NextResponse.redirect(
      getAppRedirectUrl("/dashboard/appointments?calendar=failed&reason=db-save")
    );
  }
}
