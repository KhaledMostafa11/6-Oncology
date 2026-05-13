const calendarScope = "https://www.googleapis.com/auth/calendar.events";

const envValue = (name) => (process.env[name] || "").trim();

export const googleCalendarConfigured = () =>
  Boolean(envValue("GOOGLE_CLIENT_ID") && envValue("GOOGLE_CLIENT_SECRET") && envValue("GOOGLE_REDIRECT_URI"));

export const getGoogleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: envValue("GOOGLE_CLIENT_ID"),
    redirect_uri: envValue("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    scope: calendarScope,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const exchangeGoogleCode = async (code) => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: envValue("GOOGLE_CLIENT_ID"),
      client_secret: envValue("GOOGLE_CLIENT_SECRET"),
      redirect_uri: envValue("GOOGLE_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.error_description || errorBody.error || "";
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(
      `Google token exchange failed${errorDetail ? `: ${errorDetail}` : ""}`
    );
  }

  return response.json();
};

export const refreshGoogleAccessToken = async (refreshToken) => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: envValue("GOOGLE_CLIENT_ID"),
      client_secret: envValue("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Could not refresh Google Calendar access.");
  }

  return response.json();
};

export const createGoogleCalendarEvent = async (accessToken, event) => {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorBody = await response.json();
      errorDetail =
        errorBody?.error?.message ||
        errorBody?.error_description ||
        errorBody?.error ||
        "";
    } catch {
      errorDetail = response.statusText;
    }

    throw new Error(
      `Could not create Google Calendar event${errorDetail ? `: ${errorDetail}` : ""}`
    );
  }

  return response.json();
};
