import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const result = await pool.query(
      `SELECT u.user_id AS id, u.first_name AS firstname, u.last_name AS lastname,
              u.email, u.phone, u.role,
              COALESCE(d.department_name, 'General Oncology Department') AS department,
              sp.specialization, sp.license_number AS "licenseNumber",
              sp.bio, sp.joined_date AS "joinedDate"
       FROM users u
       LEFT JOIN departments d ON d.department_id = u.department_id
       LEFT JOIN staff_profiles sp ON sp.user_id = u.user_id
       WHERE u.user_id = $1`,
      [Number(auth.user.id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    if (user.role === "Patient") {
      const patientStats = await pool.query(
        `SELECT
           COALESCE(SUM(cp.completed_sessions), 0)::int AS "completedSessions",
           COALESCE(SUM(cp.remaining_sessions), 0)::int AS "remainingSessions",
           COALESCE(
             (SELECT TO_CHAR(MIN(a.appointment_date), 'Mon DD, YYYY')
              FROM appointments a
              JOIN patients p2 ON p2.patient_id = a.patient_id
              WHERE p2.user_id = $1
                AND a.status = 'scheduled'
                AND a.appointment_date >= CURRENT_DATE),
             'Not scheduled'
           ) AS "nextFollowUp"
         FROM patients p
         LEFT JOIN care_plans cp ON cp.patient_id = p.patient_id AND cp.is_current = TRUE
         WHERE p.user_id = $1`,
        [Number(auth.user.id)]
      );
      user.patientStatistics = patientStats.rows[0] || {
        completedSessions: 0,
        remainingSessions: 0,
        nextFollowUp: "Not scheduled",
      };
    } else {
      const staffStats = await pool.query(
        `SELECT COUNT(DISTINCT p.patient_id)::int AS "totalCases"
         FROM patients p
         LEFT JOIN patient_care_team pct ON pct.patient_id = p.patient_id
         LEFT JOIN appointments a ON a.patient_id = p.patient_id
         LEFT JOIN appointment_staff ast ON ast.appointment_id = a.appointment_id
         WHERE p.is_active = TRUE
           AND (pct.user_id = $1 OR ast.user_id = $1)`,
        [Number(auth.user.id)]
      );
      user.totalCases = staffStats.rows[0]?.totalCases || 0;
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { success: false, message: "Profile is not available." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const auth = requireRole(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { firstname, lastname, email, phone, specialization, licenseNumber, bio } =
      body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             email = COALESCE($3, email),
             phone = COALESCE($4, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5
         RETURNING user_id AS id, first_name AS firstname, last_name AS lastname,
                   email, phone, role`,
        [
          firstname || null,
          lastname || null,
          email || null,
          phone || null,
          Number(auth.user.id),
        ]
      );

      if (auth.user.role !== "Patient") {
        await client.query(
          `INSERT INTO staff_profiles (user_id, specialization, license_number, bio)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE
           SET specialization = COALESCE(EXCLUDED.specialization, staff_profiles.specialization),
               license_number = COALESCE(EXCLUDED.license_number, staff_profiles.license_number),
               bio = COALESCE(EXCLUDED.bio, staff_profiles.bio)`,
          [
            Number(auth.user.id),
            specialization || null,
            licenseNumber || null,
            bio || null,
          ]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true, user: userResult.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update profile API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update profile." },
      { status: 500 }
    );
  }
}


