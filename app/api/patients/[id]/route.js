import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT patient_id AS id, user_id, full_name AS "PATname",
              phone_no AS "PATphoneNO", sex, age, rsn AS "RSN",
              blood_type AS "bloodType", diagnosis, cancer_stage AS stage,
              next_visit AS "nextVisit", is_active
       FROM patients
       WHERE patient_id = $1`,
      [Number(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Patient not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error("Patient detail API error:", error);
    return NextResponse.json(
      { success: false, message: "Patient detail is not available." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist", "Oncology Nurse", "Patient"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { PATname, PATphoneNO, sex, RSN, diagnosis, stage, age, bloodType, nextVisit } =
      body;

    const result = await pool.query(
      `UPDATE patients
       SET full_name = COALESCE($1, full_name),
           phone_no = COALESCE($2, phone_no),
           sex = COALESCE($3, sex),
           rsn = COALESCE($4, rsn),
           diagnosis = COALESCE($5, diagnosis),
           cancer_stage = COALESCE($6, cancer_stage),
           age = COALESCE($7, age),
           blood_type = COALESCE($8, blood_type),
           next_visit = COALESCE($9, next_visit),
           updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $10
       RETURNING patient_id AS id, full_name AS "PATname", phone_no AS "PATphoneNO",
                 sex, age, rsn AS "RSN", diagnosis, cancer_stage AS stage,
                 blood_type AS "bloodType", next_visit AS "nextVisit"`,
      [
        PATname || null,
        PATphoneNO || null,
        sex || null,
        RSN || null,
        diagnosis || null,
        stage || null,
        age ? Number(age) : null,
        bloodType || null,
        nextVisit || null,
        Number(id),
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Patient not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error("Update patient API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update patient." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireRole(request, ["Admin"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const result = await pool.query(
      `UPDATE patients
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $1
       RETURNING patient_id AS id`,
      [Number(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Patient not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete patient API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not delete patient." },
      { status: 500 }
    );
  }
}
