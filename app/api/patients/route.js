import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.patient_id AS id, p.full_name AS "PATname", p.phone_no AS "PATphoneNO",
              p.sex, p.age, p.rsn AS "RSN", p.diagnosis, p.cancer_stage AS stage,
              p.blood_type AS "bloodType", p.next_visit AS "nextVisit",
              COALESCE(u.email, '') AS email
       FROM patients p
       LEFT JOIN users u ON u.user_id = p.user_id
       WHERE p.is_active = TRUE
       ORDER BY p.patient_id`
    );

    return NextResponse.json({ success: true, patients: result.rows });
  } catch (error) {
    console.error("Patients API error:", error);
    return NextResponse.json(
      { success: false, message: "Patients database is not available." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist", "Oncology Nurse"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { PATname, PATphoneNO, sex, RSN, diagnosis, stage, age, bloodType } = body;

    if (!PATname || !PATphoneNO || !sex || !RSN || !diagnosis || !stage) {
      return NextResponse.json(
        { success: false, message: "Missing required patient fields." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO patients
        (full_name, phone_no, sex, rsn, diagnosis, cancer_stage, age, blood_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING patient_id AS id, full_name AS "PATname", phone_no AS "PATphoneNO",
                 sex, age, rsn AS "RSN", diagnosis, cancer_stage AS stage,
                 blood_type AS "bloodType", next_visit AS "nextVisit",
                 '' AS email`,
      [PATname, PATphoneNO, sex, RSN, diagnosis, stage, age || null, bloodType || null]
    );

    return NextResponse.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error("Create patient API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save patient." },
      { status: 500 }
    );
  }
}
