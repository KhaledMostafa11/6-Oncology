import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      type,
      date,
      start_time,
      end_time,
      status,
      protocol,
      notes,
      unit_id,
      treatment_unit_id,
      doctor_id,
      nurse_id,
    } = body;

    const result = await pool.query(
      `UPDATE appointments
       SET appointment_type = COALESCE($1, appointment_type),
           appointment_date = COALESCE($2, appointment_date),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           status = COALESCE($5, status),
           protocol = COALESCE($6, protocol),
           notes = COALESCE($7, notes),
           unit_id = COALESCE($8, unit_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $9
       RETURNING appointment_id AS id, appointment_type AS type,
                 appointment_date AS date, start_time, end_time,
                 status, protocol, notes`,
      [
        type || null,
        date || null,
        start_time || null,
        end_time || null,
        status || null,
        protocol || null,
        notes || null,
        unit_id || treatment_unit_id ? Number(unit_id || treatment_unit_id) : null,
        Number(id),
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      );
    }

    if (doctor_id || nurse_id) {
      await pool.query(`DELETE FROM appointment_staff WHERE appointment_id = $1`, [
        Number(id),
      ]);
    }
    if (doctor_id) {
      await pool.query(
        `INSERT INTO appointment_staff (appointment_id, user_id, staff_role)
         VALUES ($1, $2, 'Oncologist')`,
        [Number(id), Number(doctor_id)]
      );
    }
    if (nurse_id) {
      await pool.query(
        `INSERT INTO appointment_staff (appointment_id, user_id, staff_role)
         VALUES ($1, $2, 'Oncology Nurse')`,
        [Number(id), Number(nurse_id)]
      );
    }

    return NextResponse.json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    console.error("Update appointment API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update appointment." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;
    const result = await pool.query(
      `UPDATE appointments
       SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $1
       RETURNING appointment_id AS id`,
      [Number(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, canceledId: result.rows[0].id });
  } catch (error) {
    console.error("Cancel appointment API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not cancel appointment." },
      { status: 500 }
    );
  }
}
