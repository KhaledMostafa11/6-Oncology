import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";

const ensurePrescriptionsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS prescriptions (
      prescription_id SERIAL PRIMARY KEY,
      patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
      prescribed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      medication VARCHAR(150) NOT NULL,
      instructions TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
};

export async function GET() {
  try {
    await ensurePrescriptionsTable();

    const result = await pool.query(
      `SELECT pr.prescription_id AS id, pr.patient_id,
              pr.medication, pr.instructions, pr.status,
              pr.created_at AS "createdAt",
              CONCAT(u.first_name, ' ', u.last_name) AS doctor
       FROM prescriptions pr
       LEFT JOIN users u ON u.user_id = pr.prescribed_by
       WHERE pr.status = 'active'
       ORDER BY pr.created_at DESC`
    );

    return NextResponse.json({ success: true, prescriptions: result.rows });
  } catch (error) {
    console.error("Prescriptions API error:", error);
    return NextResponse.json(
      { success: false, message: "Prescriptions database is not available." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["Admin", "Oncologist"]);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { patientId, medication, instructions } = body;

    if (!patientId || !medication || !instructions) {
      return NextResponse.json(
        { success: false, message: "Patient, medication, and instructions are required." },
        { status: 400 }
      );
    }

    await ensurePrescriptionsTable();

    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, prescribed_by, medication, instructions)
       VALUES ($1, $2, $3, $4)
       RETURNING prescription_id AS id, patient_id, medication, instructions,
                 status, created_at AS "createdAt"`,
      [Number(patientId), Number(auth.user.id), medication, instructions]
    );

    return NextResponse.json({
      success: true,
      prescription: {
        ...result.rows[0],
        doctor: `${auth.user.firstname || ""} ${auth.user.lastname || ""}`.trim(),
      },
    });
  } catch (error) {
    console.error("Create prescription API error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save prescription." },
      { status: 500 }
    );
  }
}
