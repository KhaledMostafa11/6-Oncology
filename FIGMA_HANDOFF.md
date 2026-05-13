# Figma Handoff - General Oncology Department Platform

This handoff translates the current website UI into a Figma-ready design brief. Use it to rebuild the final screens as frames, or to present the design direction in the project discussion.

## Design Direction

- Style: clean clinical operations dashboard, light background, restrained color, readable data cards.
- Primary audience: oncology staff, patients, department leads, and teaching assistants reviewing the project.
- Main goal: make patient data, treatment schedules, treatment units, and standards content easy to scan.
- Avoid: dark glass panels, decorative blur blobs, oversized marketing sections, and raw database values in the interface.

## Core Tokens

- Page background: `#F8FAFC` (slate-50)
- Surface: `#FFFFFF`
- Muted surface: `#F1F5F9` (slate-100)
- Primary: `#0E7490` (cyan-700)
- Primary hover: `#155E75` (cyan-800)
- Text strong: `#020617` (slate-950)
- Text body: `#475569` (slate-600)
- Text muted: `#64748B` (slate-500)
- Border: `#E2E8F0` (slate-200)
- Radius: `8px`
- Card shadow: subtle, low elevation only
- Font: Arial or a similar neutral sans-serif

## Shared Components

- Header navigation:
  - White sticky navbar
  - ONC logo block on the left
  - Compact text links
  - Active link state: cyan-tinted background
  - Logout button: dark slate

- Card:
  - White background
  - 1px slate border
  - 8px radius
  - 20-24px padding
  - Light shadow

- Form controls:
  - White input background
  - Slate border
  - Cyan focus ring
  - Clear labels above fields

- Status messages:
  - Success: emerald-tinted background and border
  - Error: red-tinted background and border
  - No transparent glass alerts

## Figma Frames To Create

1. Homepage
   - Hero with project name and two actions: Sign In, View Project Details.
   - Metrics panel: Active Patients, Treatment Units, Follow-Ups, Care Workspaces.
   - Core Workspaces section: Patient Registry, Treatment Schedule, Treatment Units, Analytics.
   - Standards Context section.

2. Login
   - Centered auth card.
   - ONC logo, Welcome Back heading, quick test accounts, email/password fields, Sign In button.

3. Register
   - Centered two-column form.
   - Required fields, role/department selects, note panel, Create Account button.

4. Dashboard
   - Welcome heading.
   - Four KPI cards.
   - Quick Actions grid.
   - Help panel.

5. Patient Registry
   - Page heading and description.
   - Patient cards with readable dates, diagnosis, stage, and appointment counts.
   - Care-plan detail state for a selected patient.

6. Treatment Schedule
   - Schedule grouped by day.
   - Appointment cards with patient, clinician, unit, time, and status.
   - Patient appointment request form.

7. Treatment Units
   - Treatment unit groups.
   - Unit cards with floor, status, resources, and session count.

8. Analytics
   - KPI cards.
   - Treatment performance cards.
   - Department capacity indicators.

9. Profile
   - Initials avatar.
   - Profile information card.
   - Edit state with form fields.
   - Statistics card.

10. About, Standards, Team
   - Project overview.
   - Standards relationship cards.
   - Team task distribution cards.

## Prototype Flow

Login -> Dashboard -> Patients -> Treatment Schedule -> Treatment Units -> Analytics -> Profile.

Public flow: Homepage -> About -> Standards -> Team -> Login.

## Review Checklist

- Text does not overlap on desktop or mobile.
- Dates are user-friendly, not raw ISO timestamps.
- Database-backed screens still work with demo fallback.
- Pages use the same card, button, typography, and spacing rules.
- The UI and route names clearly say General Oncology, Treatment Units, Appointments, and Patient Registry.
