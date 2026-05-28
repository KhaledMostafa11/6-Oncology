# General Oncology Department Platform

## Project Information

- Department: General Oncology Department
- Standard focus: Healthcare quality, patient safety, and interoperability standards
- Main technologies: Next.js, React, Tailwind CSS, PostgreSQL, Nodemailer, Google Calendar API

## Project Summary

This project is a frontend website and dashboard for a General Oncology Department. It supports patient visibility, treatment-unit monitoring, appointment scheduling, care-plan review, analytics, doctor prescriptions, patient image uploads, email communication, Google Calendar sync, a help assistant, and role-based navigation for admin, oncologist, oncology nurse, and patient users.

The project also includes a PostgreSQL database schema in `db.sql`. The website uses backend API routes and PostgreSQL for login, registration, patients, care plans, appointments, treatment units, profile management, and analytics.

## Website Pages

- `/` - Landing page for the oncology platform
- `/about` - Department overview
- `/about/standards` - Healthcare standards explanation
- `/about/team` - Team page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Role-based dashboard
- `/dashboard/patients` - Patient registry and patient care plan
- `/dashboard/appointments` - Treatment schedule and appointments
- `/dashboard/treatment-units` - Treatment units and resources
- `/dashboard/analytics` - Department and patient insights
- `/profile` - User profile

## Database Setup

1. Create a PostgreSQL database named `oncology_db`.
2. Open `db.sql` and run it in PostgreSQL.
3. Update `.env` if your PostgreSQL username or password is different:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oncology_db
DB_USER=postgres
DB_PASSWORD=
```

For Railway deployment, the app uses `DATABASE_URL` automatically.

## Optional Integrations

These variables are not committed to GitHub. Add them locally in `.env` and in Railway Variables when you want real integrations.

### Real Doctor Email

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_google_app_password
EMAIL_FROM=Oncology Department <yourgmail@gmail.com>
```

If these variables are missing, email sending is disabled and the API returns a configuration error.

### Real Google Calendar Sync

Create OAuth credentials in Google Cloud Console and enable the Google Calendar API. The redirect URL for Railway should be:

```text
https://6-oncology-production.up.railway.app/api/google/callback
```

Then add:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://6-oncology-production.up.railway.app/api/google/callback
```

For local testing, use:

```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

## Backend Features

- PostgreSQL connection through `lib/db.js`
- Signed authentication tokens
- Hashed passwords for newly registered users
- Login and registration APIs
- Patient create/read/update/delete APIs
- Care-plan create/read APIs
- Appointment create/read/update/cancel APIs
- Treatment-unit create/read/update/delete APIs
- Profile read/update APIs
- Analytics API
- Doctor-to-patient email API
- Google Calendar OAuth and event creation APIs
- Rule-based care assistant API
- Database-backed pages with clear error states if PostgreSQL is unavailable

## How To Run

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build for final verification:

```bash
npm run build
```

## Final Submission Name

The zipped project folder should be named:

```text
GROUP_NO_ONCOLOGY
```

Before submitting, replace `GROUP_NO` with the actual group number.
