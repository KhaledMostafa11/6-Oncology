import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

const typeToMinutes = {
  chemotherapy: 120,
  radiotherapy: 45,
  follow_up: 30,
  supportive_care: 30,
  lab_review: 30,
  oncology_review: 30,
  imaging_review: 30,
  nutrition_check_in: 30,
};

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT a.appointment_id AS id, a.patient_id, a.appointment_type AS type,
              a.appointment_date AS date, a.start_time, a.end_time,
              a.status, a.protocol, a.notes, a.attendance_status,
              p.full_name AS patient_name, p.rsn,
              tu.unit_name, tu.floor_number,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', u.user_id,
                      'DRname', CONCAT('Dr. ', u.first_name, ' ', u.last_name),
                      'SPEC', COALESCE(sp.specialization, 'Oncology')
                    )
                  )
                  FROM appointment_staff ast
                  JOIN users u ON u.user_id = ast.user_id
                  LEFT JOIN staff_profiles sp ON sp.user_id = u.user_id
                  WHERE ast.appointment_id = a.appointment_id
                    AND ast.staff_role IN ('Oncologist', 'Doctor')
                ),
                '[]'::json
              ) AS doctors,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', u.user_id,
                      'NUname', CONCAT(u.first_name, ' ', u.last_name)
                    )
                  )
                  FROM appointment_staff ast
                  JOIN users u ON u.user_id = ast.user_id
                  WHERE ast.appointment_id = a.appointment_id
                    AND ast.staff_role = 'Oncology Nurse'
                ),
                '[]'::json
              ) AS nurses
       FROM appointments a
       JOIN patients p ON p.patient_id = a.patient_id
       LEFT JOIN treatment_units tu ON tu.unit_id = a.unit_id
       WHERE a.status <> 'canceled'
       ORDER BY a.appointment_date, a.start_time`
    );

    return NextResponse.json({ success: true, appointments: result.rows });
  } catch (error) {
    console.error("Appointments API error:", error);
    return NextResponse.json(
      { success: false, message: "Appointments database is not available." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, [
      "Admin",
      "Oncologist",
      "Oncology Nurse",
      "Patient",
    ]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const {
      type,
      date,
      start_time,
      end_time,
      patient_id,
      treatment_unit_id,
      doctor_id,
      nurse_id,
      protocol,
      notes,
    } = body;

    if (!type || !date || !start_time || !patient_id || !protocol) {
      return NextResponse.json(
        { success: false, message: "Missing appointment fields." },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDay = new Date(`${date}T00:00:00`);
    if (appointmentDay < today) {
      return NextResponse.json(
        { success: false, message: "Appointments cannot be scheduled in the past." },
        { status: 400 }
      );
    }

    const safeType = type === "supportive_care" ? "supportive_care" : type;
    const finalEndTime =
      end_time ||
      new Date(
        new Date(`2000-01-01T${start_time}:00`).getTime() +
          (typeToMinutes[safeType] || 30) * 60 * 1000
      )
        .toTimeString()
        .slice(0, 5);

    if (treatment_unit_id) {
      const conflict = await pool.query(
        `SELECT appointment_id
         FROM appointments
         WHERE unit_id = $1
           AND appointment_date = $2
           AND status = 'scheduled'
           AND start_time < $4
           AND end_time > $3
         LIMIT 1`,
        [Number(treatment_unit_id), date, start_time, finalEndTime]
      );

      if (conflict.rowCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This treatment unit is already booked at the selected time.",
          },
          { status: 409 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO appointments
        (patient_id, unit_id, appointment_type, appointment_date, start_time,
         end_time, status, protocol, notes, patient_requested)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, $8, TRUE)
       RETURNING appointment_id AS id, appointment_type AS type,
                 appointment_date AS date, start_time, end_time,
                 status, protocol, notes`,
      [
        Number(patient_id),
        treatment_unit_id ? Number(treatment_unit_id) : null,
        safeType,
        date,
        start_time,
        finalEndTime,
        protocol,
        notes || "",
      ]
    );

    const appointmentId = result.rows[0].id;
    if (doctor_id) {
      await pool.query(
        `INSERT INTO appointment_staff (appointment_id, user_id, staff_role)
         VALUES ($1, $2, 'Oncologist')
         ON CONFLICT DO NOTHING`,
        [appointmentId, Number(doctor_id)]
      );
    }
    if (nurse_id) {
      await pool.query(
        `INSERT INTO appointment_staff (appointment_id, user_id, staff_role)
         VALUES ($1, $2, 'Oncology Nurse')
         ON CONFLICT DO NOTHING`,
        [appointmentId, Number(nurse_id)]
      );
    }

    return NextResponse.json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    console.error("Create appointment API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save appointment." },
      { status: 500 }
    );
  }
}
