import { NextResponse } from "next/server";

const normalize = (value) => String(value || "").toLowerCase();

const includesAny = (text, words) => words.some((word) => text.includes(word));

const pageGuide = (path) => {
  if (path.includes("/dashboard/appointments")) {
    return "You are on Treatment Schedule. Use this page to create appointments, choose doctor/unit/time, block double booking, cancel sessions, and sync confirmed sessions to Google Calendar.";
  }
  if (path.includes("/dashboard/patients")) {
    return "You are on Patient Registry. Use this page to open patient details, review care plans, write prescriptions, send patient emails, and review uploaded files.";
  }
  if (path.includes("/dashboard/treatment-units")) {
    return "You are on Treatment Units. Use this page to check oncology unit capacity and see which sessions are assigned to each room or unit.";
  }
  if (path.includes("/dashboard/analytics")) {
    return "You are on Analytics. These numbers come from PostgreSQL and summarize patients, appointments, follow-ups, treatment capacity, and session activity.";
  }
  return "You are on the main dashboard. Start with the guided cards: appointments for scheduling, patients for prescriptions and emails, and treatment units for capacity.";
};

const roleGuide = (role) => {
  if (role === "Patient") {
    return "As a patient, the clean flow is: open My Care Plan, choose/request an appointment, select a doctor and available time, then follow prescriptions and uploads from the patient area.";
  }
  if (role === "Admin") {
    return "As an admin, the clean flow is: manage users and department data, check units, review appointments, then use analytics to prove the database is working.";
  }
  return "As a doctor or nurse, the clean flow is: check today's appointments, open the patient record, write prescriptions or notes, then send communication when needed.";
};

const answers = [
  {
    keywords: ["what now", "what should", "next", "flow", "demo", "ta", "explain"],
    answer: ({ path, role }) =>
      `${pageGuide(path)} ${roleGuide(role)} For the TA, demonstrate this order: register/login, create appointment, prove double-booking is blocked, write prescription, send email, sync Google Calendar, then show PostgreSQL tables.`,
  },
  {
    keywords: ["appointment", "book", "schedule", "calendar", "doctor", "clinician", "choose doctor"],
    answer:
      "Appointment flow: patient chooses doctor, treatment type, unit, date, and time. The backend rejects past dates and overlapping bookings for the same unit. After Google Calendar is connected, click Sync to Google Calendar on the appointment card to create the real Google event.",
  },
  {
    keywords: ["not saved", "google", "calendar", "sync", "wrong time", "connected"],
    answer:
      "Google Calendar connection means OAuth worked. Saving an appointment to Calendar needs a separate sync call. On Treatment Schedule, click Sync to Google Calendar on the appointment card, then refresh Google Calendar at the exact appointment date/time. The app uses Africa/Cairo time.",
  },
  {
    keywords: ["prescription", "medicine", "drug", "email", "smtp", "send mail", "gmail"],
    answer:
      "Doctor communication flow: open Patients, select a patient, write a prescription, then send email from the same patient workspace. Real email uses one hospital sender account through Railway SMTP variables, so patients receive messages from the oncology department, not from each doctor’s personal Gmail.",
  },
  {
    keywords: ["database", "postgres", "sql", "data", "not available", "mock", "seed"],
    answer:
      "This project is database-first. Pages call backend API routes connected to PostgreSQL through DATABASE_URL. The removed seed/demo fallback means empty tables will look empty until real users, patients, appointments, units, prescriptions, or uploads are added.",
  },
  {
    keywords: ["double", "overlap", "same time", "conflict", "already booked"],
    answer:
      "Double booking is handled in the appointments API. Before inserting, it checks the same treatment unit, same date, scheduled status, and overlapping start/end times. If a conflict exists, the API returns an error instead of saving.",
  },
  {
    keywords: ["upload", "image", "scan", "report", "file"],
    answer:
      "Patient uploads belong in the patient record. The database includes patient_uploads so scans, reports, or images can be linked to the patient and reviewed by the care team.",
  },
  {
    keywords: ["register", "signup", "account", "admin", "staff"],
    answer:
      "Public registration is only for patients. Admins, doctors, and nurses are internal hospital accounts and should be created by the administrator or inserted into PostgreSQL.",
  },
  {
    keywords: ["error", "failed", "bug", "not working"],
    answer: ({ path }) =>
      `${pageGuide(path)} If you see an error, check three things: Railway variables, deploy logs, and whether the database table has real rows. Tell me the exact red message and I can map it to the likely backend route.`,
  },
  {
    keywords: ["urgent", "emergency", "fever", "pain", "medical advice"],
    answer:
      "For urgent symptoms, contact the hospital oncology team or emergency services immediately. This assistant explains the website and project workflow only; it does not give medical diagnosis.",
  },
];

export async function POST(request) {
  const { question = "", path = "", role = "" } = await request.json();
  const normalized = normalize(question);
  const match = answers.find((entry) => includesAny(normalized, entry.keywords));
  const answer =
    typeof match?.answer === "function"
      ? match.answer({ path: normalize(path), role })
      : match?.answer;

  return NextResponse.json({
    success: true,
    answer:
      answer ||
      `${pageGuide(normalize(path))} You can ask me about appointments, Google Calendar, prescriptions, email, uploads, PostgreSQL, login roles, or how to demo the project to the TA.`,
  });
}
